import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as countries from "i18n-iso-countries";

countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

export async function GET() {
  try {
    const [diseaseRows, pathogenNameRows, pathogenTypeRows, countryRows, statusRows] =
      await Promise.all([
        prisma.outbreakEvent.findMany({
          distinct: ["diseaseName"],
          select: { diseaseName: true },
          orderBy: { diseaseName: "asc" },
        }),
        prisma.outbreakEvent.findMany({
          distinct: ["pathogenName"],
          select: { pathogenName: true },
          where: { pathogenName: { not: null } },
          orderBy: { pathogenName: "asc" },
        }),
        prisma.outbreakEvent.findMany({
          distinct: ["pathogenType"],
          select: { pathogenType: true },
          where: { pathogenType: { not: null } },
        }),
        prisma.outbreakEvent.findMany({
          distinct: ["countryIso"],
          select: { countryIso: true },
          orderBy: { countryIso: "asc" },
        }),
        prisma.outbreakEvent.findMany({
          distinct: ["status"],
          select: { status: true },
        }),
      ]);

    return NextResponse.json({
      disease_names: diseaseRows.map((r) => r.diseaseName),
      pathogen_names: pathogenNameRows
        .map((r) => r.pathogenName)
        .filter(Boolean),
      pathogen_types: pathogenTypeRows
        .map((r) => r.pathogenType)
        .filter(Boolean),
      countries: countryRows.map((r) => ({
        iso: r.countryIso,
        name:
          countries.getName(r.countryIso, "en", { select: "official" }) ??
          r.countryIso,
      })),
      statuses: statusRows.map((r) => r.status),
    });
  } catch (err) {
    console.error("[GET /api/outbreaks/filters]", err);
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 },
    );
  }
}
