import type { SourceAdapter, FetchResult, NormalizedEvent } from "./interface.js";
import { fetchWithRetry } from "../utils/retry.js";
import { toAlpha3 } from "../utils/country-codes.js";
import { childLogger } from "../utils/logger.js";
import { parse } from "csv-parse/sync";

const log = childLogger("global-health");

const REPOS: {
  disease: string;
  url: string;
  pathogenName: string;
  pathogenType: "virus" | "bacterium";
}[] = [
  {
    disease: "Mpox",
    url: "https://raw.githubusercontent.com/globaldothealth/monkeypox/946edb545947af7f5195459ce52bb71d098e240c/latest_deprecated.csv",
    pathogenName: "Monkeypox virus",
    pathogenType: "virus",
  },
];

interface CsvRow {
  ID?: string;
  Country?: string;
  Country_ISO3?: string;
  Date_confirmation?: string;
  Date_onset?: string;
  Status?: string;
  [key: string]: unknown;
}

interface RawPayload {
  datasets: {
    disease: string;
    pathogenName: string;
    pathogenType: "virus" | "bacterium";
    rows: CsvRow[];
  }[];
}

function aggregateByCaseCountry(
  rows: CsvRow[],
  disease: string,
  pathogenName: string,
  pathogenType: "virus" | "bacterium",
): NormalizedEvent[] {
  const byCountry = new Map<string, { rows: CsvRow[]; iso: string; name: string }>();

  for (const row of rows) {
    const country = row.Country?.trim() ?? "Unknown";
    const iso = row.Country_ISO3?.trim()
      ? toAlpha3(row.Country_ISO3.trim())
      : toAlpha3(country);

    if (!byCountry.has(iso)) {
      byCountry.set(iso, { rows: [], iso, name: country });
    }
    byCountry.get(iso)!.rows.push(row);
  }

  const events: NormalizedEvent[] = [];

  for (const [iso, data] of byCountry) {
    const dates = data.rows
      .map((r) => r.Date_confirmation)
      .filter(Boolean)
      .map((d) => new Date(d!))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    const earliest = dates[0] ?? new Date();
    const latest = dates[dates.length - 1] ?? new Date();

    events.push({
      source: "global_health",
      sourceId: `gh:${disease.toLowerCase()}:${iso}`,
      diseaseName: disease,
      pathogenName,
      pathogenType,
      hostSpeciesCategory: "human",
      status: "active",
      locationName: data.name,
      countryIso: iso,
      dateReported: earliest,
      lastReportDate: latest,
      caseCount: data.rows.length,
      deathCount: data.rows.filter((r) => r.Status === "dead").length || null,
      sourceUrl: "https://github.com/globaldothealth",
      rawData: {
        totalRows: data.rows.length,
        dateRange: { from: earliest.toISOString(), to: latest.toISOString() },
      },
    });
  }

  return events;
}

export const globalHealthAdapter: SourceAdapter = {
  source: "global_health",
  name: "Global.health Line Lists",

  async fetch(): Promise<RawPayload> {
    log.info("Fetching Global.health CSV datasets");
    const datasets: RawPayload["datasets"] = [];

    for (const repo of REPOS) {
      try {
        const res = await fetchWithRetry(repo.url);
        const text = await res.text();
        const rows = parse(text, {
          columns: true,
          skip_empty_lines: true,
          relax_column_count: true,
        }) as CsvRow[];

        datasets.push({
          disease: repo.disease,
          pathogenName: repo.pathogenName,
          pathogenType: repo.pathogenType,
          rows,
        });

        log.info({ disease: repo.disease, rows: rows.length }, "Fetched CSV");
      } catch (err) {
        log.warn({ err, disease: repo.disease }, "Failed to fetch Global.health dataset");
      }
    }

    return { datasets };
  },

  normalize(raw: unknown): FetchResult {
    const { datasets } = raw as RawPayload;
    const events: NormalizedEvent[] = [];

    for (const ds of datasets) {
      try {
        const aggregated = aggregateByCaseCountry(
          ds.rows,
          ds.disease,
          ds.pathogenName,
          ds.pathogenType,
        );
        events.push(...aggregated);
      } catch (err) {
        log.warn({ err, disease: ds.disease }, "Failed to normalize Global.health dataset");
      }
    }

    log.info({ count: events.length }, "Normalized Global.health events");
    return { events };
  },
};
