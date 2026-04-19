import { NextRequest } from "next/server";
import { runScreeningPipeline, type PipelineCallbacks } from "@/lib/pipeline";
import { enhanceReportWithGemini } from "@/lib/generate-report";
import { validateSequence } from "@/lib/validate";

export const maxDuration = 300;

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
      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

      function send(event: string, data: unknown) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      // Stagger SSE events slightly so the UI animates through each step,
      // even when pipeline results are cached and return instantly.
      const callbacks: PipelineCallbacks = {
        onLog: (msg) => send("log", { message: msg }),
        onDomainStart: async (i, annotation) => {
          await delay(3000);
          send("domain_start", { index: i, annotation });
        },
        onDiamondComplete: async (i, matched) => {
          await delay(3000);
          send("diamond_complete", { index: i, matched });
        },
        onEsmFoldComplete: async (i) => {
          await delay(3000);
          send("esmfold_complete", { index: i });
        },
        onFoldseekComplete: async (i) => {
          await delay(3000);
          send("foldseek_complete", { index: i });
        },
        onDomainComplete: async (i, domainReport) => {
          await delay(500);
          send("domain_complete", { index: i, domainReport });
        },
        onDomainsExtracted: async (domains, sequenceLength, orderId) => {
          await delay(2500);
          send("domains_extracted", { domains, sequenceLength, orderId });
        },
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
