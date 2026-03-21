// ── generate-report.ts ──────────────────────────────────────────────────
//
// Uses Gemini to synthesize a final integrated report from pipeline results.
// Replaces the static buildIntegratedReport with LLM-generated reasoning
// when a Google API key is available.

import { generateText } from "ai";
import { model } from "./model";
import type {
  SequenceReport,
  DomainReport,
  IntegratedReport,
  DomainSummary,
  RiskLevel,
  ScreeningDecision,
} from "./report-types";

// ── Prompt construction ──────────────────────────────────────────────

function buildPipelineContext(report: SequenceReport): string {
  const sections: string[] = [];

  // InterPro section — collect all domain metadata across all domain reports
  const interproLines: string[] = [];
  for (const dr of report.domains) {
    // Each domain's metadata contains the InterPro signatures
    if (dr.domain.metadata.length > 0) {
      for (const m of dr.domain.metadata) {
        interproLines.push(
          `  - ${m.signature ?? "N/A"} / ${m.description} / ${m.type} / ${dr.domain.start}–${dr.domain.end}`
        );
      }
    } else {
      // Fallback: use the domain annotation and signatures
      const sigs = dr.domain.signatures.join(", ");
      interproLines.push(
        `  - ${sigs || "N/A"} / ${dr.domain.annotation} / DOMAIN / ${dr.domain.start}–${dr.domain.end}`
      );
    }
  }
  sections.push(`InterPro\n${interproLines.length > 0 ? interproLines.join("\n") : "  - No domains identified"}`);

  // DIAMOND section
  const diamondLines: string[] = [];
  for (let i = 0; i < report.domains.length; i++) {
    const dr = report.domains[i];
    if (dr.diamond && dr.diamond.status === "completed" && dr.diamond.hits.length > 0) {
      for (const hit of dr.diamond.hits) {
        const flags = hit.threatFlags.length > 0 ? ` / flagged: ${hit.threatFlags.join(", ")}` : " / not flagged";
        diamondLines.push(
          `  - Domain ${i + 1}: ${hit.accession} / ${hit.identity}% identity / e-value ${hit.evalue}${flags}`
        );
      }
    }
  }
  sections.push(`DIAMOND\n${diamondLines.length > 0 ? diamondLines.join("\n") : "  - No hits"}`);

  // ESMFold section
  const esmLines: string[] = [];
  for (let i = 0; i < report.domains.length; i++) {
    const dr = report.domains[i];
    if (dr.structure && dr.structure.status === "completed") {
      esmLines.push(`  - Domain ${i + 1}: pLDDT ${dr.structure.plddtMean.toFixed(2)}`);
    } else if (dr.progress.structure === "skipped") {
      esmLines.push(`  - Domain ${i + 1}: skipped (strong Diamond match)`);
    } else {
      esmLines.push(`  - Domain ${i + 1}: ${dr.structure?.status ?? "not run"}`);
    }
  }
  sections.push(`ESMFold\n${esmLines.join("\n")}`);

  // Foldseek section
  const fsLines: string[] = [];
  for (let i = 0; i < report.domains.length; i++) {
    const dr = report.domains[i];
    if (dr.foldseek && dr.foldseek.hits.length > 0) {
      const hitDescs = dr.foldseek.hits.slice(0, 5).map((h) => {
        const flagStr = h.flagged ? `flagged as ${h.riskKeywords.join(", ")}` : "not flagged as toxic";
        return `${h.uniprotId ?? h.pdbId ?? "unknown"} / ${h.organism} / prob ${h.probability} / e-value ${h.evalue} / ${flagStr}`;
      });
      fsLines.push(`  - Domain ${i + 1}: ${dr.foldseek.hits.length} hit(s) — ${hitDescs[0]}`);
      for (const desc of hitDescs.slice(1)) {
        fsLines.push(`    ${desc}`);
      }
    } else {
      fsLines.push(`  - Domain ${i + 1}: 0 hits`);
    }
  }
  sections.push(`Foldseek\n${fsLines.join("\n")}`);

  return sections.join("\n\n");
}

