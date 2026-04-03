import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json" with { type: "json" };

countries.registerLocale(enLocale);

const MANUAL_OVERRIDES: Record<string, string> = {
  "US": "USA",
  "UK": "GBR",
  "United Kingdom": "GBR",
  "Russia": "RUS",
  "Russian Federation": "RUS",
  "South Korea": "KOR",
  "Republic of Korea": "KOR",
  "Korea, South": "KOR",
  "North Korea": "PRK",
  "Korea, North": "PRK",
  "Taiwan": "TWN",
  "Taiwan*": "TWN",
  "Iran": "IRN",
  "Iran (Islamic Republic of)": "IRN",
  "Syria": "SYR",
  "Syrian Arab Republic": "SYR",
  "Venezuela": "VEN",
  "Bolivia": "BOL",
  "Tanzania": "TZA",
  "Viet Nam": "VNM",
  "Vietnam": "VNM",
  "Laos": "LAO",
  "Lao People's Democratic Republic": "LAO",
  "Côte d'Ivoire": "CIV",
  "Ivory Coast": "CIV",
  "Cote d'Ivoire": "CIV",
  "Czech Republic": "CZE",
  "Czechia": "CZE",
  "Eswatini": "SWZ",
  "Swaziland": "SWZ",
  "DRC": "COD",
  "Congo (Kinshasa)": "COD",
  "Congo (Brazzaville)": "COG",
  "Democratic Republic of the Congo": "COD",
  "Burma": "MMR",
  "Myanmar": "MMR",
  "West Bank and Gaza": "PSE",
  "Palestine": "PSE",
  "Diamond Princess": "---",
  "MS Zaandam": "---",
  "Holy See": "VAT",
  "Micronesia": "FSM",
  "Timor-Leste": "TLS",
  "Cabo Verde": "CPV",
  "S. Korea": "KOR",
};

/**
 * Normalize a country name or ISO code to ISO 3166-1 alpha-3.
 * Returns "UNK" if no match is found.
 */
export function toAlpha3(input: string): string {
  if (!input) return "UNK";
  const trimmed = input.trim();

  if (MANUAL_OVERRIDES[trimmed]) return MANUAL_OVERRIDES[trimmed];

  if (/^[A-Z]{3}$/.test(trimmed)) {
    if (countries.isValid(trimmed)) return trimmed;
  }

  if (/^[A-Z]{2}$/.test(trimmed.toUpperCase())) {
    const alpha3 = countries.alpha2ToAlpha3(trimmed.toUpperCase());
    if (alpha3) return alpha3;
  }

  const alpha3 = countries.getAlpha3Code(trimmed, "en");
  if (alpha3) return alpha3;

  const upperInput = trimmed.toUpperCase();
  for (const [key, value] of Object.entries(MANUAL_OVERRIDES)) {
    if (key.toUpperCase() === upperInput) return value;
  }

  return "UNK";
}

/**
 * Map US state FIPS codes to state names.
 */
const FIPS_TO_STATE: Record<string, string> = {
  "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas",
  "06": "California", "08": "Colorado", "09": "Connecticut", "10": "Delaware",
  "11": "District of Columbia", "12": "Florida", "13": "Georgia", "15": "Hawaii",
  "16": "Idaho", "17": "Illinois", "18": "Indiana", "19": "Iowa",
  "20": "Kansas", "21": "Kentucky", "22": "Louisiana", "23": "Maine",
  "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
  "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska",
  "32": "Nevada", "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico",
  "36": "New York", "37": "North Carolina", "38": "North Dakota", "39": "Ohio",
  "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island",
  "45": "South Carolina", "46": "South Dakota", "47": "Tennessee", "48": "Texas",
  "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington",
  "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming",
};

export function fipsToState(fips: string): string | undefined {
  return FIPS_TO_STATE[fips.padStart(2, "0")];
}

/** HHS region number to array of state abbreviations (for Delphi fluview). */
const HHS_REGIONS: Record<number, string> = {
  1: "CT, ME, MA, NH, RI, VT",
  2: "NJ, NY",
  3: "DE, DC, MD, PA, VA, WV",
  4: "AL, FL, GA, KY, MS, NC, SC, TN",
  5: "IL, IN, MI, MN, OH, WI",
  6: "AR, LA, NM, OK, TX",
  7: "IA, KS, MO, NE",
  8: "CO, MT, ND, SD, UT, WY",
  9: "AZ, CA, HI, NV",
  10: "AK, ID, OR, WA",
};

export function hhsRegionName(region: number): string {
  return `HHS Region ${region} (${HHS_REGIONS[region] ?? "unknown"})`;
}

/**
 * Convert CDC epiweek (YYYYWW) to a Date (the Sunday starting that week).
 */
export function epiweekToDate(epiweek: number): Date {
  const year = Math.floor(epiweek / 100);
  const week = epiweek % 100;
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const jan1Day = jan1.getUTCDay();
  const firstSunday = new Date(jan1);
  firstSunday.setUTCDate(1 + ((7 - jan1Day) % 7));
  firstSunday.setUTCDate(firstSunday.getUTCDate() + (week - 1) * 7);
  return firstSunday;
}
