import type { DiamondHit } from "./types";

/**
 * Parse DIAMOND's default tabular output (outfmt 6).
 * Columns: qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore
 */
export function parseDiamondOutput(tsv: string): DiamondHit[] {
  const hits: DiamondHit[] = [];

  for (const line of tsv.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const cols = trimmed.split("\t");
    if (cols.length < 12) continue;

    hits.push({
      target: cols[1],
      identity: parseFloat(cols[2]),
      alignmentLength: parseInt(cols[3], 10),
      mismatches: parseInt(cols[4], 10),
      gapOpenings: parseInt(cols[5], 10),
      qStart: parseInt(cols[6], 10),
      qEnd: parseInt(cols[7], 10),
      sStart: parseInt(cols[8], 10),
      sEnd: parseInt(cols[9], 10),
      eValue: parseFloat(cols[10]),
      bitScore: parseFloat(cols[11]),
    });
  }

  return hits.sort((a, b) => b.identity - a.identity);
}