function buildDomainContext(dr: DomainReport, index: number): string {
  const lines: string[] = [];
  lines.push(`### Domain ${index + 1}: ${dr.domain.annotation}`);
  lines.push(`- Position: ${dr.domain.start}–${dr.domain.end} (${dr.domain.sequence.length} AA)`);

  if (dr.domain.metadata.length > 0) {
    const metaStr = dr.domain.metadata
      .map((m) => `${m.description} (${m.type})`)
      .join("; ");
    lines.push(`- Metadata: ${metaStr}`);
  }

  // Diamond results
  if (dr.diamond) {
    if (dr.diamond.status === "completed" && dr.diamond.hits.length > 0) {
      lines.push(`- Diamond: ${dr.diamond.hits.length} hit(s), risk signal = ${dr.diamond.riskSignal}`);
      for (const hit of dr.diamond.hits.slice(0, 3)) {
        lines.push(`  - ${hit.identity}% identity, e-value ${hit.evalue}, flags: [${hit.threatFlags.join(", ") || "none"}]`);
      }
    } else {
      lines.push(`- Diamond: ${dr.diamond.status}`);
    }
  }

  // Structure prediction
  if (dr.structure) {
    if (dr.structure.status === "completed") {
      lines.push(`- ESMFold: pLDDT ${dr.structure.plddtMean.toFixed(1)} (${dr.structure.confidenceCategory})`);
    } else {
      lines.push(`- ESMFold: ${dr.structure.status}`);
    }
  } else if (dr.progress.structure === "skipped") {
    lines.push("- ESMFold: skipped (strong Diamond match)");
  }

  // Foldseek results
  if (dr.foldseek) {
    if (dr.foldseek.status === "completed" && dr.foldseek.hits.length > 0) {
      const flagged = dr.foldseek.hits.filter((h) => h.flagged);
      lines.push(`- Foldseek: ${dr.foldseek.hits.length} hit(s), ${flagged.length} flagged, risk signal = ${dr.foldseek.riskSignal}`);
      for (const hit of flagged.slice(0, 3)) {
        lines.push(`  - P=${hit.probability}, keywords: [${hit.riskKeywords.join(", ")}]`);
      }
    } else {
      lines.push(`- Foldseek: ${dr.foldseek?.status ?? "skipped"}`);
    }
  } else if (dr.progress.foldseek === "skipped") {
    lines.push("- Foldseek: skipped");
  }

  // Per-domain summary
  if (dr.summary) {
    lines.push(`- Domain risk: ${dr.summary.riskLevel} (confidence ${dr.summary.confidence})`);
    if (dr.summary.flags.length > 0) {
      lines.push(`- Flags: ${dr.summary.flags.join("; ")}`);
    }
  }

  return lines.join("\n");
}

const REPORT_SYSTEM_PROMPT = `You are a biosecurity screening analyst. Respond with valid JSON only.`;

// ── Main generator ──────────────────────────────────────────────────

export async function generateIntegratedReport(
  report: SequenceReport
): Promise<IntegratedReport> {
  const pipelineContext = buildPipelineContext(report);

  const userPrompt = `${pipelineContext}

Have a look at the following combination of structural domains from the same protein polypeptide chain, and output a structured response with the following schema:
{
  "summary": "...",
  "decision": "Approved" | "Rejected" | "Manual Validation"
}`;

  try {
    const result = await generateText({
      model,
      system: REPORT_SYSTEM_PROMPT,
      prompt: userPrompt,
      maxTokens: 2000,
    });

    // Parse JSON from response
    const text = result.text.trim();
    // Extract JSON from possible markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
    const jsonStr = jsonMatch[1]?.trim() ?? text;
    const parsed = JSON.parse(jsonStr) as IntegratedReport;

    const summary = (parsed as any).summary ?? "Report generation completed.";
    const decision = validateDecision(parsed.decision);

    // Derive overallRisk from decision
    const overallRisk: RiskLevel = decision === "Rejected" ? "HIGH"
      : decision === "Manual Validation" ? "MEDIUM"
      : "LOW";

    return {
      overallRisk,
      confidence: overallRisk === "HIGH" ? 0.95 : overallRisk === "MEDIUM" ? 0.8 : 0.85,
      architectureSummary: report.domains.map(
        (dr) => `${dr.domain.annotation} (${dr.domain.start}–${dr.domain.end})`
      ).join(" → "),
      synergisticFactors: [],
      reasoning: summary,
      decision,
      flags: [],
    };
  } catch (err) {
    console.error("Gemini report generation failed:", err);
    // Fall back to static report
    return buildStaticIntegratedReport(report);
  }
}

