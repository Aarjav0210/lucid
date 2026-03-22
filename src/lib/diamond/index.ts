import { exec } from "child_process";
import { mkdir, writeFile, unlink, access } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { promisify } from "util";
import type { DiamondHit, DiamondResult } from "./types";
import { parseDiamondOutput } from "./parse";
import { buildCuratedDatabase, getDatabasePath } from "./database";

const execAsync = promisify(exec);

const TMP_DIR = path.resolve(process.cwd(), "data", "diamond", "tmp");
const TIMEOUT_MS = 60_000;

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Run DIAMOND blastp against the curated toxin database.
 * Builds the database on first call if it doesn't exist.
 */
export async function diamondSearch(
  sequence: string
): Promise<DiamondResult> {
  const start = Date.now();
  const id = randomUUID();
  const queryPath = path.join(TMP_DIR, `query_${id}.fasta`);
  const outPath = path.join(TMP_DIR, `result_${id}.tsv`);

  try {
    // Ensure database exists
    const dbPath = getDatabasePath();
    if (!(await fileExists(dbPath))) {
      await buildCuratedDatabase();
    }

    // Write query to temp FASTA
    await mkdir(TMP_DIR, { recursive: true });
    await writeFile(queryPath, `>query\n${sequence}\n`, "utf-8");

    // Run DIAMOND
    const cmd = [
      "diamond blastp",
      `-d "${dbPath}"`,
      `-q "${queryPath}"`,
      `-o "${outPath}"`,
      "--outfmt 6 qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore qseq sseq",
      "--sensitive",
      "--max-target-seqs 25",
    ].join(" ");

    await execAsync(cmd, { timeout: TIMEOUT_MS });

    // Parse results
    const duration = Math.round((Date.now() - start) / 1000);

    if (!(await fileExists(outPath))) {
      return { status: "no_hits", hits: [], searchDuration: duration };
    }

    const { readFile } = await import("fs/promises");
    const tsv = await readFile(outPath, "utf-8");
    const hits = parseDiamondOutput(tsv);

    if (hits.length === 0) {
      return { status: "no_hits", hits: [], searchDuration: duration };
    }

    return { status: "completed", hits, searchDuration: duration };
  } catch (err) {
    const duration = Math.round((Date.now() - start) / 1000);
    return {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      hits: [],
      searchDuration: duration,
    };
  } finally {
    // Cleanup temp files
    await unlink(queryPath).catch(() => {});
    await unlink(outPath).catch(() => {});
  }
}

export type { DiamondHit, DiamondResult } from "./types";
