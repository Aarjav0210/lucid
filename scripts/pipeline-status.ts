/**
 * Status report: prints current DB state for the pipeline.
 * Usage: npm run pipeline:status
 */
import { prisma } from "@/lib/prisma";

async function main() {
  await prisma.$connect();

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║          PandemicPulse — Pipeline Status         ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // Events by source and status
  const bySource = await prisma.outbreakEvent.groupBy({
    by: ["source", "status"],
    _count: true,
    orderBy: { source: "asc" },
  });

  console.log("─── Events by Source & Status ───");
  const sourceTable: Record<string, Record<string, number>> = {};
  for (const row of bySource) {
    if (!sourceTable[row.source]) sourceTable[row.source] = {};
    sourceTable[row.source][row.status] = row._count;
  }
  for (const [source, statuses] of Object.entries(sourceTable)) {
    const total = Object.values(statuses).reduce((a, b) => a + b, 0);
    const breakdown = Object.entries(statuses)
      .map(([s, c]) => `${s}=${c}`)
      .join(", ");
    console.log(`  ${source.padEnd(18)} ${String(total).padStart(6)} total  (${breakdown})`);
  }

  const grandTotal = await prisma.outbreakEvent.count();
  console.log(`  ${"TOTAL".padEnd(18)} ${String(grandTotal).padStart(6)} events`);

  // Time series count
  const tsCount = await prisma.outbreakTimeSeries.count();
  console.log(`\n  Time series entries: ${tsCount}`);

  // Last successful poll per source
  console.log("\n─── Last Successful Poll ───");
  const sources = [
    "who_don", "disease_sh", "delphi_epidata", "cdc_socrata", "global_health",
  ] as const;

  for (const source of sources) {
    const lastPoll = await prisma.sourcePollLog.findFirst({
      where: { source, status: "success" },
      orderBy: { completedAt: "desc" },
    });
    if (lastPoll) {
      console.log(
        `  ${source.padEnd(18)} ${lastPoll.completedAt?.toISOString() ?? "n/a"}  ` +
        `(fetched=${lastPoll.eventsFetched}, created=${lastPoll.eventsCreated}, updated=${lastPoll.eventsUpdated})`,
      );
    } else {
      console.log(`  ${source.padEnd(18)} never`);
    }
  }

  // Recent events
  console.log("\n─── 10 Most Recently Updated Events ───");
  const recent = await prisma.outbreakEvent.findMany({
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      source: true,
      diseaseName: true,
      locationName: true,
      countryIso: true,
      status: true,
      caseCount: true,
      deathCount: true,
      updatedAt: true,
    },
  });

  for (const e of recent) {
    const cases = e.caseCount != null ? `cases=${e.caseCount}` : "cases=n/a";
    const deaths = e.deathCount != null ? `deaths=${e.deathCount}` : "";
    console.log(
      `  [${e.source}] ${e.diseaseName} — ${e.locationName} (${e.countryIso}) ` +
      `${e.status} ${cases} ${deaths} updated=${e.updatedAt.toISOString()}`,
    );
  }

  // Failed polls in last 24h
  const since = new Date(Date.now() - 86_400_000);
  const failures = await prisma.sourcePollLog.findMany({
    where: { status: "failed", startedAt: { gte: since } },
    orderBy: { startedAt: "desc" },
  });

  if (failures.length > 0) {
    console.log(`\n─── Failed Polls (last 24h): ${failures.length} ───`);
    for (const f of failures) {
      console.log(
        `  [${f.source}] ${f.startedAt.toISOString()} — ${f.errorMessage}`,
      );
    }
  } else {
    console.log("\n  No failed polls in the last 24 hours.");
  }

  console.log("");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Status check failed:", err);
  process.exit(1);
});
