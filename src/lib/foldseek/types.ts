export type HitType = "pdb" | "alphafold";

export type RiskKeywordMatch = {
  flagged: boolean;
  matchedKeywords: string[];
};

export type ParsedTarget = {
  raw: string;
  hitType: HitType;
  // PDB hits
  pdbId: string | null; // e.g. "1RTC"
  chain: string | null; // e.g. "A"
  // AlphaFold hits
  uniprotId: string | null; // e.g. "P02879"
  fragment: string | null; // e.g. "F1"
  sourceDb: string; // "pdb100" or "afdb50"
};

export type UniprotAnnotations = {
  uniprotId: string;
  proteinName: string;
  organism: string;
  keywords: string[];
  function: string;
};

export type FoldseekHit = ParsedTarget & {
  // Scores
  prob: number;
  evalue: number;
  // Annotations (empty strings / empty arrays if enrichment failed)
  proteinName: string;
  organism: string;
  keywords: string[];
  function: string;
  taxName: string; // from Foldseek response — fallback if UniProt fails
  // Risk
  riskKeywords: string[];
  flagged: boolean;
};

export type FoldseekResult = {
  hits: FoldseekHit[];
  ticketId: string;
  databasesUsed: string[];
  totalRaw: number; // hits before deduplication + threshold filter
  totalReturned: number; // hits after deduplication + threshold filter
};

// API route request/response
export type FoldseekRequest = {
  pdbString: string;
  probThreshold?: number; // default 0.4
  maxHitsPerDb?: number; // default 20
};

export type FoldseekResponse =
  | { success: true; data: FoldseekResult }
  | { success: false; error: string };
