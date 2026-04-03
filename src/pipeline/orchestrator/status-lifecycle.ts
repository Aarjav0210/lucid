import { prisma } from "@/lib/prisma";
import { childLogger } from "../utils/logger.js";

const log = childLogger("status-lifecycle");

const ACTIVE_TO_MONITORING_DAYS = 14;
const MONITORING_TO_RESOLVED_DAYS = 90;

export async function runStatusLifecycle(): Promise<void> {
  const now = new Date();

  const monitoringCutoff = new Date(
    now.getTime() - ACTIVE_TO_MONITORING_DAYS * 86_400_000,
  );
  const resolvedCutoff = new Date(
    now.getTime() - MONITORING_TO_RESOLVED_DAYS * 86_400_000,
  );

  // active → monitoring
  const toMonitoring = await prisma.outbreakEvent.updateMany({
    where: {
      status: "active",
      lastReportDate: { lt: monitoringCutoff },
    },
    data: { status: "monitoring" },
  });

  if (toMonitoring.count > 0) {
    log.info(
      { count: toMonitoring.count },
      "Transitioned active → monitoring",
    );
  }

  // monitoring → resolved
  const toResolved = await prisma.outbreakEvent.updateMany({
    where: {
      status: "monitoring",
      lastReportDate: { lt: resolvedCutoff },
    },
    data: {
      status: "resolved",
      resolutionDate: now,
    },
  });

  if (toResolved.count > 0) {
    log.info(
      { count: toResolved.count },
      "Transitioned monitoring → resolved",
    );
  }

  if (toMonitoring.count === 0 && toResolved.count === 0) {
    log.info("No status transitions needed");
  }
}
