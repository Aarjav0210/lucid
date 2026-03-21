import { streamText } from "ai";
import { model } from "@/lib/model";
import { systemPrompt } from "@/lib/prompt";
import { validateSequence, detectSequenceType } from "@/lib/validate";
import { esmFoldPredict } from "@/lib/tools/esmfold-tool";
import { runInterProScan, type InterProResult } from "@/lib/interpro";

// InterPro searches can take several minutes
export const maxDuration = 600;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // The last user message contains the sequence
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== "user") {
    return new Response("Missing user message", { status: 400 });
  }

  // Validate the sequence
  const validation = validateSequence(lastMessage.content);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const seqType = detectSequenceType(validation.sequence);

  // For protein sequences, run InterPro domain scan before LLM
  let interproContext = "";
  if (seqType === "protein") {
    const interproResult: InterProResult = await runInterProScan(validation.sequence);
    interproContext = formatInterProContext(interproResult);
  }

  // Build enriched message with sequence type and InterPro results
  const enrichedMessages = [...messages];
  const lastIdx = enrichedMessages.length - 1;
  const contextParts = [`[Sequence type: ${seqType}]`];
  if (interproContext) {
    contextParts.push(interproContext);
  }
  enrichedMessages[lastIdx] = {
    ...enrichedMessages[lastIdx],
    content: `${contextParts.join("\n\n")}\n\n${enrichedMessages[lastIdx].content}`,
  };

  const result = streamText({
    model,
    system: systemPrompt,
    messages: enrichedMessages,
<<<<<<< HEAD
    tools: { blastSearch, esmFoldPredict },
    maxSteps: 5,
    toolChoice: "required",
=======
    onError: (error) => {
      console.error("streamText error:", error);
    },
>>>>>>> main
  });

  return result.toDataStreamResponse();
}

function formatInterProContext(result: InterProResult): string {
  if (result.status === "error") {
    return `[InterPro domain scan: FAILED — ${result.error}]`;
  }
  if (result.status === "timeout") {
    return `[InterPro domain scan: TIMED OUT after ${result.searchDuration}s]`;
  }
  if (result.status === "no_domains" || result.domains.length === 0) {
    return `[InterPro domain scan: no domains identified (${result.searchDuration}s)]`;
  }

  const domainLines = result.slices.map((s) => {
    const d = s.domain;
    const evalueStr = d.evalue !== null ? `, e-value: ${d.evalue.toExponential(1)}` : "";
    return [
      `  - ${d.name} (${d.accession}, ${d.type})`,
      `    Source: ${d.database} | Position: ${d.start}–${d.end}${evalueStr}`,
      `    Subsequence: ${s.sequence}`,
    ].join("\n");
  });

  return [
    `[InterPro domain scan: ${result.domains.length} domain(s) identified in ${result.searchDuration}s]`,
    ...domainLines,
  ].join("\n");
}
