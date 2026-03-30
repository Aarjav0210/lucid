// ── pipeline.ts ────────────────────────────────────────────────────────
//
// End-to-end screening pipeline orchestrator.
//
// Flow:
//   1. Validate + detect sequence type
//   2. InterPro domain scan
//      └─ No domains? → truncate pipeline, return early report
//   3. Extract non-overlapping domains
//   4. Per-domain (parallel branches):
//      a. Diamond alignment against curated threat DB
//         └─ Strong match? → skip ESMFold/Foldseek for this domain
//      b. ESMFold structure prediction (only if Diamond had no match)
//      c. Foldseek structural search (only if ESMFold succeeded)
//   5. Generate integrated report via Gemini
//
// Identity masking: actual protein names/accessions are NEVER exposed
// in the final report. Each domain gets an opaque sample ID like
// "DOM-0001", and the overall order gets an "ORD-XXXX" identifier.

import { createHash } from "crypto";
import { validateSequence, detectSequenceType } from "./validate";
import { runInterProScan, type InterProResult } from "./interpro";
import { getCachedDomainSlices, cacheDomainSlices } from "./domain-cache";
import { diamondSearch, type DiamondResult as RawDiamondResult } from "./diamond/index";
import { predictStructureEsm, type EsmFoldResult } from "./esmfold";
import { searchStructure } from "./foldseek/index";
import type { FoldseekResult as RawFoldseekResult } from "./foldseek/types";
import { checkDangerousKeywords } from "./foldseek/parse";
import type { ExtractedDomain } from "./extract-domains";
import type {
  SequenceReport,
  DomainReport,
  DomainProgress,
  RiskLevel,
  DiamondResult as ReportDiamondResult,
  DiamondHit as ReportDiamondHit,
  StructurePrediction,
  FoldseekResult as ReportFoldseekResult,
  FoldseekHitSummary,
  IntegratedReport,
  DomainSummary,
  SynergisticRiskFactor,
  ScreeningDecision,
} from "./report-types";

// ── Identity masking ──────────────────────────────────────────────────

let domainCounter = 0;

function nextDomainId(): string {
  domainCounter += 1;
  return `DOM-${String(domainCounter).padStart(4, "0")}`;
}

