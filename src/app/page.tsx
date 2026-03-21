"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { exampleSequences } from "@/lib/examples";
import type { BlastResult } from "@/lib/blast";

const riskColors: Record<string, string> = {
  LOW: "bg-green-600",
  MEDIUM: "bg-yellow-500 text-gray-900",
  HIGH: "bg-red-600",
  UNKNOWN: "bg-gray-500",
};

const tierColors: Record<string, string> = {
  exact: "text-red-400",
  high: "text-orange-400",
  moderate: "text-yellow-400",
  low: "text-gray-400",
};

function extractRiskLevel(text: string): string | null {
  const match = text.match(
    /\b(risk\s*level|risk)\s*[:：]?\s*(LOW|MEDIUM|HIGH|UNKNOWN)\b/i
  );
  if (match) return match[2].toUpperCase();
  const fallback = text
    .slice(0, 300)
    .match(/\b(LOW|MEDIUM|HIGH|UNKNOWN)\b/i);
  return fallback ? fallback[1].toUpperCase() : null;
}

function BlastSpinner() {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
      <div className="flex items-center gap-3">
        <div className="relative h-5 w-5">
          <div className="absolute inset-0 rounded-full border-2 border-gray-700" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-200">
            Running BLAST search...
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Querying NCBI databases and cross-referencing threat catalog. This
            may take 30s–3min.
          </p>
        </div>
      </div>
      {/* Progress bar animation */}
      <div className="mt-4 h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
        <div className="h-full w-1/3 rounded-full bg-blue-500 animate-[progress_2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

function BlastResultsCard({ result }: { result: BlastResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wide text-gray-500">
            BLAST
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${riskColors[result.riskSignal] ?? "bg-gray-500"}`}
          >
            {result.riskSignal}
          </span>
          <span className="text-xs text-gray-500">
            {result.searchDuration}s &middot; {result.program} &middot;{" "}
            {result.database}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-400 hover:text-gray-200"
        >
          {expanded ? "Hide hits" : `Show ${result.hits.length} hit(s)`}
        </button>
      </div>

      {result.status === "error" && (
        <p className="text-sm text-red-400">{result.error}</p>
      )}
      {result.status === "timeout" && (
        <p className="text-sm text-yellow-400">{result.error}</p>
      )}

      {expanded && result.hits.length > 0 && (
        <div className="space-y-2 mt-2">
          {result.hits.map((hit, i) => (
            <div
              key={`${hit.accession}-${i}`}
              className="rounded border border-gray-800 bg-gray-950 p-3 text-xs space-y-1"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-gray-200 break-all">
                  {hit.title}
                </span>
                <span
                  className={`shrink-0 font-mono font-semibold ${tierColors[hit.matchTier]}`}
                >
                  {hit.matchTier.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-400">
                <span>
                  Identity: <strong className="text-gray-200">{hit.identity}%</strong>
                </span>
                <span>
                  Coverage: <strong className="text-gray-200">{hit.coverage}%</strong>
                </span>
                <span>
                  E-value: <strong className="text-gray-200">{hit.evalue.toExponential(1)}</strong>
                </span>
                <span>
                  Score: <strong className="text-gray-200">{hit.bitScore}</strong>
                </span>
              </div>
              {hit.organism && (
                <p className="text-gray-500 italic">{hit.organism}</p>
              )}
              {hit.threatMatch && (
                <div className="mt-1 px-2 py-1 rounded bg-red-950 border border-red-800 text-red-300">
                  Threat catalog match: {hit.threatMatch.geneName} ({hit.threatMatch.category.replace("_", " ")})
                  {hit.threatMatch.regulatoryList !== "None" &&
                    ` — ${hit.threatMatch.regulatoryList} regulated`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [sequence, setSequence] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { messages, append, status, setMessages } = useChat({
    api: "/api/assess",
    onError: (err) => {
      setValidationError(err.message || "Something went wrong.");
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = () => {
    const trimmed = sequence.trim();
    if (!trimmed) {
      setValidationError("Please enter a sequence.");
      return;
    }
    const bytes = new TextEncoder().encode(trimmed).length;
    if (bytes > 1024) {
      setValidationError(`Sequence exceeds the 1 KB limit (${bytes} bytes).`);
      return;
    }
    setValidationError(null);
    setMessages([]);
    append({ role: "user", content: trimmed });
  };

  const loadExample = (seq: string) => {
    setSequence(seq);
    setValidationError(null);
    setMessages([]);
  };

  // Find the assistant message with text content
  const assistantMessage = messages.find(
    (m) => m.role === "assistant" && m.content.length > 0
  );
  const riskLevel = assistantMessage
    ? extractRiskLevel(assistantMessage.content)
    : null;

  // Find BLAST tool invocations across all assistant messages
  const blastInvocations = messages.flatMap((m) =>
    (m.parts ?? []).filter(
      (p): p is Extract<typeof p, { type: "tool-invocation" }> =>
        p.type === "tool-invocation" &&
        p.toolInvocation.toolName === "blastSearch"
    )
  );

  const blastPending = blastInvocations.some(
    (p) => p.toolInvocation.state === "call" || p.toolInvocation.state === "partial-call"
  );
  const blastResult = blastInvocations.find(
    (p) => p.toolInvocation.state === "result"
  );

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      <div className="w-full max-w-2xl space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Pane</h1>
          <p className="text-gray-400 text-sm">
            Sequence risk screening — Phase 1 (BLAST + LLM)
          </p>
        </header>

        {/* Example buttons */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Example sequences
          </p>
          <div className="flex flex-wrap gap-2">
            {exampleSequences.map((ex) => (
              <button
                key={ex.name}
                onClick={() => loadExample(ex.sequence)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-40 transition-colors border border-gray-700"
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sequence input */}
        <div className="space-y-2">
          <label
            htmlFor="sequence"
            className="block text-sm font-medium text-gray-300"
          >
            Paste sequence (FASTA or plain text, max 1 KB)
          </label>
          <textarea
            id="sequence"
            rows={8}
            value={sequence}
            onChange={(e) => {
              setSequence(e.target.value);
              setValidationError(null);
            }}
            placeholder={">sequence_header\nATGCGTACCTGA..."}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 text-sm font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            disabled={isLoading}
          />
          {validationError && (
            <p className="text-red-400 text-sm">{validationError}</p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !sequence.trim()}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {isLoading ? "Analyzing…" : "Screen Sequence"}
        </button>

        {/* BLAST progress */}
        {blastPending && !blastResult && <BlastSpinner />}

        {/* BLAST results card */}
        {blastResult && blastResult.toolInvocation.state === "result" && (
          <BlastResultsCard
            result={blastResult.toolInvocation.result as BlastResult}
          />
        )}

        {/* LLM assessment */}
        {assistantMessage && (
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-6 space-y-4">
            {riskLevel && (
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${riskColors[riskLevel] ?? "bg-gray-500"}`}
              >
                {riskLevel} RISK
              </span>
            )}
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
              {assistantMessage.content}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-600">
          Phase 1 — BLAST search + LLM assessment. Results cross-referenced
          against US Select Agents &amp; Toxins list and dual-use gene catalog.
        </p>
      </div>
    </main>
  );
}
