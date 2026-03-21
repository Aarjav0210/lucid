import { unzipSync } from "fflate";
import { lookupAccession, searchCatalogByKeywords, type ThreatEntry } from "./threat-catalog";

// ── Types ──────────────────────────────────────────────────────────────

export type MatchTier = "exact" | "high" | "moderate" | "low";

export interface BlastHit {
  accession: string;
  title: string;
  organism: string;
  identity: number;    // percentage 0-100
  coverage: number;    // query coverage percentage 0-100
  evalue: number;
  bitScore: number;
  matchTier: MatchTier;
  threatMatch: ThreatEntry | null;
}

export interface BlastResult {
  status: "completed" | "no_hits" | "error" | "timeout";
  error?: string;
  searchDuration: number;  // seconds
  program: string;
  database: string;
  hits: BlastHit[];
  riskSignal: "HIGH" | "MEDIUM" | "LOW" | "INCONCLUSIVE";
  summary: string;
}

// ── Constants ──────────────────────────────────────────────────────────

const BLAST_BASE = "https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi";
const POLL_INTERVAL_MS = 15_000;
const MAX_WAIT_MS = 180_000; // 3 minutes
const MAX_HITS = 10;

// ── Tier classification ────────────────────────────────────────────────

export function classifyMatchTier(
  identity: number,
  coverage: number,
  evalue: number
): MatchTier {
  if (evalue > 0.01) return "low";
  if (identity >= 95 && coverage >= 90) return "exact";
  if (identity >= 80 && coverage >= 70) return "high";
  if (identity >= 60 && coverage >= 50) return "moderate";
  return "low";
}

// ── Risk signal from hits ──────────────────────────────────────────────

function computeRiskSignal(hits: BlastHit[]): "HIGH" | "MEDIUM" | "LOW" | "INCONCLUSIVE" {
  let maxRisk: "HIGH" | "MEDIUM" | "LOW" | "INCONCLUSIVE" = "INCONCLUSIVE";

  for (const hit of hits) {
    if (hit.matchTier === "low") continue;

    if (hit.threatMatch) {
      const cat = hit.threatMatch.category;
      if (cat === "select_agent" || cat === "toxin") {
        return "HIGH"; // immediate — no need to check further
      }
      if (cat === "dual_use" || cat === "gain_of_function") {
        if (hit.matchTier === "exact" || hit.matchTier === "high") {
          maxRisk = maxRisk === "HIGH" ? "HIGH" : "MEDIUM";
        } else {
          // moderate match to dual-use: at least MEDIUM
          if (maxRisk === "INCONCLUSIVE" || maxRisk === "LOW") maxRisk = "MEDIUM";
        }
      }
    } else {
      // No catalog match — check keywords in title for known threat organisms/genes
      const keywordMatches = searchCatalogByKeywords(hit.title);
      if (keywordMatches.length > 0) {
        const bestCat = keywordMatches[0].category;
        if (bestCat === "select_agent" || bestCat === "toxin") {
          if (hit.matchTier === "exact" || hit.matchTier === "high") return "HIGH";
          if (maxRisk !== "HIGH") maxRisk = "MEDIUM";
        } else {
          if (maxRisk === "INCONCLUSIVE" || maxRisk === "LOW") maxRisk = "MEDIUM";
        }
      } else {
        // Benign or unrecognized hit
        if (hit.matchTier === "exact" || hit.matchTier === "high") {
          if (maxRisk === "INCONCLUSIVE") maxRisk = "LOW";
        }
      }
    }
  }

  return maxRisk;
}

// ── NCBI BLAST submission ──────────────────────────────────────────────

