import { createHash } from "crypto";
import { mkdir, writeFile, readFile, access } from "fs/promises";
import path from "path";
import type { FoldseekResult, ParsedTarget } from "./types";
import { parseHitTarget, deduplicateHits } from "./parse";
import { enrichHitsConcurrently } from "./enrich";

const FOLDSEEK_BASE = "https://search.foldseek.com/api";
const CACHE_DIR = path.resolve(process.cwd(), "data", "foldseek");

// ── Error class ───────────────────────────────────────────────────────

export class FoldseekError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "FoldseekError";
  }
}

// ── Options ───────────────────────────────────────────────────────────

type SearchOptions = {
  databases?: string[];
  probThreshold?: number;
  maxHitsPerDb?: number;
  pollInterval?: number;
  timeout?: number;
  sequenceHash?: string; // SHA-256 of the source sequence — used as cache key
};

// ── Helpers ───────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function cachePath(hash: string): string {
  return path.join(CACHE_DIR, `${hash}.json`);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readCache(hash: string): Promise<FoldseekResult | null> {
  const fp = cachePath(hash);
  if (!(await fileExists(fp))) return null;
  try {
    const raw = await readFile(fp, "utf-8");
    return JSON.parse(raw) as FoldseekResult;
  } catch {
    return null;
  }
}

async function writeCache(hash: string, result: FoldseekResult): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cachePath(hash), JSON.stringify(result), "utf-8");
}

// ── Main pipeline ─────────────────────────────────────────────────────

export async function searchStructure(
  pdbString: string,
  options?: SearchOptions
): Promise<FoldseekResult> {
  const databases = options?.databases ?? ["pdb100", "afdb50"];
  const probThreshold = options?.probThreshold ?? 0.4;
  const maxHitsPerDb = options?.maxHitsPerDb ?? 20;
  const pollInterval = options?.pollInterval ?? 3000;
  const timeout = options?.timeout ?? 120_000;
  const seqHash = options?.sequenceHash ?? null;

  // Check cache
  if (seqHash) {
    const cached = await readCache(seqHash);
    if (cached) return cached;
  }

  // Step 1 — Submit ticket
  const form = new FormData();
  form.append(
    "q",
    new Blob([pdbString], { type: "chemical/x-pdb" }),
    "query.pdb"
  );
  for (const db of databases) form.append("database[]", db);
  form.append("mode", "3diaa");

  const submitRes = await fetch(`${FOLDSEEK_BASE}/ticket`, {
    method: "POST",
    body: form,
  });

  if (!submitRes.ok) {
    const body = await submitRes.text().catch(() => "");
    throw new FoldseekError(
      `Foldseek ticket submission failed (${submitRes.status}): ${body.slice(0, 300)}`
    );
  }

  const submitData: unknown = await submitRes.json();
  const ticketId = (submitData as Record<string, any>)?.id as string;
  if (!ticketId) {
    throw new FoldseekError(
      `Foldseek ticket response missing id: ${JSON.stringify(submitData).slice(0, 300)}`
    );
  }

  // Step 2 — Poll until complete
  const start = Date.now();
  let status = "";

  while (Date.now() - start < timeout) {
    await sleep(pollInterval);

    const pollRes = await fetch(`${FOLDSEEK_BASE}/ticket/${ticketId}`);
    if (!pollRes.ok) {
      throw new FoldseekError(`Foldseek poll failed (${pollRes.status})`);
    }

    const pollData: unknown = await pollRes.json();
    status = (pollData as Record<string, any>)?.status as string;

    if (status === "COMPLETE") break;
    if (status === "ERROR") {
      throw new FoldseekError("Foldseek search returned ERROR status");
    }
  }

  if (status !== "COMPLETE") {
    throw new FoldseekError(
      `Foldseek search timed out after ${timeout / 1000}s`
    );
  }

  // Step 3 — Fetch results
  const resultRes = await fetch(`${FOLDSEEK_BASE}/result/${ticketId}/0`);
  if (!resultRes.ok) {
    throw new FoldseekError(`Foldseek result fetch failed (${resultRes.status})`);
  }

  const resultData: unknown = await resultRes.json();
  const dbResults = (resultData as Record<string, any>)?.results as any[] | undefined;

  // Step 4 — Parse raw hits
  type RawHitWithScores = ParsedTarget & {
    prob: number;
    evalue: number;
    taxName: string;
  };

  let totalRaw = 0;
  const parsedHits: RawHitWithScores[] = [];

  if (dbResults) {
    for (const dbResult of dbResults) {
      const db = (dbResult?.db as string) ?? "";
      const alignments = (dbResult?.alignments ?? []) as any[];

      for (const alignment of alignments) {
        // Foldseek returns alignments as objects with numeric keys, not arrays
        const hits = Object.values(alignment) as any[];
        totalRaw += hits.length;

        for (const hit of hits.slice(0, maxHitsPerDb)) {
          const prob = (hit?.prob as number) ?? 0;
          if (prob < probThreshold) continue;

          // Target string is "ID description" — parse only the ID part
          const rawTarget = (hit?.target as string) ?? "";
          const targetId = rawTarget.split(" ")[0];
          const parsed = parseHitTarget(targetId, db);

          parsedHits.push({
            ...parsed,
            prob,
            evalue: (hit?.eval as number) ?? (hit?.evalue as number) ?? 999,
            taxName: (hit?.taxName as string) ?? "",
          });
        }
      }
    }
  }

  // Step 5 — Enrich concurrently
  const enrichedHits = await enrichHitsConcurrently(parsedHits);

  // Step 6 — Deduplicate and sort
  const deduplicatedHits = deduplicateHits(enrichedHits);

  // Step 7 — Return
  const result: FoldseekResult = {
    hits: deduplicatedHits,
    ticketId,
    databasesUsed: databases,
    totalRaw,
    totalReturned: deduplicatedHits.length,
  };

  // Write cache
  if (seqHash) {
    await writeCache(seqHash, result).catch((err) =>
      console.warn("[foldseek] cache write failed:", err)
    );
  }

  return result;
}
