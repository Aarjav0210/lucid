// ── report-types.ts ────────────────────────────────────────────────────
//
// Unified data model for the full screening pipeline.
//
// Flow:
//   1. InterPro → extracted structural domains
//   2. Per-domain (parallel): Diamond + ESMFold + Foldseek → LLM domain summary
//   3. Integration: all domain summaries → LLM synergistic analysis
//
// The SequenceReport is the single object that the UI renders.

import type { ExtractedDomain } from "./extract-domains";

// ── Risk levels ────────────────────────────────────────────────────────

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

// ── Per-tool results ───────────────────────────────────────────────────

export interface DiamondHit {
  accession: string;
  title: string;
  organism: string;
  identity: number;       // 0-100
  coverage: number;       // 0-100
  evalue: number;
  bitScore: number;
  threatFlags: string[];  // e.g. ["select_agent", "toxin"]
}

export interface DiamondResult {
  status: "completed" | "no_hits" | "error";
  error?: string;
  durationMs: number;
  hits: DiamondHit[];
  riskSignal: RiskLevel;
}

export interface StructurePrediction {
  status: "completed" | "error";
  error?: string;
  pdbPath: string;
  pdbString?: string;           // raw PDB data for 3D rendering
  plddtMean: number;           // 0-100
  plddtPerResidue: number[];
  confidenceCategory: "very_high" | "confident" | "low" | "very_low";
}

export interface FoldseekHitSummary {
  pdbId: string | null;
  uniprotId: string | null;
  proteinName: string;
  organism: string;
  probability: number;     // 0-1
  evalue: number;
  keywords: string[];
  flagged: boolean;
  riskKeywords: string[];
}

export interface FoldseekResult {
  status: "completed" | "no_hits" | "error";
  error?: string;
  durationMs: number;
  hits: FoldseekHitSummary[];
  riskSignal: RiskLevel;
}

// ── Per-domain assessment ──────────────────────────────────────────────

export interface DomainSummary {
  riskLevel: RiskLevel;
  confidence: number;       // 0.0-1.0
  reasoning: string;        // LLM-generated explanation
  flags: string[];           // e.g. ["toxin catalytic domain", "cell-entry domain"]
}

export interface DomainReport {
  /** Domain metadata from InterPro extraction */
  domain: ExtractedDomain;

  /** Sequence alignment against threat database */
  diamond: DiamondResult | null;

  /** Predicted 3D structure */
  structure: StructurePrediction | null;

  /** Structural homolog search (depends on structure) */
  foldseek: FoldseekResult | null;

  /** LLM-generated per-domain risk assessment */
  summary: DomainSummary | null;

  /** Pipeline progress tracking */
  progress: DomainProgress;
}

export interface DomainProgress {
  diamond: PipelineStepStatus;
  structure: PipelineStepStatus;
  foldseek: PipelineStepStatus;
  summary: PipelineStepStatus;
}

export type PipelineStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "error"
  | "skipped";

// ── Integrated report ──────────────────────────────────────────────────

export interface SynergisticRiskFactor {
  domains: string[];          // domain annotations involved
  concern: string;            // e.g. "Toxin catalytic + cell-entry lectin = delivery mechanism"
  riskContribution: RiskLevel;
}

export type ScreeningDecision = "Approved" | "Rejected" | "Manual Validation";

export interface IntegratedReport {
  overallRisk: RiskLevel;
  confidence: number;
  architectureSummary: string;
  synergisticFactors: SynergisticRiskFactor[];
  reasoning: string;
  decision: ScreeningDecision;
  flags: string[];
}

// ── Top-level report ───────────────────────────────────────────────────

export type ReportStatus =
  | "idle"
  | "extracting_domains"    // InterPro running
  | "analyzing_domains"     // per-domain pipelines running
  | "integrating"           // final LLM synthesis
  | "completed"
  | "error";

export interface SequenceReport {
  /** Unique report ID */
  id: string;

  /** Original input */
  inputSequence: string;
  sequenceLength: number;

  /** Overall pipeline status */
  status: ReportStatus;
  error?: string;

  /** Domain extraction results */
  domains: DomainReport[];

  /** Final integrated assessment (null until integration step completes) */
  integratedReport: IntegratedReport | null;

  /** Timestamps */
  startedAt: string;        // ISO 8601
  completedAt?: string;
}

// ── Factory helpers ────────────────────────────────────────────────────

export function createEmptyDomainProgress(): DomainProgress {
  return {
    diamond: "pending",
    structure: "pending",
    foldseek: "pending",
    summary: "pending",
  };
}

export function createInitialReport(
  id: string,
  sequence: string,
  extractedDomains: ExtractedDomain[]
): SequenceReport {
  return {
    id,
    inputSequence: sequence,
    sequenceLength: sequence.length,
    status: "analyzing_domains",
    domains: extractedDomains
      .filter((d) => !d.isLinker)
      .map((domain) => ({
        domain,
        diamond: null,
        structure: null,
        foldseek: null,
        summary: null,
        progress: createEmptyDomainProgress(),
      })),
    integratedReport: null,
    startedAt: new Date().toISOString(),
  };
}

/**
 * Compute the highest risk level across all domain reports.
 */
export function worstRisk(levels: RiskLevel[]): RiskLevel {
  if (levels.includes("HIGH")) return "HIGH";
  if (levels.includes("MEDIUM")) return "MEDIUM";
  if (levels.includes("LOW")) return "LOW";
  return "UNKNOWN";
}

/**
 * Check if all domain pipelines have completed.
 */
export function allDomainsComplete(report: SequenceReport): boolean {
  return report.domains.every((d) =>
    Object.values(d.progress).every(
      (s) => s === "completed" || s === "error" || s === "skipped"
    )
  );
}
