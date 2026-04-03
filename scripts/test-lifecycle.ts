/**
 * Runs the status lifecycle job and reports transitions.
 * Moves: active (>14 days stale) → monitoring, monitoring (>90 days stale) → resolved.
 *
 * Usage: npm run test:lifecycle
 */
import { prisma } from "@/lib/prisma";
import { runStatusLifecycle } from "@/pipeline/orchestrator/status-lifecycle.js";

async function main() {
  await prisma.$connect();

  const before = await prisma.outbreakEvent.groupBy({
    by: ["status"],
    _count: true,
  });

  console.log("\n── Before lifecycle run ──");
  for (const row of before) {
    console.log(`  ${row.status.padEnd(12)} ${row._count}`);
  }

  console.log("\n── Running status lifecycle ──");
  await runStatusLifecycle();

  const after = await prisma.outbreakEvent.groupBy({
    by: ["status"],
    _count: true,
  });

  console.log("\n── After lifecycle run ──");
  for (const row of after) {
    console.log(`  ${row.status.padEnd(12)} ${row._count}`);
  }

  console.log("\n── Diff ──");
  const beforeMap = new Map(before.map((r) => [r.status, r._count]));
  const afterMap = new Map(after.map((r) => [r.status, r._count]));
  for (const status of ["active", "monitoring", "contained", "resolved"] as const) {
    const b = beforeMap.get(status) ?? 0;
    const a = afterMap.get(status) ?? 0;
    const delta = a - b;
    if (delta !== 0) {
      console.log(`  ${status.padEnd(12)} ${b} → ${a}  (${delta > 0 ? "+" : ""}${delta})`);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Lifecycle test failed:", err);
  process.exit(1);
});
