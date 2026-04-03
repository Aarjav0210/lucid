export interface OutbreakFeatureProperties {
  id: string;
  disease_name: string;
  pathogen_name: string | null;
  pathogen_type: string | null;
  status: "active" | "monitoring" | "contained" | "resolved";
  location_name: string;
  country_iso: string;
  case_count: number | null;
  death_count: number | null;
  last_report_date: string;
  date_reported: string;
  source: string;
  source_url: string | null;
}

export type OutbreakFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  OutbreakFeatureProperties
>;

export interface OutbreakDetail {
  id: string;
  source: string;
  sourceId: string;
  diseaseName: string;
  pathogenName: string | null;
  pathogenType: string | null;
  hostSpeciesCategory: string;
  hostSpeciesDetail: string | null;
  status: string;
  locationName: string;
  countryIso: string;
  adminRegion: string | null;
  latitude: number | null;
  longitude: number | null;
  dateReported: string;
  dateOnset: string | null;
  lastReportDate: string;
  resolutionDate: string | null;
  caseCount: number | null;
  deathCount: number | null;
  recoveredCount: number | null;
  sourceUrl: string | null;
  rawData: unknown;
  createdAt: string;
  updatedAt: string;
  time_series: OutbreakTimeSeries[];
}

export interface OutbreakTimeSeries {
  id: string;
  outbreakEventId: string;
  date: string;
  cumulativeCases: number | null;
  cumulativeDeaths: number | null;
  newCases: number | null;
  newDeaths: number | null;
}

export interface FilterOptions {
  disease_names: string[];
  pathogen_names: string[];
  pathogen_types: string[];
  countries: { iso: string; name: string }[];
  statuses: string[];
}

export interface PulseFilters {
  status: string[];
  disease_name: string[];
  pathogen_name: string[];
  pathogen_type: string[];
  country_iso: string[];
  source: string[];
  date_from: string;
  date_to: string;
  host_species_category: string;
}

export const SOURCE_LABELS: Record<string, string> = {
  who_don: "WHO Disease Outbreak News",
  disease_sh: "Disease.sh",
  delphi_epidata: "Delphi Epidata",
  cdc_nndss: "CDC NNDSS",
  cdc_socrata: "CDC Socrata",
  global_health: "Global Health",
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-bauhaus-red/10", text: "text-bauhaus-red", dot: "bg-bauhaus-red" },
  monitoring: { bg: "bg-bauhaus-yellow/10", text: "text-bauhaus-yellow", dot: "bg-bauhaus-yellow" },
  contained: { bg: "bg-bauhaus-blue/10", text: "text-bauhaus-blue", dot: "bg-bauhaus-blue" },
  resolved: { bg: "bg-zinc-500/10", text: "text-zinc-500", dot: "bg-zinc-400" },
};

export function getDefaultFilters(): PulseFilters {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  return {
    status: ["active", "monitoring"],
    disease_name: [],
    pathogen_name: [],
    pathogen_type: [],
    country_iso: [],
    source: [],
    date_from: ninetyDaysAgo.toISOString().split("T")[0],
    date_to: now.toISOString().split("T")[0],
    host_species_category: "human",
  };
}

export function filtersToSearchParams(filters: PulseFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status.length > 0) params.set("status", filters.status.join(","));
  if (filters.disease_name.length > 0)
    params.set("disease_name", filters.disease_name.join(","));
  if (filters.pathogen_name.length > 0)
    params.set("pathogen_name", filters.pathogen_name.join(","));
  if (filters.pathogen_type.length > 0)
    params.set("pathogen_type", filters.pathogen_type.join(","));
  if (filters.country_iso.length > 0)
    params.set("country_iso", filters.country_iso.join(","));
  if (filters.source.length > 0)
    params.set("source", filters.source.join(","));
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  params.set("host_species_category", filters.host_species_category);
  params.set("limit", "5000");
  return params;
}
