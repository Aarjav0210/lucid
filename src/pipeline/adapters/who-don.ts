import type { SourceAdapter, FetchResult, NormalizedEvent } from "./interface.js";
import { fetchWithRetry } from "../utils/retry.js";
import { toAlpha3 } from "../utils/country-codes.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("who-don");

const BASE_URL = "https://www.who.int/api/news/diseaseoutbreaknews";

interface WHOItem {
  Id: string;
  Title: string;
  PublicationDate: string;
  Summary: string;
  Url?: string;
  Regions?: { Name: string }[];
  DiseaseIds?: { UniqueId: string; Value: string }[];
  CountryTags?: { Name: string; IsoCode?: string }[];
}

interface WHOResponse {
  value: WHOItem[];
}

function extractDiseaseName(item: WHOItem): string {
  if (item.DiseaseIds?.length) {
    return item.DiseaseIds[0].Value;
  }
  const title = item.Title ?? "";
  const knownDiseases = [
    "Ebola", "Cholera", "Marburg", "Mpox", "COVID-19", "MERS",
    "Yellow Fever", "Plague", "Dengue", "Zika", "Avian Influenza",
    "Influenza", "Measles", "Diphtheria", "Polio", "Meningitis",
    "Lassa Fever", "Rift Valley Fever", "Nipah", "Chikungunya",
    "Crimean-Congo haemorrhagic fever", "Oropouche",
  ];
  for (const d of knownDiseases) {
    if (title.toLowerCase().includes(d.toLowerCase())) return d;
  }
  return title.split(" – ")[0]?.trim() || title.slice(0, 100);
}

function extractCountry(item: WHOItem): { name: string; iso: string } {
  if (item.CountryTags?.length) {
    const tag = item.CountryTags[0];
    return { name: tag.Name, iso: toAlpha3(tag.IsoCode ?? tag.Name) };
  }
  const titleParts = item.Title?.split(" – ") ?? [];
  if (titleParts.length > 1) {
    const countryPart = titleParts[titleParts.length - 1].trim();
    return { name: countryPart, iso: toAlpha3(countryPart) };
  }
  return { name: "Unknown", iso: "UNK" };
}

function parseCounts(summary: string): { cases?: number; deaths?: number } {
  let cases: number | undefined;
  let deaths: number | undefined;

  const caseMatch = summary.match(
    /(\d[\d,]*)\s*(?:confirmed|suspected|reported|cumulative)?\s*cases/i,
  );
  if (caseMatch) cases = parseInt(caseMatch[1].replace(/,/g, ""), 10);

  const deathMatch = summary.match(
    /(\d[\d,]*)\s*(?:deaths?|fatalities)/i,
  );
  if (deathMatch) deaths = parseInt(deathMatch[1].replace(/,/g, ""), 10);

  return { cases, deaths };
}

export const whoDonAdapter: SourceAdapter = {
  source: "who_don",
  name: "WHO Disease Outbreak News",

  async fetch(): Promise<WHOResponse> {
    log.info("Fetching WHO DON feed");
    const res = await fetchWithRetry(
      `${BASE_URL}?$orderby=PublicationDate desc&$top=50`,
    );
    return (await res.json()) as WHOResponse;
  },

  normalize(raw: unknown): FetchResult {
    const data = raw as WHOResponse;
    const items = data.value ?? [];
    const events: NormalizedEvent[] = [];

    for (const item of items) {
      try {
        const country = extractCountry(item);
        const counts = parseCounts(item.Summary ?? "");
        const pubDate = new Date(item.PublicationDate);

        events.push({
          source: "who_don",
          sourceId: String(item.Id),
          diseaseName: extractDiseaseName(item),
          pathogenName: null,
          pathogenType: null,
          hostSpeciesCategory: "human",
          status: "active",
          locationName: country.name,
          countryIso: country.iso,
          latitude: null,
          longitude: null,
          dateReported: pubDate,
          lastReportDate: pubDate,
          caseCount: counts.cases ?? null,
          deathCount: counts.deaths ?? null,
          recoveredCount: null,
          sourceUrl: item.Url
            ? `https://www.who.int${item.Url}`
            : `https://www.who.int/emergencies/disease-outbreak-news`,
          rawData: item,
        });
      } catch (err) {
        log.warn({ err, itemId: item.Id }, "Failed to normalize WHO DON item");
      }
    }

    log.info({ count: events.length }, "Normalized WHO DON events");
    return { events };
  },
};
