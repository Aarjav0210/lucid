import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseOutbreakFilters,
  buildOutbreakWhere,
  outbreakListSelect,
} from "@/lib/outbreak-queries";

export async function GET(req: NextRequest) {
  try {
    const filters = parseOutbreakFilters(req.nextUrl.searchParams);
    const where = buildOutbreakWhere(filters);

    where.latitude = { not: null };
    where.longitude = { not: null };

    const events = await prisma.outbreakEvent.findMany({
      where,
      select: outbreakListSelect,
      orderBy: { lastReportDate: "desc" },
      take: filters.limit,
      skip: filters.offset,
    });

    const features = events.map((e) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [e.longitude!, e.latitude!],
      },
      properties: {
        id: e.id,
        disease_name: e.diseaseName,
        pathogen_name: e.pathogenName,
        pathogen_type: e.pathogenType,
        status: e.status,
        location_name: e.locationName,
        country_iso: e.countryIso,
        case_count: e.caseCount,
        death_count: e.deathCount,
        last_report_date: e.lastReportDate.toISOString(),
        date_reported: e.dateReported.toISOString(),
        source: e.source,
        source_url: e.sourceUrl,
      },
    }));

    return NextResponse.json({
      type: "FeatureCollection",
      features,
    });
  } catch (err) {
    console.error("[GET /api/outbreaks/geojson]", err);
    return NextResponse.json(
      { error: "Failed to fetch outbreak GeoJSON" },
      { status: 500 },
    );
  }
}
