import { prisma } from "@/lib/prisma";
import type { NormalizedEvent, TimeSeriesEntry } from "../adapters/interface.js";
import { childLogger } from "../utils/logger.js";
import { getCountryCentroid } from "../utils/country-centroids.js";

const log = childLogger("upsert");

/** Batched upserts per transaction (fewer round trips than one-by-one on remote Postgres). */
const UPSERT_TX_BATCH = 25;

function isConnectionClosedError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P1017"
  );
}

async function withDbReconnect<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isConnectionClosedError(err)) throw err;
    log.warn("Database connection closed (P1017); reconnecting and retrying once");
    await prisma.$disconnect().catch(() => {});
    await prisma.$connect();
    return await fn();
  }
}

export interface UpsertResult {
  created: number;
  updated: number;
}

const BATCH_SIZE = 500;

/**
 * Insert-only path for temporal adapters: uses createMany + skipDuplicates
 * for dramatically better throughput on large historical datasets.
 */
export async function batchCreateEvents(events: NormalizedEvent[]): Promise<UpsertResult> {
  const viable = events.filter((e) => e.caseCount == null || e.caseCount > 0);
  if (viable.length < events.length) {
    log.info(
      { skipped: events.length - viable.length, kept: viable.length },
      "Filtered out events with zero reported cases",
    );
  }

  const records = viable.map((event) => {
    const centroid =
      event.latitude == null && event.countryIso !== "UNK"
        ? getCountryCentroid(event.countryIso)
        : null;
    return {
      source: event.source,
      sourceId: event.sourceId,
      diseaseName: event.diseaseName,
      pathogenName: event.pathogenName ?? null,
      pathogenType: event.pathogenType ?? null,
      hostSpeciesCategory: event.hostSpeciesCategory,
      hostSpeciesDetail: event.hostSpeciesDetail ?? null,
      status: event.status,
      locationName: event.locationName,
      countryIso: event.countryIso,
      adminRegion: event.adminRegion ?? null,
      latitude: event.latitude ?? centroid?.latitude ?? null,
      longitude: event.longitude ?? centroid?.longitude ?? null,
      dateReported: event.dateReported,
      dateOnset: event.dateOnset ?? null,
      lastReportDate: event.lastReportDate,
      resolutionDate: event.resolutionDate ?? null,
      caseCount: event.caseCount ?? null,
      deathCount: event.deathCount ?? null,
      recoveredCount: event.recoveredCount ?? null,
      sourceUrl: event.sourceUrl ?? null,
      rawData: event.rawData as object,
    };
  });

  let created = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const result = await prisma.outbreakEvent.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    created += result.count;
  }

  log.info(
    { total: viable.length, created, skippedDuplicates: viable.length - created },
    "Batch create complete",
  );
  return { created, updated: 0 };
}

function outbreakEventUpsert(event: NormalizedEvent) {
  const centroid =
    event.latitude == null && event.countryIso !== "UNK"
      ? getCountryCentroid(event.countryIso)
      : null;
  const lat = event.latitude ?? centroid?.latitude ?? null;
  const lng = event.longitude ?? centroid?.longitude ?? null;

  return prisma.outbreakEvent.upsert({
    where: {
      source_source_id: {
        source: event.source,
        sourceId: event.sourceId,
      },
    },
    create: {
      source: event.source,
      sourceId: event.sourceId,
      diseaseName: event.diseaseName,
      pathogenName: event.pathogenName ?? null,
      pathogenType: event.pathogenType ?? null,
      hostSpeciesCategory: event.hostSpeciesCategory,
      hostSpeciesDetail: event.hostSpeciesDetail ?? null,
      status: event.status,
      locationName: event.locationName,
      countryIso: event.countryIso,
      adminRegion: event.adminRegion ?? null,
      latitude: lat,
      longitude: lng,
      dateReported: event.dateReported,
      dateOnset: event.dateOnset ?? null,
      lastReportDate: event.lastReportDate,
      resolutionDate: event.resolutionDate ?? null,
      caseCount: event.caseCount ?? null,
      deathCount: event.deathCount ?? null,
      recoveredCount: event.recoveredCount ?? null,
      sourceUrl: event.sourceUrl ?? null,
      rawData: event.rawData as object,
    },
    update: {
      caseCount: event.caseCount ?? undefined,
      deathCount: event.deathCount ?? undefined,
      recoveredCount: event.recoveredCount ?? undefined,
      lastReportDate: event.lastReportDate,
      ...(event.status === "resolved" && {
        status: "resolved" as const,
        resolutionDate: new Date(),
      }),
      latitude: lat ?? undefined,
      longitude: lng ?? undefined,
      rawData: event.rawData as object,
    },
    select: { createdAt: true, updatedAt: true },
  });
}

