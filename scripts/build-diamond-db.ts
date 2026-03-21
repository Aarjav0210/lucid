/**
 * Build/rebuild the curated DIAMOND database.
 *
 * Usage:
 *   npx tsx scripts/build-diamond-db.ts           # build (skips if exists)
 *   npx tsx scripts/build-diamond-db.ts --force    # force rebuild
 *
 * To add new sequences, edit:
 *   src/lib/diamond/curated-sequences.json
 *
 * Then re-run this script with --force.
 */

import { buildCuratedDatabase } from "../src/lib/diamond/database";

const force = process.argv.includes("--force");

buildCuratedDatabase(force)
  .then(() => {
    console.log("\nDone.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nBuild failed:", err.message);
    process.exit(1);
  });
