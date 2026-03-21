import { NextRequest } from "next/server";
import { runScreeningPipeline, type PipelineCallbacks } from "@/lib/pipeline";
import { enhanceReportWithGemini } from "@/lib/generate-report";
import { validateSequence } from "@/lib/validate";

export const maxDuration = 600; // 10 minutes — InterPro can be slow

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawSequence = body?.sequence as string | undefined;

  if (!rawSequence || typeof rawSequence !== "string") {
    return Response.json(
      { error: "Missing 'sequence' field in request body." },
      { status: 400 }
    );
  }

  // Pre-validate before starting SSE stream
  const validation = validateSequence(rawSequence);
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const useGemini = body?.gemini === true;

  // Set up SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      const callbacks: PipelineCallbacks = {
        onLog: (msg) => send("log", { message: msg }),
        onDomainStart: (i, annotation) =>
          send("domain_start", { index: i, annotation }),
        onDiamondComplete: (i, matched) =>
          send("diamond_complete", { index: i, matched }),
        onEsmFoldComplete: (i) => send("esmfold_complete", { index: i }),
        onFoldseekComplete: (i) => send("foldseek_complete", { index: i }),
        onDomainComplete: (i) => send("domain_complete", { index: i }),
      };

      try {
        send("status", { stage: "starting" });

        let report = await runScreeningPipeline(rawSequence, { callbacks });

        if (
          useGemini &&
          report.status === "completed" &&
          report.domains.length > 0
        ) {
          send("status", { stage: "generating_report" });
          try {
            report = await enhanceReportWithGemini(report);
          } catch {
            // Gemini failed — keep static report
          }
        }

        send("result", report);
        send("status", { stage: "done" });
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
