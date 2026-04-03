import { Prisma } from "@prisma/client";

export interface OutbreakFilters {
  status?: string;
  host_species_category?: string;
  disease_name?: string;
  pathogen_name?: string;
  pathogen_type?: string;
  country_iso?: string;
  date_from?: string;
  date_to?: string;
  source?: string;
  limit?: number;
  offset?: number;
}

export function parseOutbreakFilters(
  searchParams: URLSearchParams,
): OutbreakFilters {
  return {
    status: searchParams.get("status") ?? "active,monitoring",
    host_species_category:
      searchParams.get("host_species_category") ?? "human",
    disease_name: searchParams.get("disease_name") ?? undefined,
    pathogen_name: searchParams.get("pathogen_name") ?? undefined,
    pathogen_type: searchParams.get("pathogen_type") ?? undefined,
    country_iso: searchParams.get("country_iso") ?? undefined,
    date_from: searchParams.get("date_from") ?? undefined,
    date_to: searchParams.get("date_to") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    limit: searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : 1000,
    offset: searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!, 10)
      : 0,
  };
}

export function buildOutbreakWhere(
  filters: OutbreakFilters,
): Prisma.OutbreakEventWhereInput {
  const where: Prisma.OutbreakEventWhereInput = {};

  if (filters.status) {
    const statuses = filters.status.split(",").map((s) => s.trim());
    where.status = { in: statuses as Prisma.OutbreakEventWhereInput["status"][] extends (infer U)[] ? U[] : never } as never;
  }

  if (filters.host_species_category) {
    where.hostSpeciesCategory = filters.host_species_category as never;
  }

  if (filters.disease_name) {
    where.diseaseName = { contains: filters.disease_name, mode: "insensitive" };
  }

  if (filters.pathogen_name) {
    where.pathogenName = {
      contains: filters.pathogen_name,
      mode: "insensitive",
    };
  }

  if (filters.pathogen_type) {
    where.pathogenType = filters.pathogen_type as never;
  }

  if (filters.country_iso) {
    where.countryIso = filters.country_iso.toUpperCase();
  }

  if (filters.source) {
    const sources = filters.source.split(",").map((s) => s.trim());
    where.source = { in: sources as never };
  }

  if (filters.date_from || filters.date_to) {
    where.lastReportDate = {};
    if (filters.date_from) {
      (where.lastReportDate as Prisma.DateTimeFilter).gte = new Date(
        filters.date_from,
      );
    }
    if (filters.date_to) {
      (where.lastReportDate as Prisma.DateTimeFilter).lte = new Date(
        filters.date_to,
      );
    }
  }

  return where;
}

export const outbreakListSelect = {
  id: true,
  source: true,
  sourceId: true,
  diseaseName: true,
  pathogenName: true,
  pathogenType: true,
  hostSpeciesCategory: true,
  hostSpeciesDetail: true,
  status: true,
  locationName: true,
  countryIso: true,
  adminRegion: true,
  latitude: true,
  longitude: true,
  dateReported: true,
  dateOnset: true,
  lastReportDate: true,
  resolutionDate: true,
  caseCount: true,
  deathCount: true,
  recoveredCount: true,
  sourceUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OutbreakEventSelect;
