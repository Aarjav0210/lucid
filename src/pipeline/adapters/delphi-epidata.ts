import type {
  SourceAdapter,
  FetchResult,
  NormalizedEvent,
} from "./interface.js";
import { fetchWithRetry } from "../utils/retry.js";
import { childLogger } from "../utils/logger.js";
import { hhsRegionName, epiweekToDate, fipsToState } from "../utils/country-codes.js";

const log = childLogger("delphi");

const BASE = "https://api.delphi.cmu.edu/epidata";

interface FluViewRow {
  region: string;
  epiweek: number;
  wili: number;
  ili: number;
  num_ili: number;
  num_patients: number;
  [key: string]: unknown;
}

interface CovidcastRow {
  geo_value: string;
  time_value: number;
  value: number;
  signal: string;
  [key: string]: unknown;
}

interface EpidataResponse<T> {
  result: number;
  epidata: T[];
  message: string;
}

interface RawPayload {
  fluview: FluViewRow[];
  covidcast: CovidcastRow[];
}

function currentEpiweekRange(): { start: number; end: number } {
  const now = new Date();
  const year = now.getFullYear();
  const weekNum = Math.ceil(
    (now.getTime() - new Date(Date.UTC(year, 0, 1)).getTime()) / (7 * 86400000),
  );
  const end = year * 100 + Math.min(weekNum, 52);
  const start = year * 100 + Math.max(1, weekNum - 12);
  return { start, end };
}

export const delphiAdapter: SourceAdapter = {
  source: "delphi_epidata",
  name: "Delphi Epidata (FluView + COVIDcast)",
  temporal: true,

  async fetch(): Promise<RawPayload> {
    log.info("Fetching Delphi Epidata");
    const { start, end } = currentEpiweekRange();
    const apiKey = process.env.DELPHI_API_KEY;
    const authParam = apiKey ? `&auth=${apiKey}` : "";

    const fluviewUrl =
      `${BASE}/fluview/?regions=hhs1,hhs2,hhs3,hhs4,hhs5,hhs6,hhs7,hhs8,hhs9,hhs10` +
      `&epiweeks=${start}-${end}${authParam}`;

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
    const formatDate = (d: Date) =>
      d.toISOString().slice(0, 10).replace(/-/g, "");

    const covidcastUrl =
      `${BASE}/covidcast/?data_source=jhu-csse&signal=confirmed_incidence_num` +
      `&time_type=day&geo_type=state&geo_value=*` +
      `&time_values=${formatDate(thirtyDaysAgo)}-${formatDate(today)}${authParam}`;

    const [fluviewRes, covidcastRes] = await Promise.all([
      fetchWithRetry(fluviewUrl).catch((err) => {
        log.warn({ err }, "FluView fetch failed");
        return null;
      }),
      fetchWithRetry(covidcastUrl).catch((err) => {
        log.warn({ err }, "COVIDcast fetch failed");
        return null;
      }),
    ]);

    let fluview: FluViewRow[] = [];
    let covidcast: CovidcastRow[] = [];

    if (fluviewRes) {
      const body = (await fluviewRes.json()) as EpidataResponse<FluViewRow>;
      if (body.result === 1) fluview = body.epidata;
      else log.warn({ msg: body.message }, "FluView returned non-success");
    }

    if (covidcastRes) {
      const body = (await covidcastRes.json()) as EpidataResponse<CovidcastRow>;
      if (body.result === 1) covidcast = body.epidata;
      else log.warn({ msg: body.message }, "COVIDcast returned non-success");
    }

    return { fluview, covidcast };
  },

  normalize(raw: unknown): FetchResult {
    const { fluview, covidcast } = raw as RawPayload;
    const events: NormalizedEvent[] = [];

    for (const row of fluview) {
      try {
        const regionNum = parseInt(row.region.replace("hhs", ""), 10);
        const iliCount = row.num_ili ?? 0;
        if (iliCount === 0) continue;

        const sourceId = `delphi:fluview:${row.region}:${row.epiweek}`;
        const weekDate = epiweekToDate(row.epiweek);

        events.push({
          source: "delphi_epidata",
          sourceId,
          diseaseName: "Influenza (ILI)",
          pathogenName: "Influenza",
          pathogenType: "virus",
          hostSpeciesCategory: "human",
          status: "active",
          locationName: hhsRegionName(regionNum),
          countryIso: "USA",
          adminRegion: hhsRegionName(regionNum),
          dateReported: weekDate,
          lastReportDate: weekDate,
          caseCount: iliCount,
          sourceUrl: "https://gis.cdc.gov/grasp/fluview/fluportaldashboard.html",
          rawData: { region: row.region, epiweek: row.epiweek, ili: row.ili, num_ili: row.num_ili },
        });
      } catch (err) {
        log.warn({ err, region: row.region }, "Failed to normalize fluview row");
      }
    }

    // Group covidcast by state
    const stateGroups = new Map<string, CovidcastRow[]>();
    for (const row of covidcast) {
      const existing = stateGroups.get(row.geo_value) ?? [];
      existing.push(row);
      stateGroups.set(row.geo_value, existing);
    }

    for (const [fips, rows] of stateGroups) {
      try {
        const stateName = fipsToState(fips) ?? fips;
        const sorted = rows.sort((a, b) => a.time_value - b.time_value);
        const latest = sorted[sorted.length - 1];

        const sourceId = `delphi:covidcast:${fips}:${latest.time_value}`;
        const dateStr = String(latest.time_value);
        const reportDate = new Date(
          `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00Z`,
        );

        events.push({
          source: "delphi_epidata",
          sourceId,
          diseaseName: "COVID-19",
          pathogenName: "SARS-CoV-2",
          pathogenType: "virus",
          hostSpeciesCategory: "human",
          status: "active",
          locationName: stateName,
          countryIso: "USA",
          adminRegion: stateName,
          dateReported: reportDate,
          lastReportDate: reportDate,
          caseCount: Math.round(latest.value),
          sourceUrl: "https://delphi.cmu.edu/covidcast/",
          rawData: { geo_value: fips, latestValue: latest.value },
        });
      } catch (err) {
        log.warn({ err, fips }, "Failed to normalize covidcast state");
      }
    }

    log.info({ events: events.length }, "Normalized Delphi data");
    return { events };
  },
};
