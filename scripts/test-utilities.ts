/**
 * Tests pure utility functions: country code normalization, retry logic,
 * epiweek conversion, FIPS lookups. No network, no DB.
 *
 * Usage: npm run test:utilities
 */
import { toAlpha3, fipsToState, hhsRegionName, epiweekToDate } from "@/pipeline/utils/country-codes.js";
import { withRetry } from "@/pipeline/utils/retry.js";

let passed = 0;
let failed = 0;

function assert(label: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${label} — got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
}

// ── toAlpha3 ──

console.log("\n── toAlpha3: standard country names ──");
assert("United States", toAlpha3("United States"), "USA");
assert("United States of America", toAlpha3("United States of America"), "USA");
assert("France", toAlpha3("France"), "FRA");
assert("Germany", toAlpha3("Germany"), "DEU");
assert("Brazil", toAlpha3("Brazil"), "BRA");
assert("Japan", toAlpha3("Japan"), "JPN");
assert("Australia", toAlpha3("Australia"), "AUS");

console.log("── toAlpha3: alpha-2 codes ──");
assert("US", toAlpha3("US"), "USA");
assert("UK", toAlpha3("UK"), "GBR");
assert("IN", toAlpha3("IN"), "IND");
assert("FR", toAlpha3("FR"), "FRA");
assert("DE", toAlpha3("DE"), "DEU");

console.log("── toAlpha3: alpha-3 passthrough ──");
assert("USA", toAlpha3("USA"), "USA");
assert("GBR", toAlpha3("GBR"), "GBR");
assert("FRA", toAlpha3("FRA"), "FRA");

console.log("── toAlpha3: disease.sh / WHO edge cases ──");
assert("Korea, South", toAlpha3("Korea, South"), "KOR");
assert("S. Korea", toAlpha3("S. Korea"), "KOR");
assert("Taiwan*", toAlpha3("Taiwan*"), "TWN");
assert("Congo (Kinshasa)", toAlpha3("Congo (Kinshasa)"), "COD");
assert("Congo (Brazzaville)", toAlpha3("Congo (Brazzaville)"), "COG");
assert("DRC", toAlpha3("DRC"), "COD");
assert("Cote d'Ivoire", toAlpha3("Cote d'Ivoire"), "CIV");
assert("Burma", toAlpha3("Burma"), "MMR");
assert("Czechia", toAlpha3("Czechia"), "CZE");
assert("Holy See", toAlpha3("Holy See"), "VAT");
assert("West Bank and Gaza", toAlpha3("West Bank and Gaza"), "PSE");
assert("Diamond Princess", toAlpha3("Diamond Princess"), "---");

console.log("── toAlpha3: unknown/empty inputs ──");
assert("empty string", toAlpha3(""), "UNK");
assert("gibberish", toAlpha3("Atlantis"), "UNK");

// ── fipsToState ──

console.log("\n── fipsToState ──");
assert("06 → California", fipsToState("06"), "California");
assert("36 → New York", fipsToState("36"), "New York");
assert("48 → Texas", fipsToState("48"), "Texas");
assert("6 (no padding) → California", fipsToState("6"), "California");
assert("99 → undefined", fipsToState("99"), undefined);

// ── hhsRegionName ──

console.log("\n── hhsRegionName ──");
assert("region 1", hhsRegionName(1), "HHS Region 1 (CT, ME, MA, NH, RI, VT)");
assert("region 9", hhsRegionName(9), "HHS Region 9 (AZ, CA, HI, NV)");
assert("region 99 (invalid)", hhsRegionName(99), "HHS Region 99 (unknown)");

// ── epiweekToDate ──

console.log("\n── epiweekToDate ──");
const w1 = epiweekToDate(202401);
assert("2024 week 1 is January", w1.getUTCMonth(), 0);
assert("2024 week 1 is a Sunday", w1.getUTCDay(), 0);
const w10 = epiweekToDate(202410);
assert("2024 week 10 is March", w10.getUTCMonth(), 2);

// ── withRetry (async, needs main wrapper) ──

async function testRetry() {
  console.log("\n── withRetry ──");

  let calls = 0;
  const r1 = await withRetry(async () => { calls++; return 42; }, "test", { baseDelayMs: 10 });
  assert("succeeds on first try: value", r1, 42);
  assert("succeeds on first try: call count", calls, 1);

  calls = 0;
  const r2 = await withRetry(async () => {
    calls++;
    if (calls < 3) throw new Error("transient");
    return "ok";
  }, "test", { baseDelayMs: 10 });
  assert("retries then succeeds: value", r2, "ok");
  assert("retries then succeeds: call count", calls, 3);

  calls = 0;
  let threw = false;
  try {
    await withRetry(
      async () => { calls++; throw new Error("permanent"); },
      "test",
      { maxRetries: 2, baseDelayMs: 10 },
    );
  } catch {
    threw = true;
  }
  assert("exhausts retries: threw", threw, true);
  assert("exhausts retries: call count", calls, 3);
}

testRetry().then(() => {
  console.log(`\n${"═".repeat(40)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log(`${"═".repeat(40)}\n`);
  process.exit(failed > 0 ? 1 : 0);
});
