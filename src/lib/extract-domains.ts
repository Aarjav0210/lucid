// ── extract-domains.ts ─────────────────────────────────────────────────
//
// Takes raw (overlapping) InterPro hits and produces non-overlapping
// structural domain substrings suitable for ESMFold / Foldseek screening.
//
// Key insight: InterPro returns multiple annotation *layers*:
//   - DOMAIN          → actual structural/functional domain boundaries
//   - HOMOLOGOUS_SUPERFAMILY → broad evolutionary groupings (span multiple domains)
//   - FAMILY           → classification of the whole protein (spans everything)
//   - REPEAT           → repeated structural motifs
//   - *_SITE           → single residues or short motifs within domains
//
// Only DOMAIN (and REPEAT) entries define real structural boundaries.
// Everything else is metadata that should be attached to those boundaries,
// not used to define them.
//
// Algorithm:
//   1. Separate hits into boundary-defining (DOMAIN, REPEAT) vs metadata
//   2. Group overlapping boundary hits into structural domains
//   3. Assign metadata hits to whichever domain they overlap most with
//   4. Handle gaps (linkers) and flanking regions
//   5. Fallback: if no DOMAIN-type hits exist, use SUPERFAMILY boundaries

// ── Types ──────────────────────────────────────────────────────────────

export interface InterProHit {
  signature: string;      // e.g. "IPR001574"
  start: number;          // 1-based position
  end: number;            // 1-based position
  description: string;    // e.g. "Ribosome-inactivating protein"
  type?: string;          // DOMAIN, FAMILY, HOMOLOGOUS_SUPERFAMILY, etc.
}

export interface ExtractedDomain {
  sequence: string;       // actual amino acid substring
  start: number;          // 1-based start position (in original sequence)
  end: number;            // 1-based end position
  annotation: string;     // best description for this region
  signatures: string[];   // all InterPro accessions that mapped here
  isLinker: boolean;      // true if this is an inter-domain gap region
  metadata: DomainMetadata[]; // broader annotations (family, superfamily, sites)
}

export interface DomainMetadata {
  signature: string;
  description: string;
  type: string;
}

// ── Configuration ──────────────────────────────────────────────────────

/** Domains shorter than this are merged into their neighbor */
const MIN_DOMAIN_LENGTH = 30;

/** Gap regions shorter than this are absorbed into the adjacent domain */
const MIN_LINKER_LENGTH = 15;

/** InterPro types that define actual structural domain boundaries */
const BOUNDARY_TYPES = new Set(["DOMAIN", "REPEAT"]);

/** Fallback types used when no DOMAIN/REPEAT hits exist */
const FALLBACK_BOUNDARY_TYPES = new Set(["HOMOLOGOUS_SUPERFAMILY"]);

/** Types that are purely metadata (never define boundaries) */
const METADATA_ONLY_TYPES = new Set([
  "FAMILY",
  "ACTIVE_SITE",
  "BINDING_SITE",
  "CONSERVED_SITE",
  "PTM",
  "SITE",
]);

// ── Overlap grouping (interval clustering) ─────────────────────────────

interface HitGroup {
  start: number;          // merged start (1-based)
  end: number;            // merged end (1-based)
  members: InterProHit[];
}

/**
 * Cluster hits whose ranges overlap into groups.
 * Uses a sweep-line approach: sort by start, then greedily extend.
 */
function groupOverlappingHits(hits: InterProHit[]): HitGroup[] {
  if (hits.length === 0) return [];

  const sorted = [...hits].sort((a, b) => a.start - b.start || b.end - a.end);
  const groups: HitGroup[] = [];

  let current: HitGroup = {
    start: sorted[0].start,
    end: sorted[0].end,
    members: [sorted[0]],
  };

  for (let i = 1; i < sorted.length; i++) {
    const hit = sorted[i];
    if (hit.start <= current.end) {
      // Overlapping — merge into current group
      current.end = Math.max(current.end, hit.end);
      current.members.push(hit);
    } else {
      groups.push(current);
      current = { start: hit.start, end: hit.end, members: [hit] };
    }
  }
  groups.push(current);

  return groups;
}

/**
 * Pick the best annotation for a group of structural domain hits.
 * Prefers DOMAIN type, then longest span, then longest description.
 */
