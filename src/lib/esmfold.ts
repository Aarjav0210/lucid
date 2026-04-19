import { createHash } from "crypto";
import { mkdir, writeFile, readFile, access } from "fs/promises";
import path from "path";
import { blobCacheEnabled, readBlobText, writeBlobText } from "./blob-cache";

// ── Types ──────────────────────────────────────────────────────────────

export interface EsmFoldResult {
  status: "completed" | "error";
  error?: string;
  pdbString: string;
  pdbPath: string;
  sequenceLength: number;
  plddtMean: number;
  plddtPerResidue: number[];
  predictedAt: string; // ISO 8601
  cached: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────

const ESM_API_URL =
  process.env.ESM_API_URL ?? "https://api.esmatlas.com/foldSequence/v1/pdb/";
const TIMEOUT_MS = 120_000; // 2 minutes
const PDB_DIR = process.env.VERCEL
  ? "/tmp/pdb"
  : path.resolve(process.cwd(), "data", "pdb");
const BLOB_PREFIX = "esmfold";

// ── pLDDT extraction ──────────────────────────────────────────────────

/**
 * ESMFold writes per-residue pLDDT scores into the B-factor column
 * (columns 61-66) of ATOM records in the returned PDB.
 * We extract one value per residue (using only Cα atoms to avoid duplicates).
 */
function extractPlddtFromPdb(pdb: string): number[] {
  const scores: number[] = [];
  for (const line of pdb.split("\n")) {
    if (!line.startsWith("ATOM")) continue;
    // PDB ATOM records: columns 13-16 = atom name, 61-66 = B-factor
    const atomName = line.substring(12, 16).trim();
    if (atomName !== "CA") continue;
    const bFactor = parseFloat(line.substring(60, 66));
    if (!isNaN(bFactor)) scores.push(bFactor);
  }
  return scores;
}

// ── Hashing & file helpers ─────────────────────────────────────────────

function seqHash(sequence: string): string {
  return createHash("sha256").update(sequence.toUpperCase()).digest("hex");
}

function pdbFilePath(hash: string): string {
  return path.join(PDB_DIR, `${hash}.pdb`);
}

function blobPathname(hash: string): string {
  return `${BLOB_PREFIX}/${hash}.pdb`;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Look up a cached PDB by sequence hash. Checks Vercel Blob first when
 * enabled, otherwise falls back to the local filesystem cache. Returns
 * the PDB text plus the resolved locator (blob URL or local path).
 */
async function readCachedPdb(
  hash: string
): Promise<{ pdbString: string; locator: string } | null> {
  if (blobCacheEnabled()) {
    const data = await readBlobText(blobPathname(hash));
    if (data) {
      // When read via findBlobUrl we don't keep the URL around here; the
      // pathname is deterministic and sufficient as a locator for the
      // downstream report. Callers use pdbString, not pdbPath, for
      // rendering the structure.
      return { pdbString: data, locator: blobPathname(hash) };
    }
  }

  const filePath = pdbFilePath(hash);
  if (await fileExists(filePath)) {
    const pdbString = await readFile(filePath, "utf-8");
    return { pdbString, locator: filePath };
  }

  return null;
}

// ── Main entry point ──────────────────────────────────────────────────

export async function predictStructureEsm(
  sequence: string
): Promise<EsmFoldResult> {
  const hash = seqHash(sequence);

  const cached = await readCachedPdb(hash);
  if (cached) {
    const plddtPerResidue = extractPlddtFromPdb(cached.pdbString);
    const plddtRaw =
      plddtPerResidue.length > 0
        ? plddtPerResidue.reduce((a, b) => a + b, 0) / plddtPerResidue.length
        : 0;
    // ESMFold stores pLDDT in B-factor as 0-1; normalize to 0-100
    const plddtMean = plddtRaw <= 1 ? Math.round(plddtRaw * 10000) / 100 : Math.round(plddtRaw * 100) / 100;

    return {
      status: "completed",
      pdbString: cached.pdbString,
      pdbPath: cached.locator,
      sequenceLength: sequence.length,
      plddtMean,
      plddtPerResidue,
      predictedAt: new Date().toISOString(),
      cached: true,
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(ESM_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: sequence,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        status: "error",
        error: `ESMFold API returned ${response.status}: ${body.slice(0, 300)}`,
        pdbString: "",
        pdbPath: "",
        sequenceLength: sequence.length,
        plddtMean: 0,
        plddtPerResidue: [],
        predictedAt: new Date().toISOString(),
        cached: false,
      };
    }

    const pdbString = await response.text();
    const plddtPerResidue = extractPlddtFromPdb(pdbString);
    const plddtRaw =
      plddtPerResidue.length > 0
        ? plddtPerResidue.reduce((a, b) => a + b, 0) / plddtPerResidue.length
        : 0;
    // ESMFold stores pLDDT in B-factor as 0-1; normalize to 0-100
    const plddtMean = plddtRaw <= 1 ? Math.round(plddtRaw * 10000) / 100 : Math.round(plddtRaw * 100) / 100;

    // Persist to cache. Prefer Vercel Blob so other serverless instances
    // (and users) get cache hits; otherwise fall back to the local FS
    // cache (dev without a blob token configured).
    let pdbLocator: string;
    const blobUrl = blobCacheEnabled()
      ? await writeBlobText(blobPathname(hash), pdbString, "chemical/x-pdb")
      : null;

    if (blobUrl) {
      pdbLocator = blobUrl;
    } else {
      const filePath = pdbFilePath(hash);
      await mkdir(PDB_DIR, { recursive: true });
      await writeFile(filePath, pdbString, "utf-8");
      pdbLocator = filePath;
    }

    return {
      status: "completed",
      pdbString,
      pdbPath: pdbLocator,
      sequenceLength: sequence.length,
      plddtMean,
      plddtPerResidue,
      predictedAt: new Date().toISOString(),
      cached: false,
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? `ESMFold request timed out after ${TIMEOUT_MS / 1000}s`
          : err.message
        : String(err);

    return {
      status: "error",
      error: message,
      pdbString: "",
      pdbPath: "",
      sequenceLength: sequence.length,
      plddtMean: 0,
      plddtPerResidue: [],
      predictedAt: new Date().toISOString(),
      cached: false,
    };
  }
}
