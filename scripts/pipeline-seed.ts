/**
 * One-shot seed: runs every adapter once and prints results.
 * Usage: npm run pipeline:seed
 */
import { prisma } from "@/lib/prisma";
import { allAdapters } from "@/pipeline/adapters/index.js";
import { runAdapter } from "@/pipeline/orchestrator/runner.js";
import { logger } from "@/pipeline/utils/logger.js";

async function main() {
  logger.info("Pipeline seed — running all adapters once");
  await prisma.$connect();

  for (const adapter of allAdapters) {
    logger.info(`\n── ${adapter.name} ──`);
    await runAdapter(adapter);
  }

  const totalEvents = await prisma.outbreakEvent.count();
  const totalTS = await prisma.outbreakTimeSeries.count();
  const logs = await prisma.sourcePollLog.findMany({
    orderBy: { startedAt: "desc" },
    take: allAdapters.length,
  });

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
      "Poll result",
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
