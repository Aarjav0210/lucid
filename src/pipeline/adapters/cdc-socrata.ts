import type { SourceAdapter, FetchResult, NormalizedEvent } from "./interface.js";
import { fetchWithRetry } from "../utils/retry.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("cdc-socrata");

const BASE = "https://data.cdc.gov/resource";

const NNDSS_DATASET = "x9gk-5huc";
const NORS_DATASET = "5xkq-dg7x";

const PAGE_SIZE = 1000;

interface NNDSSRow {
  states?: string;
  year?: string;
  week?: string;
  label?: string;
  /** Current week case count */
  m1?: string;
  m1_flag?: string;
  /** Cumulative YTD */
  m2?: string;
  m2_flag?: string;
  location1?: string;
  location2?: string;
  sort_order?: string;
  geocode?: { type: string; coordinates: [number, number] };
  [key: string]: unknown;
}

interface NORSRow {
  year?: string;
  month?: string;
  state?: string;
  etiology?: string;
  etiology_status?: string;
  illnesses?: string;
  deaths?: string;
  primary_mode?: string;
  setting?: string;
  [key: string]: unknown;
}

interface RawPayload {
  nndss: NNDSSRow[];
  nors: NORSRow[];
}

async function fetchPaginated<T>(
  datasetId: string,
  params: Record<string, string>,
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  const appToken = process.env.CDC_SOCRATA_APP_TOKEN;
  const headers: Record<string, string> = {};
  if (appToken) headers["X-App-Token"] = appToken;

  while (true) {
    const url = new URL(`${BASE}/${datasetId}.json`);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    url.searchParams.set("$limit", String(PAGE_SIZE));
    url.searchParams.set("$offset", String(offset));

    const res = await fetchWithRetry(url.toString(), { headers });
    const page = (await res.json()) as T[];
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

export const cdcSocrataAdapter: SourceAdapter = {
  source: "cdc_socrata",
  name: "CDC Socrata (NNDSS + NORS)",

  async fetch(): Promise<RawPayload> {
    log.info("Fetching CDC Socrata data");

    const currentYear = new Date().getFullYear();

    const [nndss, nors] = await Promise.all([
      fetchPaginated<NNDSSRow>(NNDSS_DATASET, {
        "$where": `year = '${currentYear}' AND m1 IS NOT NULL`,
        "$order": "year DESC, week DESC",
      }).catch((err) => {
        log.warn({ err }, "NNDSS fetch failed");
        return [] as NNDSSRow[];
      }),
      fetchPaginated<NORSRow>(NORS_DATASET, {
        "$order": "year DESC",
      }).catch((err) => {
        log.warn({ err }, "NORS fetch failed");
        return [] as NORSRow[];
      }),
    ]);

    return { nndss, nors };
  },

  normalize(raw: unknown): FetchResult {
    const { nndss, nors } = raw as RawPayload;
    const events: NormalizedEvent[] = [];

    for (const row of nndss) {
      try {
        const disease = row.label?.trim();
        const area = row.states?.trim();
        if (!disease || !area) continue;

        // Skip aggregate region rows, keep states and national
        const isState = row.location1 || area === "U.S. Residents" || area === "US RESIDENTS";
        if (!isState && !row.geocode) continue;

        const year = parseInt(row.year ?? "2024", 10);
        const week = parseInt(row.week ?? "1", 10);
        const jan1 = new Date(Date.UTC(year, 0, 1));
        const reportDate = new Date(jan1.getTime() + (week - 1) * 7 * 86400000);

        const currentWeekCases = row.m1 ? parseFloat(row.m1) : null;
        const cases = currentWeekCases != null && !isNaN(currentWeekCases)
          ? Math.round(currentWeekCases)
          : null;

        const locationName = row.location1 ?? area;
        const isNational = area === "U.S. Residents" || area === "US RESIDENTS";
        const sourceId = `cdc_nndss:${disease}:${locationName}:${year}w${week}`;

        let lat: number | null = null;
        let lng: number | null = null;
        if (row.geocode?.coordinates) {
          [lng, lat] = row.geocode.coordinates;
        }

        events.push({
          source: "cdc_socrata",
          sourceId,
          diseaseName: disease,
          pathogenType: null,
          hostSpeciesCategory: "human",
          status: "active",
          locationName: isNational ? "United States" : locationName,
          countryIso: "USA",
          adminRegion: isNational ? null : locationName,
          latitude: lat,
          longitude: lng,
          dateReported: reportDate,
          lastReportDate: reportDate,
          caseCount: cases,
          deathCount: null,
          sourceUrl: `https://data.cdc.gov/resource/${NNDSS_DATASET}`,
          rawData: row,
        });
      } catch (err) {
        log.warn({ err, sortOrder: row.sort_order }, "Failed to normalize NNDSS row");
      }
    }

    for (const row of nors) {
      try {
        const etiology = row.etiology?.trim() ?? "Unknown etiology";
        const state = row.state?.trim() ?? "Unknown";
        const year = row.year ?? "2024";
        const month = row.month ?? "1";

        const sourceId = `cdc_nors:${etiology}:${state}:${year}-${month}`;
        const reportDate = new Date(`${year}-${month.padStart(2, "0")}-01T00:00:00Z`);

        events.push({
          source: "cdc_socrata",
          sourceId,
          diseaseName: `Foodborne: ${etiology}`,
          pathogenType: null,
          hostSpeciesCategory: "human",
          status: "active",
          locationName: state,
          countryIso: "USA",
          adminRegion: state,
          dateReported: reportDate,
          lastReportDate: reportDate,
          caseCount: row.illnesses ? parseInt(row.illnesses, 10) || null : null,
          deathCount: row.deaths ? parseInt(row.deaths, 10) || null : null,
          sourceUrl: `https://data.cdc.gov/resource/${NORS_DATASET}`,
          rawData: row,
        });
      } catch (err) {
        log.warn({ err }, "Failed to normalize NORS row");
      }
    }

    log.info({ count: events.length }, "Normalized CDC Socrata events");
    return { events };
  },
};