function pickBestAnnotation(members: InterProHit[]): string {
  const ranked = [...members].sort((a, b) => {
    // Prefer DOMAIN type
    const aIsDomain = a.type === "DOMAIN" ? 0 : 1;
    const bIsDomain = b.type === "DOMAIN" ? 0 : 1;
    if (aIsDomain !== bIsDomain) return aIsDomain - bIsDomain;

    // Then longest span
    const spanDiff = (b.end - b.start) - (a.end - a.start);
    if (spanDiff !== 0) return spanDiff;

    // Then longest description
    return b.description.length - a.description.length;
  });

  return ranked[0].description;
}

/**
 * Calculate how much a hit overlaps with a domain region.
 * Returns number of overlapping residues.
 */
function overlapSize(
  hitStart: number, hitEnd: number,
  domStart: number, domEnd: number
): number {
  const start = Math.max(hitStart, domStart);
  const end = Math.min(hitEnd, domEnd);
  return Math.max(0, end - start + 1);
}

// ── Main extraction function ───────────────────────────────────────────

/**
 * Extract non-overlapping structural domain substrings from a protein
 * sequence given a set of (potentially overlapping) InterPro hits.
 *
 * Uses DOMAIN-type entries for boundaries. FAMILY, SUPERFAMILY, and
 * SITE entries are attached as metadata to the domain they overlap with.
 */
export function extractDomains(
  sequence: string,
  interproHits: InterProHit[]
): ExtractedDomain[] {
  if (!sequence || sequence.length === 0) return [];
  if (interproHits.length === 0) {
    return [
      {
        sequence,
        start: 1,
        end: sequence.length,
        annotation: "Full sequence (no domains identified)",
        signatures: [],
        isLinker: false,
        metadata: [],
      },
    ];
  }

  // Filter valid hits
  const validHits = interproHits.filter(
    (h) => h.start >= 1 && h.end <= sequence.length && h.end > h.start
  );

  if (validHits.length === 0) {
    return [
      {
        sequence,
        start: 1,
        end: sequence.length,
        annotation: "Full sequence (no valid domains)",
        signatures: [],
        isLinker: false,
        metadata: [],
      },
    ];
  }

  // ── Step 1: Separate boundary-defining hits from metadata ──

  let boundaryHits = validHits.filter((h) => BOUNDARY_TYPES.has(h.type ?? ""));
  const metadataHits = validHits.filter((h) => !BOUNDARY_TYPES.has(h.type ?? ""));

  // Fallback: if no DOMAIN/REPEAT hits, use HOMOLOGOUS_SUPERFAMILY
  if (boundaryHits.length === 0) {
    boundaryHits = validHits.filter((h) => FALLBACK_BOUNDARY_TYPES.has(h.type ?? ""));
    // Remove those from metadata so they don't appear twice
    const fallbackSigs = new Set(boundaryHits.map((h) => `${h.signature}:${h.start}-${h.end}`));
    const filteredMeta = metadataHits.filter(
      (h) => !fallbackSigs.has(`${h.signature}:${h.start}-${h.end}`)
    );
    metadataHits.length = 0;
    metadataHits.push(...filteredMeta);
  }

  // Final fallback: if still nothing, use all non-FAMILY, non-SITE hits
  if (boundaryHits.length === 0) {
    boundaryHits = validHits.filter((h) => !METADATA_ONLY_TYPES.has(h.type ?? ""));
  }

  // Last resort: use everything
  if (boundaryHits.length === 0) {
    boundaryHits = validHits;
  }

  // ── Step 2: Group overlapping boundary hits into structural domains ──

  const groups = groupOverlappingHits(boundaryHits);

  // Merge tiny groups into neighbors
  const merged = mergeTinyGroups(groups);

  // ── Step 3: Build domain segments ──

  const domainSegments: Array<{
    start: number;
    end: number;
    annotation: string;
    signatures: string[];
    members: InterProHit[];
  }> = merged.map((group) => ({
    start: group.start,
    end: group.end,
    annotation: pickBestAnnotation(group.members),
    signatures: [...new Set(group.members.map((m) => m.signature))],
    members: group.members,
  }));

  // ── Step 4: Assign metadata hits to their best-matching domain ──

  const domainMetadata: DomainMetadata[][] = domainSegments.map(() => []);

  for (const meta of metadataHits) {
    let bestIdx = -1;
    let bestOverlap = 0;

    for (let i = 0; i < domainSegments.length; i++) {
      const overlap = overlapSize(meta.start, meta.end, domainSegments[i].start, domainSegments[i].end);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0 && bestOverlap > 0) {
      domainMetadata[bestIdx].push({
        signature: meta.signature,
        description: meta.description,
        type: meta.type ?? "UNKNOWN",
      });
      // Also add the signature to the domain's signature list
      if (!domainSegments[bestIdx].signatures.includes(meta.signature)) {
        domainSegments[bestIdx].signatures.push(meta.signature);
      }
    }
  }

  // ── Step 5: Build final output with linker regions ──

  const results: ExtractedDomain[] = [];
  const seqLen = sequence.length;

  for (let i = 0; i < domainSegments.length; i++) {
    const seg = domainSegments[i];
    const prevEnd = i === 0 ? 0 : domainSegments[i - 1].end;

    // Emit linker/gap before this domain
    const gapStart = prevEnd + 1;
    const gapEnd = seg.start - 1;
    if (gapEnd >= gapStart) {
      const gapLen = gapEnd - gapStart + 1;
      if (gapLen >= MIN_LINKER_LENGTH) {
        results.push({
          sequence: sequence.slice(gapStart - 1, gapEnd),
          start: gapStart,
          end: gapEnd,
          annotation: `Linker region (${gapLen} residues)`,
          signatures: [],
          isLinker: true,
          metadata: [],
        });
      } else {
        // Absorb small gap into this domain
        seg.start = gapStart;
      }
    }

    // Emit the domain
    results.push({
      sequence: sequence.slice(seg.start - 1, seg.end),
      start: seg.start,
      end: seg.end,
      annotation: seg.annotation,
      signatures: seg.signatures,
      isLinker: false,
      metadata: domainMetadata[i],
    });
  }

  // Handle trailing residues
  const lastEnd = domainSegments[domainSegments.length - 1].end;
  if (lastEnd < seqLen) {
    const tailLen = seqLen - lastEnd;
    if (tailLen >= MIN_LINKER_LENGTH) {
      results.push({
        sequence: sequence.slice(lastEnd, seqLen),
        start: lastEnd + 1,
        end: seqLen,
        annotation: `C-terminal region (${tailLen} residues)`,
        signatures: [],
        isLinker: true,
        metadata: [],
      });
    } else {
      const last = results[results.length - 1];
      last.end = seqLen;
      last.sequence = sequence.slice(last.start - 1, seqLen);
    }
  }

  // Handle leading residues
  if (results.length > 0 && results[0].start > 1) {
    const headLen = results[0].start - 1;
    if (headLen >= MIN_LINKER_LENGTH) {
      results.unshift({
        sequence: sequence.slice(0, headLen),
        start: 1,
        end: headLen,
        annotation: `N-terminal region (${headLen} residues)`,
        signatures: [],
        isLinker: true,
        metadata: [],
      });
    } else {
      results[0].start = 1;
      results[0].sequence = sequence.slice(0, results[0].end);
    }
  }

  return results;
}

