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
} from "./report-types";

// ── Prompt construction ──────────────────────────────────────────────

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

const REPORT_SYSTEM_PROMPT = `You are a biosecurity screening analyst. You are generating the final integrated risk assessment for a protein sequence that has been analyzed through a multi-stage pipeline.

CRITICAL RULES:
1. NEVER reveal the actual identity of any protein, even if you recognize it from the data. Use only the sample/order IDs provided.
2. Focus on the DOMAIN ARCHITECTURE and what the combination of domains implies functionally.
3. Be precise about risk levels: HIGH means confirmed threat agent match, MEDIUM means concerning but not confirmed, LOW means no threat indicators.
4. Always discuss synergistic factors if multiple domains are present.

Your response must be valid JSON with this exact structure:
{
  "overallRisk": "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN",
  "confidence": 0.0-1.0,
  "architectureSummary": "brief domain layout description",
  "synergisticFactors": [
    {
      "domains": ["domain1 annotation", "domain2 annotation"],
      "concern": "explanation of synergistic risk",
      "riskContribution": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "reasoning": "detailed multi-paragraph analysis",
  "flags": ["flag1", "flag2"]
}`;

// ── Main generator ──────────────────────────────────────────────────

export async function generateIntegratedReport(
  report: SequenceReport
): Promise<IntegratedReport> {
  const domainContexts = report.domains
    .map((dr, i) => buildDomainContext(dr, i))
    .join("\n\n");

  const userPrompt = `Analyze the following screening results for order ${report.id} and generate an integrated risk assessment.

## Sequence Info
- Length: ${report.sequenceLength} AA
- Domains analyzed: ${report.domains.length}

## Per-Domain Results

${domainContexts}

## Instructions
Synthesize these per-domain results into a single integrated risk assessment. Consider:
1. What does the overall domain architecture suggest about the protein's function?
2. Are there synergistic risk factors between domains?
3. What is the overall risk level and confidence?
4. What flags should be raised for human review?

Remember: NEVER reveal actual protein identities. Use the order ID "${report.id}" when referencing this sequence.`;

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

    // Validate and coerce
    return {
      overallRisk: validateRiskLevel(parsed.overallRisk),
      confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.5)),
      architectureSummary: parsed.architectureSummary ?? "Unknown architecture",
      synergisticFactors: Array.isArray(parsed.synergisticFactors)
        ? parsed.synergisticFactors
        : [],
      reasoning: parsed.reasoning ?? "Report generation completed.",
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
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
    reasoning: `Static analysis of ${report.domains.length} domain(s). ` +
      report.domains
        .map((dr) => dr.summary?.reasoning ?? "")
        .filter(Boolean)
        .join(" "),
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