async function submitBlast(
  sequence: string,
  program: "blastn" | "blastp",
  database: string
): Promise<{ rid: string; rtoe: number }> {
  const params = new URLSearchParams({
    CMD: "Put",
    PROGRAM: program,
    DATABASE: database,
    QUERY: sequence,
    FORMAT_TYPE: "JSON2",
    HITLIST_SIZE: String(MAX_HITS),
    MEGABLAST: program === "blastn" ? "on" : "",
  });

  const res = await fetch(BLAST_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const text = await res.text();

  const ridMatch = text.match(/RID = (\S+)/);
  const rtoeMatch = text.match(/RTOE = (\d+)/);

  if (!ridMatch) {
    throw new Error(`BLAST submission failed — could not parse RID. Response: ${text.slice(0, 300)}`);
  }

  return {
    rid: ridMatch[1],
    rtoe: rtoeMatch ? parseInt(rtoeMatch[1], 10) : 15,
  };
}

// ── BLAST polling ──────────────────────────────────────────────────────

async function pollBlastStatus(rid: string): Promise<"WAITING" | "READY" | "FAILED" | "UNKNOWN"> {
  const url = `${BLAST_BASE}?CMD=Get&RID=${rid}&FORMAT_OBJECT=SearchInfo`;
  const res = await fetch(url);
  const text = await res.text();

  if (text.includes("Status=READY")) return "READY";
  if (text.includes("Status=FAILED")) return "FAILED";
  if (text.includes("Status=UNKNOWN")) return "UNKNOWN";
  return "WAITING";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── BLAST result retrieval ─────────────────────────────────────────────

interface BlastJson2Hsp {
  identity: number;
  align_len: number;
  query_from: number;
  query_to: number;
  bit_score: number;
  evalue: number;
}

interface BlastJson2Hit {
  description: Array<{ title: string; accession: string; sciname?: string }>;
  hsps: BlastJson2Hsp[];
}

async function getBlastResults(rid: string): Promise<BlastJson2Hit[]> {
  const url = `${BLAST_BASE}?CMD=Get&RID=${rid}&FORMAT_TYPE=JSON2`;
  const res = await fetch(url);

  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);

  let json: Record<string, unknown>;

  // ZIP files start with "PK" (0x50 0x4B) — NCBI sometimes returns a
  // compressed archive instead of plain JSON.
  if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
    console.log("BLAST returned ZIP archive — decompressing");
    try {
      const unzipped = unzipSync(bytes);
      const fileNames = Object.keys(unzipped);
      const jsonFile = fileNames.find((f) => f.endsWith(".json")) ?? fileNames[0];
      if (!jsonFile || !unzipped[jsonFile]) {
        console.warn("ZIP archive contained no files");
        return [];
      }
      const text = new TextDecoder().decode(unzipped[jsonFile]);
      json = JSON.parse(text);
    } catch (err) {
      console.error("Failed to decompress/parse ZIP from BLAST:", err);
      return [];
    }
  } else {
    try {
      const text = new TextDecoder().decode(bytes);
      json = JSON.parse(text);
    } catch {
      console.error("Failed to parse BLAST JSON response:", new TextDecoder().decode(bytes.slice(0, 200)));
      return [];
    }
  }

  // Navigate the JSON structure — NCBI uses different schemas:
  //   JSON2 (plain):  { BlastOutput2: [{ report: { results: { search: { hits } } } }] }
  //   JSON  (in ZIP):  { BlastJSON: [{ report: { results: { search: { hits } } } }] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root = json as any;
  const container = root.BlastOutput2 ?? root.BlastJSON;

  if (!container) {
    console.warn("BLAST JSON has unrecognized structure. Top-level keys:", Object.keys(json));
    return [];
  }

  // Container can be an array (common) or an object
  const reportWrapper = Array.isArray(container) ? container[0] : container;
  const report = reportWrapper?.report;

  if (!report) {
    // Some structures nest directly: container.results.search.hits
    const search = reportWrapper?.results?.search;
    if (search?.hits) return search.hits as BlastJson2Hit[];
    return [];
  }

  const hits = report?.results?.search?.hits;
  return (hits as BlastJson2Hit[]) ?? [];
}

// ── Parse hits into our typed format ───────────────────────────────────