function generateOrderId(): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-2026-${n}`;
}

function maskAccession(_accession: string): string {
  // Return a deterministic but opaque hash-based ID
  const hash = createHash("sha256").update(_accession).digest("hex").slice(0, 8).toUpperCase();
  return `REF-${hash}`;
}

// ── Diamond result → report format ───────────────────────────────────

const CURATED_THREAT_ACCESSIONS = new Set([
  // HHS Select Agent Toxins (protein-based)
  "P02879",  // Ricin
  "P11140",  // Abrin-a
  "Q06077",  // Abrin-b
  "P28590",  // Abrin-c
  "Q06076",  // Abrin-d
  "P0DPI0",  // Botulinum neurotoxin type A
  "P10844",  // Botulinum neurotoxin type B
  "Q00496",  // Botulinum neurotoxin type E
  "P0A0L2",  // Staphylococcal enterotoxin type A
  "P01552",  // Staphylococcal enterotoxin type B
  "P01553",  // Staphylococcal enterotoxin type C1
  "P20723",  // Staphylococcal enterotoxin type D
  "P12993",  // Staphylococcal enterotoxin type E
  // Additional regulated toxins
  "P00588",  // Diphtheria toxin
  "Q9FBI2",  // Shiga toxin subunit A
  "Q7BQ98",  // Shiga toxin subunit B
  "Q02307",  // Clostridium perfringens epsilon toxin
  "P04958",  // Tetanus toxin
]);

function classifyDiamondHit(
  hit: import("./diamond/types").DiamondHit
): ReportDiamondHit {
  const threatFlags: string[] = [];
  // High identity to a curated threat → flag
  if (CURATED_THREAT_ACCESSIONS.has(hit.target) && hit.identity >= 30) {
    threatFlags.push("toxin");
    if (hit.identity >= 70) threatFlags.push("select_agent");
  }

  return {
    accession: maskAccession(hit.target),
    title: "Curated reference sequence",
    organism: "Reference organism",
    identity: Math.round(hit.identity * 10) / 10,
    coverage: Math.round(
      ((hit.qEnd - hit.qStart + 1) / (hit.sEnd - hit.sStart + 1)) * 100 * 10
    ) / 10,
    evalue: hit.eValue,
    bitScore: hit.bitScore,
    threatFlags,
    qStart: hit.qStart,
    qEnd: hit.qEnd,
    queryLength: hit.qEnd, // will be overridden by caller with actual domain length
    qseq: hit.qseq,
    sseq: hit.sseq,
  };
}

function diamondRiskSignal(hits: ReportDiamondHit[]): RiskLevel {
  if (hits.some((h) => h.threatFlags.includes("select_agent"))) return "HIGH";
  if (hits.some((h) => h.threatFlags.includes("toxin"))) return "MEDIUM";
  if (hits.some((h) => h.identity >= 80)) return "MEDIUM";
  return "LOW";
}

function hasDiamondThreatMatch(result: ReportDiamondResult): boolean {
  return (
    result.status === "completed" &&
    result.hits.some(
      (h) => h.threatFlags.length > 0 && h.identity >= 50
    )
  );
}

// ── Foldseek result → report format ──────────────────────────────────

function convertFoldseekHit(
  hit: import("./foldseek/types").FoldseekHit
): FoldseekHitSummary {
  return {
    pdbId: hit.pdbId ? maskAccession(hit.pdbId) : null,
    uniprotId: hit.uniprotId ? maskAccession(hit.uniprotId) : null,
    proteinName: "Structural homolog",
    organism: hit.organism || hit.taxName || "Unknown",
    probability: Math.round(hit.prob * 100) / 100,
    evalue: hit.evalue,
    keywords: hit.keywords,
    flagged: hit.flagged,
    riskKeywords: hit.riskKeywords,
  };
}

function foldseekRiskSignal(hits: FoldseekHitSummary[]): RiskLevel {
  if (hits.some((h) => h.flagged && h.probability >= 0.9)) return "HIGH";
  if (hits.some((h) => h.flagged)) return "MEDIUM";
  return "LOW";
}

// ── ESMFold → report format ──────────────────────────────────────────

function confidenceCategory(
  plddtMean: number
): "very_high" | "confident" | "low" | "very_low" {
  if (plddtMean >= 90) return "very_high";
  if (plddtMean >= 70) return "confident";
  if (plddtMean >= 60) return "low";
  return "very_low";
}

// ── Per-domain pipeline ──────────────────────────────────────────────

export interface PipelineCallbacks {
  onDomainStart?: (domainIndex: number, annotation: string) => void | Promise<void>;
  onDiamondComplete?: (domainIndex: number, matched: boolean) => void | Promise<void>;
  onEsmFoldComplete?: (domainIndex: number) => void | Promise<void>;
  onFoldseekComplete?: (domainIndex: number) => void | Promise<void>;
  onDomainComplete?: (domainIndex: number, domainReport: DomainReport) => void | Promise<void>;
  onDomainsExtracted?: (domains: ExtractedDomain[], sequenceLength: number, orderId: string) => void | Promise<void>;
  onLog?: (message: string) => void;
}

async function runDomainPipeline(
  domain: ExtractedDomain,
  domainIndex: number,
  callbacks?: PipelineCallbacks
): Promise<DomainReport> {
  const log = callbacks?.onLog ?? console.log;
  const domainId = nextDomainId();
  const tag = `[${domainId}] ${domain.annotation}`;

  await callbacks?.onDomainStart?.(domainIndex, domain.annotation);
  log(`${tag}: starting pipeline (${domain.sequence.length} AA, ${domain.start}-${domain.end})`);

  const progress: DomainProgress = {
    diamond: "pending",
    structure: "pending",
    foldseek: "pending",
    summary: "pending",
  };

  let diamondResult: ReportDiamondResult | null = null;
  let structureResult: StructurePrediction | null = null;
  let foldseekResult: ReportFoldseekResult | null = null;

  // ── Stage A: Diamond ──
  progress.diamond = "running";
  log(`${tag}: running Diamond alignment...`);

  try {
    const raw = await diamondSearch(domain.sequence);
    const hits = raw.hits.map((h) => {
      const hit = classifyDiamondHit(h);
      hit.queryLength = domain.sequence.length;
      return hit;
    });
    diamondResult = {
      status: raw.status === "completed" ? "completed" : raw.status === "no_hits" ? "no_hits" : "error",
      error: raw.error,
      durationMs: raw.searchDuration * 1000,
      hits,
      riskSignal: hits.length > 0 ? diamondRiskSignal(hits) : "LOW",
    };
    progress.diamond = "completed";
    log(`${tag}: Diamond done — ${hits.length} hit(s), risk=${diamondResult.riskSignal}`);
  } catch (err) {
    diamondResult = {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      durationMs: 0,
      hits: [],
      riskSignal: "UNKNOWN",
    };
    progress.diamond = "error";
    log(`${tag}: Diamond error — ${diamondResult.error}`);
  }

  await callbacks?.onDiamondComplete?.(domainIndex, hasDiamondThreatMatch(diamondResult));

  // ── Early exit: strong Diamond match → skip structure prediction ──
  if (hasDiamondThreatMatch(diamondResult)) {
    log(`${tag}: strong Diamond match detected — skipping ESMFold/Foldseek`);
    progress.structure = "skipped";
    progress.foldseek = "skipped";
    progress.summary = "completed";

    const summary: DomainSummary = {
      riskLevel: diamondResult.riskSignal,
      confidence: 0.95,
      reasoning: `Strong sequence alignment detected against curated threat database. Domain "${domain.annotation}" (${domain.start}-${domain.end}) shows significant identity to known threats. Structural analysis was skipped as sequence-level evidence is sufficient for risk classification.`,
      flags: diamondResult.hits
        .filter((h) => h.threatFlags.length > 0)
        .flatMap((h) => h.threatFlags.map((f) => `${f} (${h.identity}% identity)`)),
    };

    const earlyReport: DomainReport = {
      domain,
      diamond: diamondResult,
      structure: null,
      foldseek: null,
      summary,
      progress,
    };

    await callbacks?.onDomainComplete?.(domainIndex, earlyReport);
    return earlyReport;
  }

  // ── Stage B: ESMFold ──
  progress.structure = "running";
  log(`${tag}: running ESMFold structure prediction...`);

  try {
    const esm = await predictStructureEsm(domain.sequence);
    if (esm.status === "completed") {
      structureResult = {
        status: "completed",
        pdbPath: esm.pdbPath,
        pdbString: esm.pdbString,
        plddtMean: esm.plddtMean,
        plddtPerResidue: esm.plddtPerResidue,
        confidenceCategory: confidenceCategory(esm.plddtMean),
      };
      progress.structure = "completed";
      log(`${tag}: ESMFold done — pLDDT ${esm.plddtMean.toFixed(1)}`);

      await callbacks?.onEsmFoldComplete?.(domainIndex);

      // ── Stage C: Foldseek ──
      progress.foldseek = "running";
      log(`${tag}: running Foldseek structural search...`);

      try {
        const seqHash = createHash("sha256")
          .update(domain.sequence.toUpperCase())
          .digest("hex");
        const fsRaw = await searchStructure(esm.pdbString, { sequenceHash: seqHash });
        const fsHits = fsRaw.hits.map(convertFoldseekHit);
        foldseekResult = {
          status: fsHits.length > 0 ? "completed" : "no_hits",
          durationMs: 0, // timing not tracked in raw result
          hits: fsHits,
          riskSignal: fsHits.length > 0 ? foldseekRiskSignal(fsHits) : "LOW",
        };
        progress.foldseek = "completed";
        log(`${tag}: Foldseek done — ${fsHits.length} hit(s), risk=${foldseekResult.riskSignal}`);

        await callbacks?.onFoldseekComplete?.(domainIndex);
      } catch (err) {
        foldseekResult = {
          status: "error",
          error: err instanceof Error ? err.message : String(err),
          durationMs: 0,
          hits: [],
          riskSignal: "UNKNOWN",
        };
        progress.foldseek = "error";
        log(`${tag}: Foldseek error — ${foldseekResult.error}`);
      }
    } else {
      structureResult = {
        status: "error",
        error: esm.error,
        pdbPath: "",
        plddtMean: 0,
        plddtPerResidue: [],
        confidenceCategory: "very_low",
      };
      progress.structure = "error";
      progress.foldseek = "skipped";
      log(`${tag}: ESMFold error — ${esm.error}`);
    }
  } catch (err) {
    structureResult = {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      pdbPath: "",
      plddtMean: 0,
      plddtPerResidue: [],
      confidenceCategory: "very_low",
    };
    progress.structure = "error";
    progress.foldseek = "skipped";
    log(`${tag}: ESMFold error — ${structureResult.error}`);
  }

  // ── Domain summary ──
  progress.summary = "completed";
  const worstSignal = worstOfSignals([
    diamondResult?.riskSignal ?? "UNKNOWN",
    foldseekResult?.riskSignal ?? "UNKNOWN",
  ]);

  const summary: DomainSummary = {
    riskLevel: worstSignal,
    confidence: structureResult?.status === "completed" ? 0.85 : 0.6,
    reasoning: buildDomainReasoning(domain, diamondResult, structureResult, foldseekResult),
    flags: collectFlags(diamondResult, foldseekResult),
  };

  const domainReport: DomainReport = {
    domain,
    diamond: diamondResult,
    structure: structureResult,
    foldseek: foldseekResult,
    summary,
    progress,
  };

  await callbacks?.onDomainComplete?.(domainIndex, domainReport);

  return domainReport;
}

// ── Helpers ──────────────────────────────────────────────────────────

function worstOfSignals(signals: RiskLevel[]): RiskLevel {
  if (signals.includes("HIGH")) return "HIGH";
  if (signals.includes("MEDIUM")) return "MEDIUM";
  if (signals.includes("LOW")) return "LOW";
  return "UNKNOWN";
}

function buildDomainReasoning(
  domain: ExtractedDomain,
  diamond: ReportDiamondResult | null,
  structure: StructurePrediction | null,
  foldseek: ReportFoldseekResult | null
): string {
  const parts: string[] = [];

  parts.push(
    `Domain "${domain.annotation}" spans residues ${domain.start}-${domain.end} (${domain.sequence.length} AA).`
  );

  if (diamond?.status === "completed" && diamond.hits.length > 0) {
    const best = diamond.hits[0];
    parts.push(
      `Sequence alignment found ${diamond.hits.length} hit(s); top hit at ${best.identity}% identity (e-value: ${best.evalue}).`
    );
    if (best.threatFlags.length > 0) {
      parts.push(`Threat flags: ${best.threatFlags.join(", ")}.`);
    }
  } else if (diamond?.status === "no_hits") {
    parts.push("No significant sequence matches found in the curated threat database.");
  }

  if (structure?.status === "completed") {
    parts.push(
      `Structure prediction confidence: pLDDT ${structure.plddtMean.toFixed(1)} (${structure.confidenceCategory}).`
    );
  }

  if (foldseek?.status === "completed" && foldseek.hits.length > 0) {
    const flagged = foldseek.hits.filter((h) => h.flagged);
    if (flagged.length > 0) {
      parts.push(
        `Structural search flagged ${flagged.length} hit(s) as potential threats.`
      );
    } else {
      parts.push(
        `Structural search found ${foldseek.hits.length} homolog(s), none flagged as threats.`
      );
    }
  } else if (foldseek?.status === "no_hits") {
    parts.push("No structural homologs found.");
  }

  return parts.join(" ");
}

function collectFlags(
  diamond: ReportDiamondResult | null,
  foldseek: ReportFoldseekResult | null
): string[] {
  const counts = new Map<string, number>();
  if (diamond?.hits) {
    for (const h of diamond.hits) {
      for (const f of h.threatFlags) {
        counts.set(f, (counts.get(f) ?? 0) + 1);
      }
    }
  }
  if (foldseek?.hits) {
    for (const h of foldseek.hits) {
      if (h.flagged) {
        for (const kw of h.riskKeywords) {
          counts.set(kw, (counts.get(kw) ?? 0) + 1);
        }
      }
    }
  }
  // Encode as "keyword:count" so the UI can split and display
  return [...counts.entries()].map(([kw, n]) => `${kw}:${n}`);
}

// ── Main pipeline entry point ────────────────────────────────────────

export interface PipelineOptions {
  orderId?: string;
  callbacks?: PipelineCallbacks;
}

export async function runScreeningPipeline(
  rawSequence: string,
  options?: PipelineOptions
): Promise<SequenceReport> {
  const orderId = options?.orderId ?? generateOrderId();
  const log = options?.callbacks?.onLog ?? console.log;

  // Reset domain counter for this run
  domainCounter = 0;

  log(`\n${"=".repeat(60)}`);
  log(`Pipeline started: ${orderId}`);
  log(`${"=".repeat(60)}\n`);

  const startedAt = new Date().toISOString();

  // ── Step 1: Validate ──
  const validation = validateSequence(rawSequence);
  if (!validation.valid) {
    return {
      id: orderId,
      inputSequence: "",
      sequenceLength: 0,
      status: "error",
      error: validation.error,
      domains: [],
      integratedReport: null,
      startedAt,
    };
  }

  const sequence = validation.sequence;
  const seqType = detectSequenceType(sequence);
  log(`Sequence: ${sequence.length} AA, type=${seqType}`);

  if (seqType !== "protein") {
    return {
      id: orderId,
      inputSequence: sequence,
      sequenceLength: sequence.length,
      status: "error",
      error: "Only protein sequences are supported by this pipeline.",
      domains: [],
      integratedReport: null,
      startedAt,
    };
  }

  // ── Step 2: InterPro domain scan ──
  log("\n--- Stage 1: InterPro Domain Scan ---");

  let interproResult: InterProResult;

  // Check cache first
  const cached = await getCachedDomainSlices(sequence);
  if (cached && cached.extractedDomains.length > 0) {
    log("InterPro: using cached results");
    interproResult = {
      status: "completed",
      searchDuration: 0,
      domains: [],
      slices: [],
      extractedDomains: cached.extractedDomains,
    };
  } else {
    interproResult = await runInterProScan(sequence);
    // Cache the results
    if (interproResult.status === "completed") {
      await cacheDomainSlices(sequence, interproResult).catch((err) =>
        log(`Cache write failed: ${err}`)
      );
    }
  }

  // ── No domains? Truncate pipeline ──
  if (
    interproResult.status === "no_domains" ||
    interproResult.extractedDomains.length === 0
  ) {
    log("InterPro: no domains detected — truncating pipeline");
    return {
      id: orderId,
      inputSequence: sequence,
      sequenceLength: sequence.length,
      status: "completed",
      domains: [],
      integratedReport: {
        overallRisk: "UNKNOWN",
        confidence: 0.3,
        architectureSummary: "No recognizable protein domains detected",
        synergisticFactors: [],
        reasoning:
          "InterPro domain scanning did not identify any known protein domains in the submitted sequence. " +
          "This could indicate a novel protein, a non-coding sequence, or a sequence that does not match " +
          "current domain databases. Without domain annotations, the risk assessment is inconclusive. " +
          "Manual review by a subject matter expert is recommended.",
        decision: "Manual Validation",
        flags: ["No domains detected", "Manual review recommended"],
      },
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  if (interproResult.status === "error" || interproResult.status === "timeout") {
    log(`InterPro: ${interproResult.status} — ${interproResult.error}`);
    return {
      id: orderId,
      inputSequence: sequence,
      sequenceLength: sequence.length,
      status: "error",
      error: `InterPro scan failed: ${interproResult.error}`,
      domains: [],
      integratedReport: null,
      startedAt,
    };
  }

  // ── Step 3: Extract domains (non-linker only) ──
  const structuralDomains = interproResult.extractedDomains.filter(
    (d) => !d.isLinker
  );
  log(
    `\nExtracted ${structuralDomains.length} structural domain(s) from InterPro results`
  );
  for (const d of structuralDomains) {
    log(`  • ${d.annotation} (${d.start}-${d.end}, ${d.sequence.length} AA)`);
  }

  await options?.callbacks?.onDomainsExtracted?.(structuralDomains, sequence.length, orderId);

  // ── Step 4: Per-domain pipelines (parallel) ──
  log("\n--- Stage 2: Per-Domain Analysis ---");

  const domainReports = await Promise.all(
    structuralDomains.map((domain, i) =>
      runDomainPipeline(domain, i, options?.callbacks)
    )
  );

  // ── Step 5: Integrated report ──
  log("\n--- Stage 3: Integrated Report ---");

  const integratedReport = buildIntegratedReport(
    structuralDomains,
    domainReports
  );

  const report: SequenceReport = {
    id: orderId,
    inputSequence: sequence,
    sequenceLength: sequence.length,
    status: "completed",
    domains: domainReports,
    integratedReport,
    startedAt,
    completedAt: new Date().toISOString(),
  };

  log(`\nPipeline complete: overall risk = ${integratedReport.overallRisk}`);
  log(`${"=".repeat(60)}\n`);

  return report;
}

// ── Integrated report builder ────────────────────────────────────────

function buildIntegratedReport(
  domains: ExtractedDomain[],
  domainReports: DomainReport[]
): IntegratedReport {
  const riskLevels = domainReports
    .map((dr) => dr.summary?.riskLevel ?? "UNKNOWN");
  const overallRisk = worstOfSignals(riskLevels);

  // Architecture summary: labeled domain rectangles
  const archParts = domainReports.map(
    (dr, i) =>
      `${dr.domain.annotation} (${dr.domain.start}–${dr.domain.end})`
  );
  const architectureSummary = archParts.join(" → ");

  // Synergistic factors
  const synergisticFactors = detectSynergisticFactors(domainReports);

  // Confidence: higher if all stages completed
  const allCompleted = domainReports.every(
    (dr) =>
      dr.progress.diamond === "completed" || dr.progress.diamond === "skipped"
  );
  const confidence = allCompleted
    ? overallRisk === "HIGH"
      ? 0.95
      : 0.85
    : 0.6;

  // Reasoning
  const reasoningParts: string[] = [];
  reasoningParts.push(
    `Analyzed ${domainReports.length} structural domain(s): ${architectureSummary}.`
  );

  for (const dr of domainReports) {
    if (dr.summary) {
      reasoningParts.push(
        `\n${dr.domain.annotation}: ${dr.summary.reasoning}`
      );
    }
  }

  if (synergisticFactors.length > 0) {
    reasoningParts.push(
      `\nSynergistic risk factors identified between domains.`
    );
  }

  // Flags
  const flags: string[] = [];
  for (const dr of domainReports) {
    if (dr.summary?.flags) {
      flags.push(...dr.summary.flags);
    }
  }
  if (synergisticFactors.length > 0) {
    flags.push("Synergistic domain architecture detected");
  }

  const decision = overallRisk === "HIGH" ? "Rejected"
    : overallRisk === "MEDIUM" ? "Manual Validation"
    : "Approved";

  return {
    overallRisk,
    confidence,
    architectureSummary,
    synergisticFactors,
    reasoning: reasoningParts.join("\n"),
    decision: decision as ScreeningDecision,
    flags: [...new Set(flags)],
  };
}

function detectSynergisticFactors(
  domainReports: DomainReport[]
): SynergisticRiskFactor[] {
  const factors: SynergisticRiskFactor[] = [];

  // Check for toxin + delivery domain combinations (Type II RIP pattern)
  const highRiskDomains = domainReports.filter(
    (dr) => dr.summary?.riskLevel === "HIGH"
  );
  const toxinDomains = domainReports.filter((dr) =>
    dr.summary?.flags?.some(
      (f) => f.includes("toxin") || f.includes("Toxin")
    )
  );
  const bindingDomains = domainReports.filter((dr) =>
    dr.domain.annotation.toLowerCase().includes("lectin") ||
    dr.domain.annotation.toLowerCase().includes("binding") ||
    dr.domain.metadata.some(
      (m) =>
        m.description.toLowerCase().includes("lectin") ||
        m.description.toLowerCase().includes("binding")
    )
  );

  if (toxinDomains.length > 0 && bindingDomains.length > 0) {
    factors.push({
      domains: [
        ...toxinDomains.map((d) => d.domain.annotation),
        ...bindingDomains.map((d) => d.domain.annotation),
      ],
      concern:
        "Catalytic toxin domain combined with cell-binding/delivery domain. " +
        "This architecture enables efficient cell entry and intoxication, " +
        "significantly increasing toxicity compared to individual domains.",
      riskContribution: "HIGH",
    });
  }

  // Multiple high-risk domains
  if (highRiskDomains.length >= 2) {
    factors.push({
      domains: highRiskDomains.map((d) => d.domain.annotation),
      concern:
        "Multiple domains independently flagged as high-risk. " +
        "Combined domain architecture may indicate a functional threat agent.",
      riskContribution: "HIGH",
    });
  }

  return factors;
}

// ── Export for tests ──────────────────────────────────────────────────

export {
  hasDiamondThreatMatch,
  classifyDiamondHit,
  diamondRiskSignal,
  buildIntegratedReport,
  worstOfSignals,
};
