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

    const [total, data] = await Promise.all([
      prisma.outbreakEvent.count({ where }),
      prisma.outbreakEvent.findMany({
        where,
        select: outbreakListSelect,
        orderBy: { lastReportDate: "desc" },
        take: filters.limit,
        skip: filters.offset,
      }),
    ]);

    return NextResponse.json({ total, data });
  } catch (err) {
    console.error("[GET /api/outbreaks]", err);
    return NextResponse.json(
      { error: "Failed to fetch outbreaks" },
      { status: 500 },
    );
  }
}