function parseHits(rawHits: BlastJson2Hit[], queryLength: number): BlastHit[] {
  return rawHits.slice(0, MAX_HITS).map((hit) => {
    const desc = hit.description?.[0] ?? { title: "Unknown", accession: "N/A" };
    const bestHsp = hit.hsps?.[0];

    const alignLen = bestHsp?.align_len ?? 0;
    const identityCount = bestHsp?.identity ?? 0;
    const identity = alignLen > 0 ? (identityCount / alignLen) * 100 : 0;
    const coverage =
      queryLength > 0 && bestHsp
        ? ((Math.abs(bestHsp.query_to - bestHsp.query_from) + 1) / queryLength) * 100
        : 0;
    const evalue = bestHsp?.evalue ?? 999;
    const bitScore = bestHsp?.bit_score ?? 0;

    const matchTier = classifyMatchTier(identity, coverage, evalue);

    // Cross-reference threat catalog by accession
    let threatMatch = lookupAccession(desc.accession) ?? null;

    // If no direct accession match, try keyword search on the title
    if (!threatMatch) {
      const keywordHits = searchCatalogByKeywords(desc.title);
      if (keywordHits.length > 0) threatMatch = keywordHits[0];
    }

    return {
      accession: desc.accession,
      title: desc.title,
      organism: desc.sciname ?? "",
      identity: Math.round(identity * 10) / 10,
      coverage: Math.round(coverage * 10) / 10,
      evalue,
      bitScore: Math.round(bitScore),
      matchTier,
      threatMatch,
    };
  });
}

// ── Main entry point ───────────────────────────────────────────────────

export async function runBlastSearch(
  sequence: string,
  sequenceType: "nucleotide" | "protein"
): Promise<BlastResult> {
  const startTime = Date.now();
  const program = sequenceType === "nucleotide" ? "blastn" : "blastp";
  const database = sequenceType === "nucleotide" ? "nt" : "nr";

  try {
    // 1. Submit
    const { rid, rtoe } = await submitBlast(sequence, program, database);

    // 2. Wait initial RTOE
    const initialWait = Math.max(rtoe * 1000, 11_000);
    await sleep(Math.min(initialWait, MAX_WAIT_MS));

    // 3. Poll until ready
    let status: Awaited<ReturnType<typeof pollBlastStatus>> = "WAITING";
    const deadline = startTime + MAX_WAIT_MS;

    while (status === "WAITING" && Date.now() < deadline) {
      status = await pollBlastStatus(rid);
      if (status === "WAITING") {
        await sleep(POLL_INTERVAL_MS);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    if (status === "FAILED" || status === "UNKNOWN") {
      return {
        status: "error",
        error: `BLAST search ${status.toLowerCase()} for RID ${rid}`,
        searchDuration: duration,
        program,
        database,
        hits: [],
        riskSignal: "INCONCLUSIVE",
        summary: `BLAST search returned status: ${status}`,
      };
    }

    if (status === "WAITING") {
      return {
        status: "timeout",
        error: `BLAST search timed out after ${duration}s`,
        searchDuration: duration,
        program,
        database,
        hits: [],
        riskSignal: "INCONCLUSIVE",
        summary: `BLAST search timed out after ${duration} seconds. Manual review recommended.`,
      };
    }

    // 4. Retrieve results
    const rawHits = await getBlastResults(rid);
    const queryLength = sequence.replace(/[^A-Za-z]/g, "").length;
    const hits = parseHits(rawHits, queryLength);

    if (hits.length === 0) {
      return {
        status: "no_hits",
        searchDuration: duration,
        program,
        database,
        hits: [],
        riskSignal: "INCONCLUSIVE",
        summary: "BLAST search completed but returned no significant hits.",
      };
    }

    const riskSignal = computeRiskSignal(hits);

    const topHit = hits[0];
    const summary = `Top hit: ${topHit.title} (${topHit.identity}% identity, ${topHit.coverage}% coverage, e-value ${topHit.evalue}). ${hits.length} total hit(s). Risk signal: ${riskSignal}.`;

    return {
      status: "completed",
      searchDuration: duration,
      program,
      database,
      hits,
      riskSignal,
      summary,
    };
  } catch (err) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    return {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      searchDuration: duration,
      program,
      database,
      hits: [],
      riskSignal: "INCONCLUSIVE",
      summary: `BLAST search failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
