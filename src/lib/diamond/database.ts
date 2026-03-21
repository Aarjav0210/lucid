import { exec } from "child_process";
import { mkdir, writeFile, readFile, access, unlink } from "fs/promises";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

const DB_DIR = path.resolve(process.cwd(), "data", "diamond");
const FASTA_PATH = path.join(DB_DIR, "curated_toxins.fasta");
const DB_PATH = path.join(DB_DIR, "curated_toxins"); // .dmnd appended by diamond
const CATALOG_PATH = path.resolve(
  __dirname,
  "curated-sequences.json"
);

const UNIPROT_BASE = "https://rest.uniprot.org/uniprotkb";

export type SeedEntry = {
  id: string;
  name: string;
  category: string;
};

async function loadCatalog(): Promise<SeedEntry[]> {
  const raw = await readFile(CATALOG_PATH, "utf-8");
  return JSON.parse(raw) as SeedEntry[];
}

async function fetchFasta(uniprotId: string): Promise<string> {
  const res = await fetch(`${UNIPROT_BASE}/${uniprotId}.fasta`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${uniprotId}: ${res.status}`);
  }
  return res.text();
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
 * Build the curated DIAMOND database.
 * Reads curated-sequences.json, downloads from UniProt, runs `diamond makedb`.
 * Pass force=true to rebuild even if the .dmnd file already exists.
 */
export async function buildCuratedDatabase(
  force = false
): Promise<void> {
  await mkdir(DB_DIR, { recursive: true });

  if (!force && (await fileExists(`${DB_PATH}.dmnd`))) {
    console.log("[diamond] Database already exists, skipping build (use --force to rebuild)");
    return;
  }

  const catalog = await loadCatalog();
  console.log(`[diamond] Building database from ${catalog.length} sequences...`);

  const fastaEntries: string[] = [];

  for (const seed of catalog) {
    try {
      const fasta = await fetchFasta(seed.id);
      fastaEntries.push(fasta.trim());
      console.log(`[diamond]   ✓ ${seed.id} — ${seed.name} (${seed.category})`);
    } catch (err) {
      throw new Error(
        `Failed to download ${seed.id} (${seed.name}): ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  await writeFile(FASTA_PATH, fastaEntries.join("\n"), "utf-8");

  // Remove old .dmnd if rebuilding
  if (await fileExists(`${DB_PATH}.dmnd`)) {
    await unlink(`${DB_PATH}.dmnd`);
  }

  await execAsync(`diamond makedb --in "${FASTA_PATH}" -d "${DB_PATH}"`, {
    timeout: 30_000,
  });

  console.log(`[diamond] Database built: ${catalog.length} sequences`);
}

export function getDatabasePath(): string {
  return `${DB_PATH}.dmnd`;
}
