import type { ParsedTarget, FoldseekHit, RiskKeywordMatch } from "./types";

// ── Dangerous keywords ────────────────────────────────────────────────

export const DANGEROUS_KEYWORDS = new Set([
  "Toxin",
  "Neurotoxin",
  "Cytotoxin",
  "Enterotoxin",
  "Ribosome-inactivating protein",
  "Pore-forming toxin",
  "Hemotoxin",
  "Dermonecrotic toxin",
  "Cardiotoxin",
  "Virulence",
  "Host-virus interaction",
  "Inhibition of host innate immunity",
]);

// ── Keyword check ─────────────────────────────────────────────────────

export function checkDangerousKeywords(keywords: string[]): RiskKeywordMatch {
  const matchedKeywords = keywords.filter((kw) => DANGEROUS_KEYWORDS.has(kw));
  return { flagged: matchedKeywords.length > 0, matchedKeywords };
}

// ── Target parsing ────────────────────────────────────────────────────

export function parseHitTarget(target: string, sourceDb: string): ParsedTarget {
  const raw = target.toUpperCase();

  if (raw.startsWith("AF-")) {
    // AlphaFold: "AF-P02879-F1" or "AF-A0A8D0HA87-F1-MODEL_V6"
    // UniProt ID is between first and second dash; fragment is the next part
    const parts = raw.split("-");
    return {
      raw,
      hitType: "alphafold",
      pdbId: null,
      chain: null,
      uniprotId: parts[1] ?? null,
      fragment: parts[2] ?? null,
      sourceDb,
    };
  }

  // PDB: "1RTC_A", "3H7S-ASSEMBLY2.CIF.GZ_A", or just "1RTC"
  // PDB ID is always the first 4 characters; chain is after the last "_"
  const lastUnderscore = raw.lastIndexOf("_");
  const pdbId = raw.substring(0, 4);
  const chain = lastUnderscore !== -1 ? raw.substring(lastUnderscore + 1) : "A";
  return {
    raw,
    hitType: "pdb",
    pdbId,
    chain,
    uniprotId: null,
    fragment: null,
    sourceDb,
  };
}

// ── Deduplication ─────────────────────────────────────────────────────

export function deduplicateHits(hits: FoldseekHit[]): FoldseekHit[] {
  const bestByUniprot = new Map<string, FoldseekHit>();
  const noId: FoldseekHit[] = [];

  for (const hit of hits) {
    if (hit.uniprotId === null) {
      noId.push(hit);
      continue;
    }
    const existing = bestByUniprot.get(hit.uniprotId);
    if (!existing || hit.prob > existing.prob) {
      bestByUniprot.set(hit.uniprotId, hit);
    }
  }

  return [...bestByUniprot.values(), ...noId].sort((a, b) => b.prob - a.prob);
}
