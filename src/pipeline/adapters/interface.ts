import type {
  Source,
  PathogenType,
  HostSpeciesCategory,
  OutbreakStatus,
} from "@prisma/client";

export interface NormalizedEvent {
  source: Source;
  sourceId: string;
  diseaseName: string;
  pathogenName?: string | null;
  pathogenType?: PathogenType | null;
  hostSpeciesCategory: HostSpeciesCategory;
  hostSpeciesDetail?: string | null;
  status: OutbreakStatus;
  locationName: string;
  countryIso: string;
  adminRegion?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  dateReported: Date;
  dateOnset?: Date | null;
  lastReportDate: Date;
  resolutionDate?: Date | null;
  caseCount?: number | null;
  deathCount?: number | null;
  recoveredCount?: number | null;
  sourceUrl?: string | null;
  rawData: unknown;
}

export interface TimeSeriesEntry {
  sourceId: string;
  date: Date;
  cumulativeCases?: number | null;
  cumulativeDeaths?: number | null;
  newCases?: number | null;
  newDeaths?: number | null;
}

export interface FetchResult {
  events: NormalizedEvent[];
  timeSeries?: TimeSeriesEntry[];
}

export interface SourceAdapter {
  readonly source: Source;
  readonly name: string;
  fetch(): Promise<unknown>;
  normalize(raw: unknown): FetchResult;
}
