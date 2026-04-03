import type { SourceAdapter, FetchResult, NormalizedEvent } from "./interface.js";
import { fetchWithRetry } from "../utils/retry.js";
import { toAlpha3 } from "../utils/country-codes.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("who-don");

const BASE_URL = "https://www.who.int/api/news/diseaseoutbreaknews";

const PAGE_SIZE = 100;
const MAX_ITEMS = 5000;

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
  "@odata.count"?: number;
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

  const title = item.Title ?? "";

  // Try em-dash first, then regular dash/hyphen (with or without surrounding spaces)
  for (const sep of [" – ", " - ", "- "]) {
    const idx = title.lastIndexOf(sep);
    if (idx === -1) continue;

    let candidate = title.slice(idx + sep.length).trim();

    // Strip trailing suffixes like "- Update 3", "(Update)", etc.
    candidate = candidate
      .replace(/\s*[-–]\s*[Uu]pdate.*$/i, "")
      .replace(/\s*\([Uu]pdate.*?\)\s*$/i, "")
      .trim();
    if (!candidate) continue;

    const iso = toAlpha3(candidate);
    if (iso !== "UNK") return { name: candidate, iso };
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
    log.info("Fetching WHO DON feed (paginated)");
    const allItems: WHOItem[] = [];
    let skip = 0;
    let totalAvailable: number | undefined;

    while (allItems.length < MAX_ITEMS) {
      const url =
        `${BASE_URL}?$orderby=PublicationDate desc&$top=${PAGE_SIZE}&$skip=${skip}&$count=true`;
      const res = await fetchWithRetry(url);
      const page = (await res.json()) as WHOResponse;

      if (totalAvailable === undefined && page["@odata.count"] != null) {
        totalAvailable = page["@odata.count"];
        log.info({ totalAvailable }, "WHO DON total reports available");
      }

      const items = page.value ?? [];
      if (items.length === 0) break;

      allItems.push(...items);
      log.debug({ fetched: allItems.length, pageSize: items.length }, "WHO DON page fetched");

      if (items.length < PAGE_SIZE) break;
      skip += PAGE_SIZE;
    }

    log.info({ total: allItems.length }, "WHO DON fetch complete");
    return { value: allItems };
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
