/**
 * Integration test: end-to-end screening pipeline.
 *
 * Takes a protein sequence, runs:
 *   1. InterPro domain scan
 *   2. Per-domain Diamond alignment (parallel)
 *   3. ESMFold + Foldseek if no Diamond threat match
 *   4. Gemini-powered integrated report (if API key available)
 *
 * Usage:
 *   npx tsx scripts/integration-test.ts                  # run with built-in test sequence
 *   npx tsx scripts/integration-test.ts --sequence FILE  # run with custom sequence file
 *   npx tsx scripts/integration-test.ts --gemini         # enable Gemini report generation
 *
 * The test never reveals actual protein identities — all outputs
 * use opaque sample IDs (ORD-XXXX, DOM-XXXX, REF-XXXXXXXX).
 */

import { runScreeningPipeline, type PipelineCallbacks } from "../src/lib/pipeline";
import { enhanceReportWithGemini } from "../src/lib/generate-report";
import { readFile } from "fs/promises";
import type { SequenceReport, DomainReport } from "../src/lib/report-types";

// ── CLI argument parsing ─────────────────────────────────────────────

const args = process.argv.slice(2);
const sequenceFileIdx = args.indexOf("--sequence");
const useGemini = args.includes("--gemini");

// ── Test sequence ────────────────────────────────────────────────────
// A sample protein sequence for testing. The pipeline treats it as
// an unknown submission — no identity is assumed or revealed.

const BUILT_IN_TEST_SEQUENCE = [
  "IFPKQYPIINFTTAGATVQSYTNFIRAVRGRLTTGADVRHEIPVLPNRVGLPINQRFIL",
  "VELSNHAELSVTLALDVTNAYVVGYRAGNSAYFFHPDNQEDAEAITHLFTDVQNRYTFAF",
  "GGNYDRLEQLAGNLRENIELGNGPLEEAISALYYYSTGGTQLPTLARSFIICIQMISEAAR",
  "FQYIEGEMRTRIRYNRRSAPDPSVITLENSWGRLSTAIQESNQGAFASPIQLQRRNGSKFS",
  "VYDVSILIPIIALMVYRCAPPPSSQFSLLIRPVVPNFNADVCMDPEPIVRIVGRNGLCVDV",
  "RDGRFHNGNAIQLWPCKSNTDANQLWTLKRDNTIRSNGKCLTTYGYSPGVYVMIYDCNTAA",
  "TDATRWQIWDNGTIINPRSSLVLAATSGNSGTTLTVQTNIYAVSQGWLPTNNTQPFVTTI",
  "VGLYGLCLQANSGQVWIEDCSSEKAEQQWALYADGSIRPQQNRDNCLTSDSNIRETVVKIL",
  "SCGPASSGQRWMFKNDGTILNLYSGLVLDVRASDPSLKQIILYPLHGDPNQIWLPLF",
].join("");

// ── Progress display ────────────────────────────────────────────────

const domainTimers: Map<number, number> = new Map();

const callbacks: PipelineCallbacks = {
  onLog: (msg) => console.log(msg),

  onDomainStart: (i, annotation) => {
    domainTimers.set(i, Date.now());
    console.log(`\n  ▶ Domain ${i + 1}: ${annotation}`);
  },

  onDiamondComplete: (i, matched) => {
    const symbol = matched ? "⚠ MATCH" : "✓ clear";
    console.log(`    Diamond: ${symbol}`);
  },

  onEsmFoldComplete: (i) => {
    console.log(`    ESMFold: ✓ complete`);
  },

  onFoldseekComplete: (i) => {
    console.log(`    Foldseek: ✓ complete`);
  },

  onDomainComplete: (i) => {
    const elapsed = Date.now() - (domainTimers.get(i) ?? Date.now());
    console.log(`    Done (${(elapsed / 1000).toFixed(1)}s)`);
  },
};

// ── Report printer ───────────────────────────────────────────────────

function printDomainVisualization(report: SequenceReport): void {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    DOMAIN ARCHITECTURE                      ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");

  const seqLen = report.sequenceLength;
  const barWidth = 56; // characters for the bar

  // Draw the ruler
  const ruler = Array(barWidth).fill("░");

  for (const dr of report.domains) {
    const startPct = (dr.domain.start - 1) / seqLen;
    const endPct = dr.domain.end / seqLen;
    const startCol = Math.floor(startPct * barWidth);
    const endCol = Math.min(Math.ceil(endPct * barWidth), barWidth);

    for (let c = startCol; c < endCol; c++) {
      ruler[c] = "█";
    }
  }

  console.log(`║  1 │${ruler.join("")}│ ${seqLen} AA ║`);

  // Domain labels as labeled rectangles
  for (let i = 0; i < report.domains.length; i++) {
    const dr = report.domains[i];
    const domLen = dr.domain.end - dr.domain.start + 1;
    const label = dr.domain.annotation;
    const risk = dr.summary?.riskLevel ?? "?";
    const riskIcon = risk === "HIGH" ? "⚠" : risk === "MEDIUM" ? "◆" : risk === "LOW" ? "●" : "?";

    // Draw a labeled rectangle for each domain
    const rectWidth = Math.max(label.length + 14, 30);
    const topBot = "─".repeat(rectWidth);
    const paddedLabel = label.padEnd(rectWidth - 12);
    const posStr = `${dr.domain.start}–${dr.domain.end}`.padEnd(12);

    console.log(`║                                                              ║`);
    console.log(`║  ┌${topBot}┐  ║`.padEnd(65) + "║");
    console.log(`║  │ ${riskIcon} ${paddedLabel} ${domLen} AA │  ║`.padEnd(65) + "║");
    console.log(`║  │   ${posStr}${"".padEnd(rectWidth - 15)}│  ║`.padEnd(65) + "║");
    console.log(`║  └${topBot}┘  ║`.padEnd(65) + "║");
  }

  console.log("╚══════════════════════════════════════════════════════════════╝");
}

