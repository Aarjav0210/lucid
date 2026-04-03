import { prisma } from "@/lib/prisma";
import { allAdapters } from "./adapters/index.js";
import { runAllAdapters } from "./orchestrator/runner.js";
import { startScheduler } from "./orchestrator/scheduler.js";
import { logger } from "./utils/logger.js";

async function main() {
  logger.info("PandemicPulse pipeline starting");

  // Verify DB connection
  try {
    await prisma.$connect();
    logger.info("Database connected");
  } catch (err) {
    logger.fatal({ err }, "Failed to connect to database");
    process.exit(1);
  }

  // Check if DB is empty (first run → immediate seed)
  const count = await prisma.outbreakEvent.count();
  if (count === 0) {
    logger.info("Empty database detected — running initial seed");
    await runAllAdapters(allAdapters);
  } else {
    logger.info({ existingEvents: count }, "Database already seeded, starting scheduler only");
  }

  // Start cron scheduler
  startScheduler(allAdapters);
  logger.info("Scheduler started — pipeline is running");

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down...");
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, "Pipeline crashed");
  process.exit(1);
});
