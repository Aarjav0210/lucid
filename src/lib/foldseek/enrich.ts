import type { ParsedTarget, FoldseekHit, UniprotAnnotations } from "./types";
import { checkDangerousKeywords } from "./parse";

const UNIPROT_BASE = "https://rest.uniprot.org/uniprotkb";
const RCSB_BASE = "https://data.rcsb.org/rest/v1/core";

// ── Hit type with scores (input to enrichment) ────────────────────────

type ParsedHitWithScores = ParsedTarget & {
  prob: number;
  evalue: number;
  taxName: string;
};

// ── UniProt fetch ─────────────────────────────────────────────────────

async function fetchUniprotAnnotations(
  uniprotId: string
): Promise<UniprotAnnotations> {
  const res = await fetch(`${UNIPROT_BASE}/${uniprotId}.json`);
  if (!res.ok) throw new Error(`UniProt ${res.status}`);

  const data: unknown = await res.json();
  const d = data as Record<string, any>;

  return {
    uniprotId,
    proteinName:
      d?.proteinDescription?.recommendedName?.fullName?.value ?? "",
    organism: d?.organism?.scientificName ?? "",
    keywords: (d?.keywords ?? []).map((kw: any) => kw.name as string),
    function:
      d?.comments?.find((c: any) => c.commentType === "FUNCTION")?.texts?.[0]
        ?.value ?? "",
  };
}

// ── RCSB → UniProt resolution ─────────────────────────────────────────

async function resolveUniprotFromPdb(
  pdbId: string,
  chain: string
): Promise<string | null> {
  // Step 1: get entity ID
  const instanceRes = await fetch(
    `${RCSB_BASE}/polymer_entity_instance/${pdbId}/${chain}`
  );
  if (!instanceRes.ok) return null;

  const instanceData: unknown = await instanceRes.json();
  const entityId = (instanceData as Record<string, any>)
    ?.rcsb_polymer_entity_instance_container_identifiers?.entity_id;
  if (!entityId) return null;

  // Step 2: get UniProt accessions from entity
  const entityRes = await fetch(
    `${RCSB_BASE}/polymer_entity/${pdbId}/${entityId}`
  );
  if (!entityRes.ok) return null;

  const entityData: unknown = await entityRes.json();
  const uniprotIds = (entityData as Record<string, any>)
    ?.rcsb_polymer_entity_container_identifiers?.uniprot_ids as
    | string[]
    | undefined;

  return uniprotIds?.[0] ?? null;
}

// ── Empty annotations fallback ────────────────────────────────────────

function emptyHit(hit: ParsedHitWithScores): FoldseekHit {
  return {
    ...hit,
    proteinName: "",
    organism: "",
    keywords: [],
    function: "",
    riskKeywords: [],
    flagged: false,
  };
}

// ── Single hit enrichment ─────────────────────────────────────────────

export async function enrichHit(hit: ParsedHitWithScores): Promise<FoldseekHit> {
  try {
    let annotations: UniprotAnnotations | null = null;

    if (hit.hitType === "alphafold" && hit.uniprotId) {
      annotations = await fetchUniprotAnnotations(hit.uniprotId);
    } else if (hit.hitType === "pdb" && hit.pdbId && hit.chain) {
      const uniprotId = await resolveUniprotFromPdb(hit.pdbId, hit.chain);
      if (uniprotId) {
        // Attach resolved uniprotId to the hit for deduplication
        hit = { ...hit, uniprotId };
        annotations = await fetchUniprotAnnotations(uniprotId);
      }
    }

    if (!annotations) return emptyHit(hit);

    const { flagged, matchedKeywords } = checkDangerousKeywords(
      annotations.keywords
    );

    return {
      ...hit,
      uniprotId: annotations.uniprotId,
      proteinName: annotations.proteinName,
      organism: annotations.organism,
      keywords: annotations.keywords,
      function: annotations.function,
      riskKeywords: matchedKeywords,
      flagged,
    };
  } catch (err) {
    console.warn("[foldseek] enrichment failed for", hit.raw, err);
    return emptyHit(hit);
  }
}

// ── Concurrent enrichment ─────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function enrichHitsConcurrently(
  hits: ParsedHitWithScores[],
  concurrency = 5
): Promise<FoldseekHit[]> {
  const chunks = chunkArray(hits, concurrency);
  const results: FoldseekHit[] = [];
  for (const chunk of chunks) {
    const enriched = await Promise.all(chunk.map(enrichHit));
    results.push(...enriched);
  }
  return results;
}
