import { extractDomains, summarizeDomains, type ExtractedDomain, type InterProHit } from "./extract-domains";

// ── Types ──────────────────────────────────────────────────────────────

export interface InterProDomain {
  accession: string;       // InterPro entry ID, e.g. "IPR000001"
  name: string;            // e.g. "Kringle"
  type: string;            // DOMAIN, FAMILY, REPEAT, HOMOLOGOUS_SUPERFAMILY, etc.
  database: string;        // Source DB: Pfam, SMART, CDD, etc.
  start: number;           // 1-based start position in the query sequence
  end: number;             // 1-based end position in the query sequence
  evalue: number | null;
  score: number | null;
}

export interface InterProResult {
  status: "completed" | "no_domains" | "error" | "timeout";
  error?: string;
  searchDuration: number;  // seconds
  domains: InterProDomain[];
  slices: DomainSlice[];
  /** Non-overlapping domain segments for downstream tools (ESMFold, BLAST) */
  extractedDomains: ExtractedDomain[];
}

export interface DomainSlice {
  domain: InterProDomain;
  sequence: string;        // subsequence extracted from original
}

export type { ExtractedDomain } from "./extract-domains";

// ── Constants ──────────────────────────────────────────────────────────

const INTERPRO_BASE = "https://www.ebi.ac.uk/Tools/services/rest/iprscan5";
const POLL_INTERVAL_MS = 10_000;
const MAX_WAIT_MS = 300_000; // 5 minutes
const EMAIL = process.env.INTERPRO_EMAIL ?? "pane-screening@example.com";

// ── Helpers ────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Job submission ─────────────────────────────────────────────────────

async function submitInterPro(sequence: string): Promise<string> {
  const params = new URLSearchParams({
    sequence,
    stype: "p",
    email: EMAIL,
    goterms: "false",
    pathways: "false",
  });

  const res = await fetch(`${INTERPRO_BASE}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`InterPro submission failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const jobId = (await res.text()).trim();
  if (!jobId) {
    throw new Error("InterPro submission returned empty job ID");
  }

  return jobId;
}

// ── Status polling ─────────────────────────────────────────────────────

type InterProStatus = "QUEUED" | "RUNNING" | "FINISHED" | "ERROR" | "FAILURE" | "NOT_FOUND";

async function pollInterProStatus(jobId: string): Promise<InterProStatus> {
  const res = await fetch(`${INTERPRO_BASE}/status/${jobId}`);
  const text = (await res.text()).trim();

  const valid: InterProStatus[] = ["QUEUED", "RUNNING", "FINISHED", "ERROR", "FAILURE", "NOT_FOUND"];
  return valid.includes(text as InterProStatus) ? (text as InterProStatus) : "ERROR";
}

// ── Result retrieval ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getInterProResults(jobId: string): Promise<any> {
  const res = await fetch(`${INTERPRO_BASE}/result/${jobId}/json`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`InterPro result retrieval failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json();
}

// ── Result parsing ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseInterProResults(json: any, sequence: string): { domains: InterProDomain[]; slices: DomainSlice[]; extractedDomains: ExtractedDomain[] } {
  const results = json?.results ?? [];
  if (results.length === 0) return { domains: [], slices: [], extractedDomains: [] };

  const matches = results[0]?.matches ?? [];
  const rawDomains: InterProDomain[] = [];

  for (const match of matches) {
    const entry = match.signature?.entry;
    // Skip matches with no InterPro entry (unintegrated signatures)
    if (!entry) continue;

    const locations = match.locations ?? [];
    for (const loc of locations) {
      rawDomains.push({
        accession: entry.accession ?? match.signature?.accession ?? "unknown",
        name: entry.name ?? entry.description ?? match.signature?.name ?? "unknown",
        type: entry.type ?? "UNKNOWN",
        database: match.signature?.signatureLibraryRelease?.library ?? "unknown",
        start: loc.start ?? 0,
        end: loc.end ?? 0,
        evalue: loc.evalue ?? null,
        score: loc.score ?? null,
      });
    }
  }

  // Deduplicate: when multiple signatures map to the same InterPro entry
  // at overlapping positions, keep the one with the best (lowest) e-value.
  const deduped = deduplicateDomains(rawDomains);

  // Sort by start position
  deduped.sort((a, b) => a.start - b.start);

  // Extract subsequences (1-based positions → 0-based slice)
  const slices: DomainSlice[] = deduped.map((domain) => ({
    domain,
    sequence: sequence.slice(domain.start - 1, domain.end),
  }));

  // Build non-overlapping domain segments for downstream tools
  const interproHits: InterProHit[] = deduped.map((d) => ({
    signature: d.accession,
    start: d.start,
    end: d.end,
    description: d.name,
    type: d.type,
  }));
  const extracted = extractDomains(sequence, interproHits);
  console.log(summarizeDomains(extracted));

  return { domains: deduped, slices, extractedDomains: extracted };
}

function deduplicateDomains(domains: InterProDomain[]): InterProDomain[] {
  const seen = new Map<string, InterProDomain>();

  for (const d of domains) {
    const key = `${d.accession}:${d.start}-${d.end}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, d);
    } else {
      // Keep the one with better (lower) e-value
      if (d.evalue !== null && (existing.evalue === null || d.evalue < existing.evalue)) {
        seen.set(key, d);
      }
    }
  }

  // Also deduplicate overlapping domains with the same accession
  // (different positions from different signatures)
  const byAccession = new Map<string, InterProDomain[]>();
  for (const d of seen.values()) {
    const list = byAccession.get(d.accession) ?? [];
    list.push(d);
    byAccession.set(d.accession, list);
  }

  const result: InterProDomain[] = [];
  for (const list of byAccession.values()) {
    // Remove domains that are fully contained within another domain of the same accession
    const filtered = list.filter((d, i) =>
      !list.some((other, j) =>
        i !== j && other.start <= d.start && other.end >= d.end && (other.end - other.start) > (d.end - d.start)
      )
    );
    result.push(...filtered);
  }

  return result;
}