function tallyUpsertResult(result: { createdAt: Date; updatedAt: Date }): "created" | "updated" {
  return result.createdAt.getTime() === result.updatedAt.getTime() ? "created" : "updated";
}

export async function upsertEvents(events: NormalizedEvent[]): Promise<UpsertResult> {
  let created = 0;
  let updated = 0;

  const viable = events.filter((e) => e.caseCount == null || e.caseCount > 0);
  if (viable.length < events.length) {
    log.info(
      { skipped: events.length - viable.length, kept: viable.length },
      "Filtered out events with zero reported cases",
    );
  }

  for (let i = 0; i < viable.length; i += UPSERT_TX_BATCH) {
    const chunk = viable.slice(i, i + UPSERT_TX_BATCH);

    try {
      const results = await withDbReconnect(() =>
        prisma.$transaction(chunk.map((event) => outbreakEventUpsert(event))),
      );

      for (const result of results) {
        if (tallyUpsertResult(result) === "created") created++;
        else updated++;
      }
    } catch (err) {
      log.warn(
        { err, chunkStart: i, chunkSize: chunk.length },
        "Batch upsert failed; retrying rows individually",
      );
      for (const event of chunk) {
        try {
          const result = await withDbReconnect(() => outbreakEventUpsert(event));
          if (tallyUpsertResult(result) === "created") created++;
          else updated++;
        } catch (oneErr) {
          log.error(
            { err: oneErr, source: event.source, sourceId: event.sourceId },
            "Failed to upsert event",
          );
        }
      }
    }

    const done = Math.min(i + UPSERT_TX_BATCH, viable.length);
    if (done % 5000 === 0 || done === viable.length) {
      log.info({ upserted: done, total: viable.length }, "Upsert progress");
    }
  }

  return { created, updated };
}

export async function upsertTimeSeries(
  source: NormalizedEvent["source"],
  entries: TimeSeriesEntry[],
): Promise<number> {
  let upserted = 0;

  // Look up outbreak event IDs by sourceId
  const sourceIds = [...new Set(entries.map((e) => e.sourceId))];
  const outbreakEvents = await prisma.outbreakEvent.findMany({
    where: { source, sourceId: { in: sourceIds } },
    select: { id: true, sourceId: true },
  });

  const idMap = new Map(outbreakEvents.map((e) => [e.sourceId, e.id]));

  for (const entry of entries) {
    const outbreakEventId = idMap.get(entry.sourceId);
    if (!outbreakEventId) continue;

    try {
      await prisma.outbreakTimeSeries.upsert({
        where: {
          outbreakEventId_date: {
            outbreakEventId,
            date: entry.date,
          },
        },
        create: {
          outbreakEventId,
          date: entry.date,
          cumulativeCases: entry.cumulativeCases ?? null,
          cumulativeDeaths: entry.cumulativeDeaths ?? null,
          newCases: entry.newCases ?? null,
          newDeaths: entry.newDeaths ?? null,
        },
        update: {
          cumulativeCases: entry.cumulativeCases ?? undefined,
          cumulativeDeaths: entry.cumulativeDeaths ?? undefined,
          newCases: entry.newCases ?? undefined,
          newDeaths: entry.newDeaths ?? undefined,
        },
      });
      upserted++;
    } catch (err) {
      log.error({ err, sourceId: entry.sourceId }, "Failed to upsert time series entry");
    }
  }

  return upserted;
}
