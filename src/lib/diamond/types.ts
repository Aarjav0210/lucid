export interface DiamondHit {
  target: string;          // e.g. "P02879"
  identity: number;        // percentage, e.g. 85.5
  alignmentLength: number; // e.g. 245
  mismatches: number;
  gapOpenings: number;
  qStart: number;
  qEnd: number;
  sStart: number;
  sEnd: number;
  eValue: number;          // e.g. 1e-45
  bitScore: number;
  qseq: string;            // aligned query sequence (with gaps)
  sseq: string;            // aligned subject sequence (with gaps)
  description?: string;    // e.g. "Ricin A-chain"
}

export interface DiamondResult {
  status: "completed" | "no_hits" | "error";
  error?: string;
  hits: DiamondHit[];
  searchDuration: number; // seconds
}