// ── Tiny group merging ─────────────────────────────────────────────────

function mergeTinyGroups(groups: HitGroup[]): HitGroup[] {
  if (groups.length <= 1) return groups;

  const result: HitGroup[] = [];
  for (const group of groups) {
    const span = group.end - group.start + 1;
    if (span >= MIN_DOMAIN_LENGTH || result.length === 0) {
      result.push({ ...group, members: [...group.members] });
    } else {
      // Merge into the previous group
      const prev = result[result.length - 1];
      prev.end = Math.max(prev.end, group.end);
      prev.members.push(...group.members);
    }
  }

  return result;
}

// ── Utility: summary for logging ───────────────────────────────────────

export function summarizeDomains(domains: ExtractedDomain[]): string {
  if (domains.length === 0) return "No domains extracted.";

  let domainNum = 0;
  const lines = domains.map((d) => {
    const tag = d.isLinker ? "LINKER" : `DOMAIN ${++domainNum}`;
    let line = `  [${tag}] ${d.start}–${d.end} (${d.sequence.length} AA): ${d.annotation}`;
    if (d.signatures.length > 0) {
      line += ` [${d.signatures.join(", ")}]`;
    }
    if (d.metadata.length > 0) {
      const metaStrs = d.metadata.map((m) => `${m.description} (${m.type})`);
      line += `\n           Metadata: ${metaStrs.join("; ")}`;
    }
    return line;
  });

  const domainCount = domains.filter((d) => !d.isLinker).length;
  const linkerCount = domains.filter((d) => d.isLinker).length;

  return [
    `Extracted ${domainCount} domain(s)${linkerCount > 0 ? ` + ${linkerCount} linker(s)` : ""}:`,
    ...lines,
  ].join("\n");
}