function validateRiskLevel(level: unknown): RiskLevel {
  const valid: RiskLevel[] = ["HIGH", "MEDIUM", "LOW", "UNKNOWN"];
  return valid.includes(level as RiskLevel)
    ? (level as RiskLevel)
    : "UNKNOWN";
}

function validateDecision(decision: unknown): ScreeningDecision {
  const valid: ScreeningDecision[] = ["Approved", "Rejected", "Manual Validation"];
  return valid.includes(decision as ScreeningDecision)
    ? (decision as ScreeningDecision)
    : "Manual Validation";
}

// ── Fallback static report ──────────────────────────────────────────

function buildStaticIntegratedReport(
  report: SequenceReport
): IntegratedReport {
  const riskLevels = report.domains
    .map((dr) => dr.summary?.riskLevel ?? "UNKNOWN");
  const overallRisk = riskLevels.includes("HIGH")
    ? "HIGH"
    : riskLevels.includes("MEDIUM")
      ? "MEDIUM"
      : riskLevels.includes("LOW")
        ? "LOW"
        : "UNKNOWN";
  const archParts = report.domains.map(
    (dr) => `${dr.domain.annotation} (${dr.domain.start}–${dr.domain.end})`
  );

  return {
    overallRisk: overallRisk as RiskLevel,
    confidence: overallRisk === "HIGH" ? 0.9 : 0.7,
    architectureSummary: archParts.join(" → "),
    synergisticFactors: [],
    reasoning: `Static analysis of ${report.domains.length} domain(s). LLM report generation failed.`,
    decision: "Manual Validation",
    flags: report.domains.flatMap((dr) => dr.summary?.flags ?? []),
  };
}

// ── Enhanced pipeline with Gemini report ────────────────────────────

export async function enhanceReportWithGemini(
  report: SequenceReport
): Promise<SequenceReport> {
  if (report.status !== "completed" || report.domains.length === 0) {
    return report;
  }

  const integrated = await generateIntegratedReport(report);
  return {
    ...report,
    integratedReport: integrated,
  };
}

// ── Per-domain LLM summary ──────────────────────────────────────────

export async function generateDomainSummary(
  dr: DomainReport,
  orderId: string
): Promise<DomainSummary> {
  const context = buildDomainContext(dr, 0);

  try {
    const result = await generateText({
      model,
      system: `You are a biosecurity analyst summarizing a single protein domain's screening results.
NEVER reveal actual protein identities. Use only the provided order ID.
Respond with valid JSON: {"riskLevel":"HIGH|MEDIUM|LOW|UNKNOWN","confidence":0.0-1.0,"reasoning":"...","flags":["..."]}`,
      prompt: `Order ${orderId}: Summarize the risk assessment for this domain:\n\n${context}`,
      maxTokens: 800,
    });

    const text = result.text.trim();
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
    const jsonStr = jsonMatch[1]?.trim() ?? text;
    const parsed = JSON.parse(jsonStr) as DomainSummary;

    return {
      riskLevel: validateRiskLevel(parsed.riskLevel),
      confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.5)),
      reasoning: parsed.reasoning ?? "Assessment completed.",
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    };
  } catch {
    return dr.summary ?? {
      riskLevel: "UNKNOWN",
      confidence: 0.3,
      reasoning: "LLM summary generation failed.",
      flags: [],
    };
  }
}
