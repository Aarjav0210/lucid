import { streamText } from "ai";
import { model } from "@/lib/model";
import { systemPrompt } from "@/lib/prompt";
import { validateSequence, detectSequenceType } from "@/lib/validate";
import { esmFoldPredict } from "@/lib/tools/esmfold-tool";
import { runInterProScan, type InterProResult } from "@/lib/interpro";
import { cacheDomainSlices, getCachedDomainSlices } from "@/lib/domain-cache";

// InterPro searches can take several minutes
export const maxDuration = 300;

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
  // Check cache first, then run scan if needed
  let interproContext = "";
  if (seqType === "protein") {
    const cached = await getCachedDomainSlices(validation.sequence);
    let interproResult: InterProResult;

    if (cached) {
      console.log(`Domain cache HIT — ${cached.slices.length} slice(s) from ${cached.timestamp}`);
      interproResult = {
        status: cached.status,
        searchDuration: cached.searchDuration,
        domains: cached.slices.map((s) => ({
          accession: s.accession,
          name: s.name,
          type: s.type,
          database: s.database,
          start: s.start,
          end: s.end,
          evalue: s.evalue,
          score: null,
        })),
        slices: cached.slices.map((s) => ({
          domain: {
            accession: s.accession,
            name: s.name,
            type: s.type,
            database: s.database,
            start: s.start,
            end: s.end,
            evalue: s.evalue,
            score: null,
          },
          sequence: s.sequence,
        })),
        extractedDomains: cached.extractedDomains ?? [],
      };
    } else {
      interproResult = await runInterProScan(validation.sequence);
      // Cache the result for future lookups
      await cacheDomainSlices(validation.sequence, interproResult);
    }

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
    tools: { esmFoldPredict },
    maxSteps: 5,
    toolChoice: "auto",
    onError: (error) => {
      console.error("streamText error:", error);
    },
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
