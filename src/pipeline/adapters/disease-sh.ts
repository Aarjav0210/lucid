import type {
  SourceAdapter,
  FetchResult,
  NormalizedEvent,
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

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export const diseaseShAdapter: SourceAdapter = {
  source: "disease_sh",
  name: "disease.sh COVID-19",
  temporal: true,

  async fetch(): Promise<RawPayload> {
    log.info("Fetching disease.sh data");
    const [countriesRes, historicalRes] = await Promise.all([
      fetchWithRetry(`${BASE}/countries?sort=cases`),
      fetchWithRetry(`${BASE}/historical?lastdays=all`).catch((err) => {
        log.warn({ err }, "Historical endpoint failed");
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

    const countryInfo = new Map(
      countries
        .filter((c) => c.countryInfo?.iso3)
        .map((c) => [
          c.country.toLowerCase(),
          { iso3: c.countryInfo.iso3, lat: c.countryInfo.lat, lng: c.countryInfo.long },
        ]),
    );

    for (const h of historical) {
      try {
        const info = countryInfo.get(h.country.toLowerCase());
        if (!info) continue;

        const caseDates = Object.entries(h.timeline.cases);
        const deathMap = new Map(Object.entries(h.timeline.deaths));

        let prevCases = 0;
        let prevDeaths = 0;

        for (const [dateStr, cumCases] of caseDates) {
          const cumDeaths = parseInt(String(deathMap.get(dateStr) ?? "0"), 10);
          const newCases = Math.max(0, cumCases - prevCases);
          const newDeaths = Math.max(0, cumDeaths - prevDeaths);

          prevCases = cumCases;
          prevDeaths = cumDeaths;

          if (newCases === 0) continue;

          const date = new Date(dateStr);
          const dateKey = formatDate(date);

          events.push({
            source: "disease_sh",
            sourceId: `disease_sh:covid19:${info.iso3}:${dateKey}`,
            diseaseName: "COVID-19",
            pathogenName: "SARS-CoV-2",
            pathogenType: "virus",
            hostSpeciesCategory: "human",
            status: "active",
            locationName: h.country,
            countryIso: info.iso3,
            latitude: info.lat,
            longitude: info.lng,
            dateReported: date,
            lastReportDate: date,
            caseCount: newCases,
            deathCount: newDeaths || null,
            recoveredCount: null,
            sourceUrl: "https://disease.sh",
            rawData: { cumCases, cumDeaths, newCases, newDeaths, date: dateKey },
          });
        }
      } catch (err) {
        log.warn({ err, country: h.country }, "Failed to normalize disease.sh history");
      }
    }

    log.info({ events: events.length }, "Normalized disease.sh events");
    return { events };
  },
};