function printReport(report: SequenceReport): void {
  console.log("\n" + "=".repeat(64));
  console.log("  SCREENING REPORT");
  console.log("=".repeat(64));
  console.log(`  Order ID:     ${report.id}`);
  console.log(`  Sequence:     ${report.sequenceLength} AA`);
  console.log(`  Status:       ${report.status}`);
  console.log(`  Domains:      ${report.domains.length}`);
  console.log(`  Started:      ${report.startedAt}`);
  if (report.completedAt) {
    console.log(`  Completed:    ${report.completedAt}`);
    const durationMs =
      new Date(report.completedAt).getTime() -
      new Date(report.startedAt).getTime();
    console.log(`  Duration:     ${(durationMs / 1000).toFixed(1)}s`);
  }

  if (report.domains.length === 0) {
    if (report.integratedReport) {
      console.log(`\n  Result: ${report.integratedReport.overallRisk}`);
      console.log(`  ${report.integratedReport.reasoning}`);
    }
    console.log("=".repeat(64));
    return;
  }

  // Domain visualization
  printDomainVisualization(report);

  // Per-domain results
  console.log("\n┌──────────────────────────────────────────────────────────────┐");
  console.log("│                    PER-DOMAIN RESULTS                        │");
  console.log("└──────────────────────────────────────────────────────────────┘");

  for (let i = 0; i < report.domains.length; i++) {
    const dr = report.domains[i];
    console.log(`\n  Domain ${i + 1}: ${dr.domain.annotation}`);
    console.log(`  Position: ${dr.domain.start}–${dr.domain.end} (${dr.domain.sequence.length} AA)`);

    // Pipeline status
    const steps = dr.progress;
    console.log(
      `  Pipeline: Diamond=${steps.diamond}  ESMFold=${steps.structure}  Foldseek=${steps.foldseek}`
    );

    // Diamond
    if (dr.diamond) {
      if (dr.diamond.hits.length > 0) {
        console.log(`  Diamond hits: ${dr.diamond.hits.length} (risk: ${dr.diamond.riskSignal})`);
        for (const hit of dr.diamond.hits.slice(0, 3)) {
          const flags =
            hit.threatFlags.length > 0
              ? ` [${hit.threatFlags.join(", ")}]`
              : "";
          console.log(
            `    • ${hit.identity}% id, e=${hit.evalue}${flags}`
          );
        }
      } else {
        console.log(`  Diamond: no hits`);
      }
    }

    // ESMFold
    if (dr.structure?.status === "completed") {
      console.log(
        `  ESMFold: pLDDT ${dr.structure.plddtMean.toFixed(1)} (${dr.structure.confidenceCategory})`
      );
    }

    // Foldseek
    if (dr.foldseek && dr.foldseek.hits.length > 0) {
      const flagged = dr.foldseek.hits.filter((h) => h.flagged);
      console.log(
        `  Foldseek: ${dr.foldseek.hits.length} hit(s), ${flagged.length} flagged (risk: ${dr.foldseek.riskSignal})`
      );
      for (const hit of flagged.slice(0, 3)) {
        console.log(
          `    • P=${hit.probability} [${hit.riskKeywords.join(", ")}]`
        );
      }
    }

    // Summary
    if (dr.summary) {
      console.log(`  Risk: ${dr.summary.riskLevel} (${(dr.summary.confidence * 100).toFixed(0)}% confidence)`);
      if (dr.summary.flags.length > 0) {
        console.log(`  Flags: ${dr.summary.flags.join("; ")}`);
      }
    }
  }

  // Integrated report
  if (report.integratedReport) {
    const ir = report.integratedReport;
    console.log("\n┌──────────────────────────────────────────────────────────────┐");
    console.log("│                 INTEGRATED RISK ASSESSMENT                   │");
    console.log("└──────────────────────────────────────────────────────────────┘");
    console.log(`\n  Overall Risk:  ${ir.overallRisk}`);
    console.log(`  Decision:      ${ir.decision ?? "N/A"}`);
    console.log(`  Confidence:    ${(ir.confidence * 100).toFixed(0)}%`);
    console.log(`  Architecture:  ${ir.architectureSummary}`);

    if (ir.synergisticFactors.length > 0) {
      console.log("\n  Synergistic Factors:");
      for (const sf of ir.synergisticFactors) {
        console.log(`    ⚠ ${sf.domains.join(" + ")}: ${sf.concern}`);
      }
    }

    console.log(`\n  Reasoning:\n  ${ir.reasoning.replace(/\n/g, "\n  ")}`);

    if (ir.flags.length > 0) {
      console.log(`\n  Flags:`);
      for (const f of ir.flags) {
        console.log(`    • ${f}`);
      }
    }
  }

  console.log("\n" + "=".repeat(64));
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║            LUCID — Integration Test Pipeline                ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  // Load sequence
  let sequence: string;
  if (sequenceFileIdx >= 0 && args[sequenceFileIdx + 1]) {
    const filePath = args[sequenceFileIdx + 1];
    const raw = await readFile(filePath, "utf-8");
    // Strip FASTA header if present
    sequence = raw
      .split("\n")
      .filter((l) => !l.startsWith(">"))
      .map((l) => l.trim())
      .join("");
    console.log(`\nLoaded sequence from: ${filePath}`);
  } else {
    sequence = BUILT_IN_TEST_SEQUENCE;
    console.log("\nUsing built-in test sequence");
  }

  console.log(`Sequence length: ${sequence.length} AA`);
  console.log(`Gemini report: ${useGemini ? "enabled" : "disabled (use --gemini to enable)"}`);

  // Run pipeline
  let report = await runScreeningPipeline(sequence, {
    callbacks,
  });

  // Enhance with Gemini if requested
  if (useGemini && report.status === "completed" && report.domains.length > 0) {
    console.log("\n--- Generating Gemini integrated report ---");
    try {
      report = await enhanceReportWithGemini(report);
      console.log("Gemini report generated successfully");
    } catch (err) {
      console.error("Gemini report generation failed:", err);
    }
  }

  // Print results
  printReport(report);

  // ── Assertions ──
  console.log("\n┌──────────────────────────────────────────────────────────────┐");
  console.log("│                      TEST ASSERTIONS                         │");
  console.log("└──────────────────────────────────────────────────────────────┘");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.log(`  ✗ ${message}`);
      failed++;
    }
  }

  // Pipeline completed
  assert(
    report.status === "completed" || report.status === "error",
    `Pipeline reached terminal state: ${report.status}`
  );

  // Report has an ID (masked)
  assert(
    report.id.startsWith("ORD-"),
    `Report has masked order ID: ${report.id}`
  );

  // No actual protein names leaked in the report
  const reportJson = JSON.stringify(report);
  const leakedNames = ["Ricin", "ricin", "P02879", "Abrin", "abrin"];
  const hasLeak = leakedNames.some((name) => reportJson.includes(name));
  assert(!hasLeak, "No protein identities leaked in report");

  if (report.status === "completed" && report.domains.length > 0) {
    // Domains were detected
    assert(report.domains.length > 0, `Domains detected: ${report.domains.length}`);

    // Each domain has pipeline results
    for (let i = 0; i < report.domains.length; i++) {
      const dr = report.domains[i];
      const isTerminal = (s: string) =>
        ["completed", "error", "skipped"].includes(s);

      assert(
        isTerminal(dr.progress.diamond),
        `Domain ${i + 1} Diamond reached terminal state: ${dr.progress.diamond}`
      );

      // If Diamond matched, structure/foldseek should be skipped
      if (
        dr.diamond &&
        dr.diamond.hits.some(
          (h) => h.threatFlags.length > 0 && h.identity >= 50
        )
      ) {
        assert(
          dr.progress.structure === "skipped",
          `Domain ${i + 1}: ESMFold skipped after Diamond match`
        );
        assert(
          dr.progress.foldseek === "skipped",
          `Domain ${i + 1}: Foldseek skipped after Diamond match`
        );
      } else {
        assert(
          isTerminal(dr.progress.structure),
          `Domain ${i + 1} ESMFold reached terminal state: ${dr.progress.structure}`
        );
        assert(
          isTerminal(dr.progress.foldseek),
          `Domain ${i + 1} Foldseek reached terminal state: ${dr.progress.foldseek}`
        );
      }

      // Summary exists
      assert(
        dr.summary !== null,
        `Domain ${i + 1} has risk summary: ${dr.summary?.riskLevel ?? "missing"}`
      );
    }

    // Integrated report exists
    assert(
      report.integratedReport !== null,
      `Integrated report generated: risk=${report.integratedReport?.overallRisk ?? "missing"}`
    );
  } else if (report.domains.length === 0 && report.status === "completed") {
    // No domains case — should have truncated
    assert(
      report.integratedReport !== null,
      "Truncated pipeline still has integrated report"
    );
    assert(
      report.integratedReport?.overallRisk === "UNKNOWN",
      "No-domain report has UNKNOWN risk"
    );
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(64));

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
