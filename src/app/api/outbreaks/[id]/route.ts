import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const event = await prisma.outbreakEvent.findUnique({
      where: { id },
      include: {
        timeSeries: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Outbreak event not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...event,
      time_series: event.timeSeries,
      timeSeries: undefined,
    });
  } catch (err) {
    console.error("[GET /api/outbreaks/:id]", err);
    return NextResponse.json(
      { error: "Failed to fetch outbreak event" },
      { status: 500 },
    );
  }
}