// ── Main entry point ───────────────────────────────────────────────────

export async function runInterProScan(sequence: string): Promise<InterProResult> {
  const startTime = Date.now();

  try {
    // 1. Submit
    console.log("InterPro: submitting sequence for domain scan...");
    const jobId = await submitInterPro(sequence);
    console.log(`InterPro: job submitted — ${jobId}`);

    // 2. Poll until finished
    let status: InterProStatus = "QUEUED";
    const deadline = startTime + MAX_WAIT_MS;

    // Initial wait before first poll
    await sleep(5_000);

    while ((status === "QUEUED" || status === "RUNNING") && Date.now() < deadline) {
      status = await pollInterProStatus(jobId);
      console.log(`InterPro: status — ${status}`);

      if (status === "QUEUED" || status === "RUNNING") {
        await sleep(POLL_INTERVAL_MS);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    if (status === "ERROR" || status === "FAILURE" || status === "NOT_FOUND") {
      return {
        status: "error",
        error: `InterPro scan ${status.toLowerCase()} for job ${jobId}`,
        searchDuration: duration,
        domains: [],
        slices: [],
        extractedDomains: [],
      };
    }

    if (status !== "FINISHED") {
      return {
        status: "timeout",
        error: `InterPro scan timed out after ${duration}s`,
        searchDuration: duration,
        domains: [],
        slices: [],
        extractedDomains: [],
      };
    }

    // 3. Retrieve and parse results
    const json = await getInterProResults(jobId);
    const { domains, slices, extractedDomains } = parseInterProResults(json, sequence);

    console.log(`InterPro: found ${domains.length} domain(s) in ${duration}s`);

    if (domains.length === 0) {
      return {
        status: "no_domains",
        searchDuration: duration,
        domains: [],
        slices: [],
        extractedDomains: [],
      };
    }

    return {
      status: "completed",
      searchDuration: duration,
      domains,
      slices,
      extractedDomains,
    };
  } catch (err) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.error("InterPro scan failed:", err);
    return {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      searchDuration: duration,
      domains: [],
      slices: [],
      extractedDomains: [],
    };
  }
}
