import { searchStructure, FoldseekError } from "@/lib/foldseek/index";
import type { FoldseekRequest, FoldseekResponse } from "@/lib/foldseek/types";

export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  let body: FoldseekRequest;

  try {
    body = (await request.json()) as FoldseekRequest;
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body" }, 400);
  }

  if (!body.pdbString || typeof body.pdbString !== "string") {
    return jsonResponse(
      { success: false, error: "pdbString is required and must be a non-empty string" },
      400
    );
  }

  try {
    const data = await searchStructure(body.pdbString, {
      probThreshold: body.probThreshold,
      maxHitsPerDb: body.maxHitsPerDb,
    });

    return jsonResponse({ success: true, data }, 200);
  } catch (err) {
    if (err instanceof FoldseekError) {
      return jsonResponse({ success: false, error: err.message }, 503);
    }
    console.error("[foldseek route]", err);
    return jsonResponse({ success: false, error: "Internal error" }, 500);
  }
}

function jsonResponse(payload: FoldseekResponse, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
