import type {
  SourceAdapter,
  FetchResult,
  NormalizedEvent,
  TimeSeriesEntry,
} from "./interface.js";
import { fetchWithRetry } from "../utils/retry.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("disease-sh");

const BASE = "https://disease.sh/v3/covid-19";

interface CountryData {
  country: string;
  countryInfo: {
    iso3: string;
    lat: number;
    long: number;
  };
  cases: number;
  todayCases: number;
  deaths: number;
  todayDeaths: number;
  recovered: number;
  active: number;
  updated: number;
}

interface HistoricalCountry {
  country: string;
  timeline: {
    cases: Record<string, number>;
    deaths: Record<string, number>;
  };
}

interface RawPayload {
  countries: CountryData[];
  historical: HistoricalCountry[];
}

export const diseaseShAdapter: SourceAdapter = {
  source: "disease_sh",
  name: "disease.sh COVID-19",

  async fetch(): Promise<RawPayload> {
    log.info("Fetching disease.sh data");
    const [countriesRes, historicalRes] = await Promise.all([
      fetchWithRetry(`${BASE}/countries?sort=cases`),
      fetchWithRetry(`${BASE}/historical?lastdays=30`).catch((err) => {
        log.warn({ err }, "Historical endpoint failed, continuing without time series");
        return null;
      }),
    ]);

    const countries = (await countriesRes.json()) as CountryData[];
    let historical: HistoricalCountry[] = [];
    if (historicalRes) {
      historical = (await historicalRes.json()) as HistoricalCountry[];
    }

    return { countries, historical };
  },

  normalize(raw: unknown): FetchResult {
    const { countries, historical } = raw as RawPayload;
    const events: NormalizedEvent[] = [];
    const timeSeries: TimeSeriesEntry[] = [];

    // Build a lookup: iso3 → last date with new cases from historical data.
    // This gives us a real "last report date" instead of the API refresh timestamp.
    const isoLookup = new Map(
      countries.map((c) => [c.country.toLowerCase(), c.countryInfo?.iso3]),
    );

    const lastActiveDateByIso = new Map<string, Date>();

    for (const h of historical) {
      try {
        const iso3 = isoLookup.get(h.country.toLowerCase());
        if (!iso3) continue;

        const sourceId = `disease_sh:covid19:${iso3}`;
        const caseDates = Object.entries(h.timeline.cases);
        const deathDates = Object.entries(h.timeline.deaths);
        const deathMap = new Map(deathDates);

        let prevCases = 0;
        let prevDeaths = 0;

        for (const [dateStr, cumCases] of caseDates) {
          const cumDeaths = parseInt(String(deathMap.get(dateStr) ?? "0"), 10);
          const newCases = Math.max(0, cumCases - prevCases);
          const newDeaths = Math.max(0, cumDeaths - prevDeaths);

          timeSeries.push({
            sourceId,
            date: new Date(dateStr),
            cumulativeCases: cumCases,
            cumulativeDeaths: cumDeaths,
            newCases,
            newDeaths,
          });

          if (newCases > 0) {
            lastActiveDateByIso.set(iso3, new Date(dateStr));
          }

          prevCases = cumCases;
          prevDeaths = cumDeaths;
        }
      } catch (err) {
        log.warn({ err, country: h.country }, "Failed to normalize disease.sh history");
      }
    }

    for (const c of countries) {
      try {
        const iso3 = c.countryInfo?.iso3;
        if (!iso3) continue;

        const sourceId = `disease_sh:covid19:${iso3}`;

        // Use historical data to find the true last report date;
        // fall back to the API timestamp only if history is unavailable
        const lastActiveDate = lastActiveDateByIso.get(iso3);
        const lastReportDate = lastActiveDate ?? new Date(c.updated);

        const hasRecentCases = c.todayCases > 0;
        const status = hasRecentCases ? "active" : "resolved";

        events.push({
          source: "disease_sh",
          sourceId,
          diseaseName: "COVID-19",
          pathogenName: "SARS-CoV-2",
          pathogenType: "virus",
          hostSpeciesCategory: "human",
          status: status as "active" | "resolved",
          locationName: c.country,
          countryIso: iso3,
          latitude: c.countryInfo.lat,
          longitude: c.countryInfo.long,
          dateReported: new Date(c.updated),
          lastReportDate,
          caseCount: c.todayCases,
          deathCount: c.todayDeaths,
          recoveredCount: c.recovered,
          sourceUrl: "https://disease.sh",
          rawData: c,
        });
      } catch (err) {
        log.warn({ err, country: c.country }, "Failed to normalize disease.sh country");
      }
    }

    log.info(
      { events: events.length, timeSeries: timeSeries.length },
      "Normalized disease.sh data",
    );
    return { events, timeSeries };
  },
};
