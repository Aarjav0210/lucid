import { prisma } from "@/lib/prisma";
import type { SourceAdapter } from "../adapters/interface.js";
import { upsertEvents, upsertTimeSeries } from "../db/upsert.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("runner");

export async function runAdapter(adapter: SourceAdapter): Promise<void> {
  const startedAt = new Date();
  log.info({ source: adapter.source }, `Starting poll: ${adapter.name}`);

  try {
    const rawData = await adapter.fetch();
    const { events, timeSeries } = adapter.normalize(rawData);

    const { created, updated } = await upsertEvents(events);

    let tsUpserted = 0;
    if (timeSeries?.length) {
      tsUpserted = await upsertTimeSeries(adapter.source, timeSeries);
    }

    const completedAt = new Date();

    await prisma.sourcePollLog.create({
      data: {
        source: adapter.source,
        startedAt,
        completedAt,
        status: "success",
        eventsFetched: events.length,
        eventsCreated: created,
        eventsUpdated: updated,
      },
    });

    log.info(
      {
        source: adapter.source,
        fetched: events.length,
        created,
        updated,
        timeSeriesUpserted: tsUpserted,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      },
      `Poll complete: ${adapter.name}`,
    );
  } catch (err) {
    const completedAt = new Date();
    const errorMessage = err instanceof Error ? err.message : String(err);

    await prisma.sourcePollLog
      .create({
        data: {
          source: adapter.source,
          startedAt,
          completedAt,
          status: "failed",
          errorMessage,
        },
      })
      .catch((logErr) => {
        log.error({ logErr }, "Failed to write poll log");
      });

    log.error(
      {
        source: adapter.source,
        err,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      },
      `Poll failed: ${adapter.name}`,
    );
  }
}

export async function runAllAdapters(adapters: SourceAdapter[]): Promise<void> {
  log.info({ count: adapters.length }, "Running initial seed for all adapters");

  const results = await Promise.allSettled(
    adapters.map((adapter) => runAdapter(adapter)),
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  log.info(
    { total: adapters.length, succeeded: adapters.length - failed, failed },
    "Initial seed complete",
  );
}
