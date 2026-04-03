import { prisma } from "@/lib/prisma";
import { childLogger } from "../utils/logger.js";

const log = childLogger("status-lifecycle");

const ACTIVE_TO_MONITORING_DAYS = 14;
const MONITORING_TO_CONTAINED_DAYS = 30;
const CONTAINED_TO_RESOLVED_DAYS = 90;

export async function runStatusLifecycle(): Promise<void> {
  const now = new Date();

  const monitoringCutoff = new Date(
    now.getTime() - ACTIVE_TO_MONITORING_DAYS * 86_400_000,
  );
  const containedCutoff = new Date(
    now.getTime() - MONITORING_TO_CONTAINED_DAYS * 86_400_000,
  );
  const resolvedCutoff = new Date(
    now.getTime() - CONTAINED_TO_RESOLVED_DAYS * 86_400_000,
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

  // monitoring → contained
  const toContained = await prisma.outbreakEvent.updateMany({
    where: {
      status: "monitoring",
      lastReportDate: { lt: containedCutoff },
    },
    data: { status: "contained" },
  });

  if (toContained.count > 0) {
    log.info(
      { count: toContained.count },
      "Transitioned monitoring → contained",
    );
  }

  // contained → resolved
  const toResolved = await prisma.outbreakEvent.updateMany({
    where: {
      status: "contained",
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
      "Transitioned contained → resolved",
    );
  }

  if (toMonitoring.count === 0 && toContained.count === 0 && toResolved.count === 0) {
    log.info("No status transitions needed");
  }
}
