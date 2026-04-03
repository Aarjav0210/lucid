/**
 * Smoke-tests each pipeline adapter against its live API: fetch raw data,
 * normalize it, and verify the output has the right shape. Requires network.
 *
 * Useful for catching upstream API changes (renamed fields, moved endpoints,
 * changed data formats) before they silently break the pipeline.
 *
 * Usage: npm run test:adapters
 *        npm run test:adapters -- --only=who_don,disease_sh
 */
import type { SourceAdapter, NormalizedEvent } from "@/pipeline/adapters/interface.js";
import { allAdapters } from "@/pipeline/adapters/index.js";

let passed = 0;
let failed = 0;
let warned = 0;

function pass(msg: string) { passed++; console.log(`  PASS  ${msg}`); }
function fail(msg: string) { failed++; console.error(`  FAIL  ${msg}`); }
function warn(msg: string) { warned++; console.log(`  WARN  ${msg}`); }

function validateEvent(e: NormalizedEvent, ctx: string) {
  if (!e.source) fail(`${ctx}: missing source`);
  if (!e.sourceId) fail(`${ctx}: missing sourceId`);
  if (!e.diseaseName) fail(`${ctx}: missing diseaseName`);
  if (!e.locationName) fail(`${ctx}: missing locationName`);
  if (!e.countryIso || e.countryIso.length !== 3) fail(`${ctx}: bad countryIso "${e.countryIso}"`);
  if (!(e.dateReported instanceof Date) || isNaN(e.dateReported.getTime())) fail(`${ctx}: bad dateReported`);
  if (!(e.lastReportDate instanceof Date) || isNaN(e.lastReportDate.getTime())) fail(`${ctx}: bad lastReportDate`);
  if (!e.rawData) fail(`${ctx}: missing rawData`);
}

const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlySet = onlyArg
  ? new Set(onlyArg.replace("--only=", "").split(","))
  : null;

const adapters = onlySet
  ? allAdapters.filter((a) => onlySet.has(a.source))
  : allAdapters;

async function testAdapter(adapter: SourceAdapter) {
  const label = `[${adapter.source}] ${adapter.name}`;
  console.log(`\n── ${label} ──`);

  let raw: unknown;
  try {
    raw = await adapter.fetch();
    pass("fetch() succeeded");
  } catch (err) {
    fail(`fetch() threw: ${(err as Error).message}`);
    return;
  }

  let events: NormalizedEvent[];
  let tsCount = 0;
  try {
    const result = adapter.normalize(raw);
    events = result.events;
    tsCount = result.timeSeries?.length ?? 0;
  } catch (err) {
    fail(`normalize() threw: ${(err as Error).message}`);
    return;
  }

  if (events.length > 0) {
    pass(`normalize() produced ${events.length} events` + (tsCount > 0 ? ` + ${tsCount} time series` : ""));
  } else {
    warn("normalize() returned 0 events (API may be empty or down)");
    return;
  }

  // Validate a sample of events
  const sample = events.slice(0, 5);
  let sampleValid = true;
  const prevFailed = failed;
  for (const e of sample) {
    validateEvent(e, e.sourceId);
  }
  if (failed === prevFailed) {
    pass(`${sample.length} sample events have valid required fields`);
  } else {
    sampleValid = false;
  }

  // Source-specific checks
  if (adapter.source === "disease_sh") {
    const hasCoords = events.some((e) => e.latitude != null && e.longitude != null);
    hasCoords ? pass("has lat/long coordinates") : fail("expected lat/long from disease.sh");

    const hasRecovered = events.some((e) => e.recoveredCount != null);
    hasRecovered ? pass("has recoveredCount") : warn("no recoveredCount in data");

    // caseCount should be todayCases (daily), not cumulative; verify rawData preserves totals
    const withRaw = events.find((e) => e.rawData && typeof e.rawData === "object");
    if (withRaw) {
      const raw = withRaw.rawData as Record<string, unknown>;
      const hasCumulativeInRaw = typeof raw.cases === "number" && raw.cases > 0;
      hasCumulativeInRaw
        ? pass("rawData preserves cumulative totals")
        : warn("rawData missing cumulative cases field");
    }

    const resolvedCount = events.filter((e) => e.status === "resolved").length;
    const activeCount = events.filter((e) => e.status === "active").length;
    pass(`status breakdown: ${activeCount} active, ${resolvedCount} resolved`);
  }

  if (adapter.source === "cdc_socrata") {
    const allUsa = events.every((e) => e.countryIso === "USA");
    allUsa ? pass("all events have countryIso=USA") : fail("expected all USA for CDC data");
  }

  if (adapter.source === "delphi_epidata") {
    const allUsa = events.every((e) => e.countryIso === "USA");
    allUsa ? pass("all events have countryIso=USA") : fail("expected all USA for Delphi data");

    if (tsCount > 0) pass("produced time series data");
    else warn("no time series (COVIDcast signal may be retired)");
  }

  if (adapter.source === "global_health") {
    const unkCount = events.filter((e) => e.countryIso === "UNK").length;
    if (unkCount === 0) pass("all events resolved to valid ISO codes");
    else warn(`${unkCount}/${events.length} events have countryIso=UNK`);
  }

  if (sampleValid && events.length > 0) {
    const e = events[0];
    console.log("  sample:", JSON.stringify({
      sourceId: e.sourceId,
      disease: e.diseaseName,
      location: `${e.locationName} (${e.countryIso})`,
      cases: e.caseCount,
    }));
  }
}

async function main() {
  console.log(`PandemicPulse — Adapter Smoke Tests`);
  console.log(`Testing ${adapters.length} adapter(s)...`);

  for (const adapter of adapters) {
    await testAdapter(adapter);
  }

  console.log(`\n${"═".repeat(40)}`);
  console.log(`  ${passed} passed, ${failed} failed, ${warned} warnings`);
  console.log(`${"═".repeat(40)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
