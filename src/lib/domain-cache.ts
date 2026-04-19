import { createHash } from "crypto";
import { mkdir, writeFile, readFile, readdir } from "fs/promises";
import path from "path";
import type { InterProResult, DomainSlice } from "./interpro";
import type { ExtractedDomain, DomainMetadata } from "./extract-domains";
import { blobCacheEnabled, readBlobText, writeBlobText } from "./blob-cache";

// ── Types ──────────────────────────────────────────────────────────────

export interface CachedExtractedDomain {
  sequence: string;
  start: number;
  end: number;
  annotation: string;
  signatures: string[];
  isLinker: boolean;
  metadata: DomainMetadata[];
}

export interface CachedDomainEntry {
  /** SHA-256 hash of the input sequence (used as cache key) */
  sequenceHash: string;
  /** Timestamp of when the scan was performed */
  timestamp: string;
  /** Original input sequence */
  inputSequence: string;
  /** InterPro scan status */
  status: InterProResult["status"];
  /** Duration of the InterPro scan in seconds */
  searchDuration: number;
  /** Individual domain substrings with metadata */
  slices: Array<{
    accession: string;
    name: string;
    type: string;
    database: string;
    start: number;
    end: number;
    evalue: number | null;
    sequence: string;
  }>;
  /** Consolidated extracted domains from the extraction pipeline */
  extractedDomains: CachedExtractedDomain[];
}

// ── Constants ──────────────────────────────────────────────────────────

const CACHE_DIR = path.join(process.cwd(), ".domain-cache");
const BLOB_PREFIX = "domain-cache";

// ── Helpers ────────────────────────────────────────────────────────────

function hashSequence(sequence: string): string {
  return createHash("sha256").update(sequence).digest("hex");
}

function cacheFilePath(hash: string): string {
  return path.join(CACHE_DIR, `${hash}.json`);
}

function blobPathname(hash: string): string {
  return `${BLOB_PREFIX}/${hash}.json`;
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Cache an InterPro result's domain slices to disk.
 * File is written to .domain-cache/<sha256>.json
 */
export async function cacheDomainSlices(
  inputSequence: string,
  result: InterProResult
): Promise<CachedDomainEntry> {
  const hash = hashSequence(inputSequence);

  const entry: CachedDomainEntry = {
    sequenceHash: hash,
    timestamp: new Date().toISOString(),
    inputSequence,
    status: result.status,
    searchDuration: result.searchDuration,
    slices: result.slices.map((s: DomainSlice) => ({
      accession: s.domain.accession,
      name: s.domain.name,
      type: s.domain.type,
      database: s.domain.database,
      start: s.domain.start,
      end: s.domain.end,
      evalue: s.domain.evalue,
      sequence: s.sequence,
    })),
    extractedDomains: result.extractedDomains.map((ed: ExtractedDomain) => ({
      sequence: ed.sequence,
      start: ed.start,
      end: ed.end,
      annotation: ed.annotation,
      signatures: ed.signatures,
      isLinker: ed.isLinker,
      metadata: ed.metadata,
    })),
  };

  const serialized = JSON.stringify(entry, null, 2);

  if (blobCacheEnabled()) {
    const url = await writeBlobText(blobPathname(hash), serialized, "application/json");
    if (url) {
      console.log(
        `Domain cache: wrote ${entry.slices.length} slice(s) → blob ${BLOB_PREFIX}/${hash.slice(0, 12)}...json`
      );
      return entry;
    }
    // Blob write failed — fall through to local FS as a best-effort backup.
  }

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cacheFilePath(hash), serialized, "utf-8");
  console.log(`Domain cache: wrote ${entry.slices.length} slice(s) → .domain-cache/${hash.slice(0, 12)}...json`);

  return entry;
}

/**
 * Look up a cached result by input sequence.
 * Returns null if not cached.
 */
export async function getCachedDomainSlices(
  inputSequence: string
): Promise<CachedDomainEntry | null> {
  const hash = hashSequence(inputSequence);

  if (blobCacheEnabled()) {
    const data = await readBlobText(blobPathname(hash));
    if (data) {
      try {
        return JSON.parse(data) as CachedDomainEntry;
      } catch {
        // Corrupt blob entry — ignore and try local FS fallback.
      }
    }
  }

  try {
    const data = await readFile(cacheFilePath(hash), "utf-8");
    return JSON.parse(data) as CachedDomainEntry;
  } catch {
    return null;
  }
}

/**
 * List all cached entries (returns metadata without full sequences for overview).
 */
export async function listCachedScans(): Promise<
  Array<{ sequenceHash: string; timestamp: string; sliceCount: number; status: string }>
> {
  try {
    const files = await readdir(CACHE_DIR);
    const entries = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          const data = await readFile(path.join(CACHE_DIR, f), "utf-8");
          const entry = JSON.parse(data) as CachedDomainEntry;
          return {
            sequenceHash: entry.sequenceHash,
            timestamp: entry.timestamp,
            sliceCount: entry.slices.length,
            status: entry.status,
          };
        })
    );
    return entries;
  } catch {
    return [];
  }
}

/**
 * Get just the substring sequences from a cached entry (for downstream tools like BLAST).
 * Returns an array of { accession, name, sequence } or null if not cached.
 */
export async function getCachedSubstrings(
  inputSequence: string
): Promise<Array<{ accession: string; name: string; start: number; end: number; sequence: string }> | null> {
  const entry = await getCachedDomainSlices(inputSequence);
  if (!entry) return null;

  return entry.slices.map((s) => ({
    accession: s.accession,
    name: s.name,
    start: s.start,
    end: s.end,
    sequence: s.sequence,
  }));
}
