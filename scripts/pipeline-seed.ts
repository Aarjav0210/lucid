/**
 * One-shot seed: runs every adapter once and prints results.
 *
 * Usage:
 *   npm run pipeline:seed
 *   npm run pipeline:seed -- --only=cdc_socrata,delphi_epidata,global_health
 */
import { prisma } from "@/lib/prisma";
import { allAdapters } from "@/pipeline/adapters/index.js";
import { runAdapter } from "@/pipeline/orchestrator/runner.js";
import { logger } from "@/pipeline/utils/logger.js";

const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlySet = onlyArg
  ? new Set(
      onlyArg
        .replace("--only=", "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
  : null;

const validSources = new Set(allAdapters.map((a) => a.source));

function resolveAdapters() {
  if (!onlySet) return allAdapters;

  const unknown = [...onlySet].filter(
    (s) => !allAdapters.some((a) => a.source === s),
  );
  if (unknown.length > 0) {
    logger.error(
      { unknown, valid: [...validSources] },
      "Unknown --only source id(s). Use comma-separated Prisma enum values (e.g. cdc_socrata).",
    );
    process.exit(1);
  }

  const selected = allAdapters.filter((a) => onlySet.has(a.source));
  if (selected.length === 0) {
    logger.error("No adapters matched --only");
    process.exit(1);
  }
  return selected;
}

async function main() {
  const adapters = resolveAdapters();

  if (onlySet) {
    logger.info(
      { count: adapters.length, sources: adapters.map((a) => a.source) },
      "Pipeline seed — selected adapters only",
    );
  } else {
    logger.info("Pipeline seed — running all adapters once");
  }

  await prisma.$connect();

  for (const adapter of adapters) {
    logger.info(`\n── ${adapter.name} ──`);
    await runAdapter(adapter);
  }

  const totalEvents = await prisma.outbreakEvent.count();
  const totalTS = await prisma.outbreakTimeSeries.count();

  const logs = (
    await Promise.all(
      adapters.map((adapter) =>
        prisma.sourcePollLog.findFirst({
          where: { source: adapter.source },
          orderBy: { startedAt: "desc" },
        }),
      ),
    )
  ).filter((row): row is NonNullable<typeof row> => row != null);

  logger.info("\n── Seed Summary ──");
  logger.info({ totalEvents, totalTimeSeries: totalTS }, "Database totals");

  for (const log of logs) {
    logger.info(
      {
        source: log.source,
        status: log.status,
        fetched: log.eventsFetched,
        created: log.eventsCreated,
        updated: log.eventsUpdated,
        error: log.errorMessage,
      },
      "Poll result (latest log for this source)",
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
