import { streamText } from "ai";
import { model } from "@/lib/model";
import { systemPrompt } from "@/lib/prompt";
import { validateSequence, detectSequenceType } from "@/lib/validate";
import { blastSearch } from "@/lib/tools/blast-tool";

// BLAST searches can take up to 3 minutes
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

  // Detect sequence type and inject it into the user message so the model
  // knows which BLAST program to request
  const seqType = detectSequenceType(validation.sequence);
  const enrichedMessages = [...messages];
  const lastIdx = enrichedMessages.length - 1;
  enrichedMessages[lastIdx] = {
    ...enrichedMessages[lastIdx],
    content: `[Sequence type: ${seqType}]\n\n${enrichedMessages[lastIdx].content}`,
  };

  const result = streamText({
    model,
    system: systemPrompt,
    messages: enrichedMessages,
    tools: { blastSearch },
    maxSteps: 5,
    toolChoice: "required",
  });

  return result.toDataStreamResponse();
}
