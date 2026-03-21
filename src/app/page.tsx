"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { exampleSequences } from "@/lib/examples";
import type { BlastResult } from "@/lib/blast";
import {
  Circle,
  Square,
  Triangle,
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  Shield,
  Search,
} from "lucide-react";

/* ─── Risk & tier color mappings (Bauhaus palette) ─── */

const riskColors: Record<string, string> = {
  LOW: "bg-bauhaus-blue text-white",
  MEDIUM: "bg-bauhaus-yellow text-bauhaus-black",
  HIGH: "bg-bauhaus-red text-white",
  UNKNOWN: "bg-bauhaus-muted text-bauhaus-black",
};

const riskBorderColors: Record<string, string> = {
  LOW: "border-bauhaus-blue",
  MEDIUM: "border-bauhaus-yellow",
  HIGH: "border-bauhaus-red",
  UNKNOWN: "border-bauhaus-muted",
};

const tierColors: Record<string, string> = {
  exact: "text-bauhaus-red font-bold",
  high: "text-bauhaus-red",
  moderate: "text-bauhaus-yellow",
  low: "text-bauhaus-muted",
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

/* ─── Geometric decorations ─── */

function BauhausLogo() {
  return (
    <div className="flex items-center gap-2">
      <Circle className="w-5 h-5 fill-bauhaus-red text-bauhaus-red" />
      <Square className="w-5 h-5 fill-bauhaus-blue text-bauhaus-blue" />
      <Triangle className="w-5 h-5 fill-bauhaus-yellow text-bauhaus-yellow" />
    </div>
  );
}

function GeometricComposition() {
  return (
    <div className="relative w-full h-full min-h-[200px]">
      {/* Large circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-48 sm:h-48 rounded-full border-4 border-white/30" />
      {/* Filled red circle */}
      <div className="absolute top-[15%] left-[20%] w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-bauhaus-red opacity-80" />
      {/* Rotated square */}
      <div className="absolute bottom-[15%] right-[15%] w-20 h-20 sm:w-28 sm:h-28 bg-bauhaus-yellow opacity-70 rotate-45" />
      {/* Small solid square */}
      <div className="absolute top-[20%] right-[25%] w-10 h-10 sm:w-14 sm:h-14 bg-white opacity-30" />
      {/* Triangle via clip-path */}
      <div
        className="absolute bottom-[25%] left-[15%] w-14 h-14 sm:w-20 sm:h-20 bg-white opacity-40"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      />
    </div>
  );
}

/* ─── Card shape decorations ─── */

function CardDecoration({ color, shape }: { color: string; shape: "circle" | "square" | "triangle" }) {
  const base = `absolute top-3 right-3 w-3 h-3 ${color}`;
  if (shape === "circle") return <div className={`${base} rounded-full`} />;
  if (shape === "square") return <div className={base} />;
  return (
    <div
      className={`absolute top-3 right-3 w-3 h-3 ${color}`}
      style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
    />
  );
}

/* ─── BLAST Spinner ─── */

function BlastSpinner() {
  return (
    <div className="relative bg-white border-2 sm:border-4 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] sm:shadow-[8px_8px_0px_0px_#121212] p-6">
      <CardDecoration color="bg-bauhaus-blue" shape="circle" />
      <div className="flex items-center gap-4">
        <div className="relative h-10 w-10 shrink-0">
          <div className="absolute inset-0 rounded-full border-4 border-bauhaus-muted" />
          <div className="absolute inset-0 rounded-full border-4 border-bauhaus-blue border-t-transparent animate-spin" />
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-sm">
            Running BLAST Search
          </p>
          <p className="text-sm text-bauhaus-black/60 font-medium mt-1">
            Querying NCBI databases and cross-referencing threat catalog. This
            may take 30s–3min.
          </p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-4 h-2 w-full bg-bauhaus-muted overflow-hidden">
        <div className="h-full w-1/3 bg-bauhaus-blue animate-[progress_2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

/* ─── BLAST Results Card ─── */

function BlastResultsCard({ result }: { result: BlastResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative bg-white border-2 sm:border-4 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] sm:shadow-[8px_8px_0px_0px_#121212] transition-transform duration-200 ease-out hover:-translate-y-1">
      <CardDecoration color="bg-bauhaus-yellow" shape="square" />

      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 sm:p-6 text-left"
      >
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5" />
          <span className="font-bold uppercase tracking-wider text-sm">
            BLAST Results
          </span>
          <span
            className={`px-3 py-1 text-xs font-bold uppercase tracking-widest border-2 border-bauhaus-black ${riskColors[result.riskSignal] ?? "bg-bauhaus-muted"}`}
          >
            {result.riskSignal}
          </span>
          <span className="text-xs font-medium text-bauhaus-black/50 hidden sm:inline">
            {result.searchDuration}s &middot; {result.program} &middot;{" "}
            {result.database}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-bauhaus-black/50">
            {result.hits.length} hit{result.hits.length !== 1 ? "s" : ""}
          </span>
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {result.status === "error" && (
        <p className="px-4 sm:px-6 pb-4 text-sm font-medium text-bauhaus-red">{result.error}</p>
      )}
      {result.status === "timeout" && (
        <p className="px-4 sm:px-6 pb-4 text-sm font-medium text-bauhaus-yellow">{result.error}</p>
      )}

      {/* Expanded hits */}
      {expanded && result.hits.length > 0 && (
        <div className="border-t-2 sm:border-t-4 border-bauhaus-black">
          {result.hits.map((hit, i) => (
            <div
              key={`${hit.accession}-${i}`}
              className={`p-4 sm:p-6 space-y-2 ${i > 0 ? "border-t-2 border-bauhaus-black" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-bold text-sm break-all">
                  {hit.title}
                </span>
                <span
                  className={`shrink-0 px-2 py-0.5 text-xs font-bold uppercase tracking-widest border-2 border-bauhaus-black ${
                    hit.matchTier === "exact" || hit.matchTier === "high"
                      ? "bg-bauhaus-red text-white"
                      : hit.matchTier === "moderate"
                        ? "bg-bauhaus-yellow text-bauhaus-black"
                        : "bg-bauhaus-muted text-bauhaus-black"
                  }`}
                >
                  {hit.matchTier.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium text-bauhaus-black/60">
                <span>
                  Identity: <strong className="text-bauhaus-black">{hit.identity}%</strong>
                </span>
                <span>
                  Coverage: <strong className="text-bauhaus-black">{hit.coverage}%</strong>
                </span>
                <span>
                  E-value: <strong className="text-bauhaus-black">{hit.evalue.toExponential(1)}</strong>
                </span>
                <span>
                  Score: <strong className="text-bauhaus-black">{hit.bitScore}</strong>
                </span>
              </div>
              {hit.organism && (
                <p className="text-sm font-medium text-bauhaus-black/50 italic">{hit.organism}</p>
              )}
              {hit.threatMatch && (
                <div className="mt-2 p-3 bg-bauhaus-red text-white border-2 border-bauhaus-black flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    Threat catalog: {hit.threatMatch.geneName} ({hit.threatMatch.category.replace("_", " ")})
                    {hit.threatMatch.regulatoryList !== "None" &&
                      ` — ${hit.threatMatch.regulatoryList} regulated`}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */

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

  const assistantMessage = messages.find(
    (m) => m.role === "assistant" && m.content.length > 0
  );
  const riskLevel = assistantMessage
    ? extractRiskLevel(assistantMessage.content)
    : null;

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

  const shapes = ["circle", "square", "triangle"] as const;
  const shapeColors = ["bg-bauhaus-red", "bg-bauhaus-blue", "bg-bauhaus-yellow"];

  return (
    <main className="min-h-screen flex flex-col">
      {/* ─── Navigation ─── */}
      <nav className="border-b-4 border-bauhaus-black bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <BauhausLogo />
            <span className="text-xl sm:text-2xl font-black uppercase tracking-tighter">
              Pane
            </span>
          </div>
          <span className="hidden sm:block text-xs font-bold uppercase tracking-widest text-bauhaus-black/40">
            Sequence Risk Screening
          </span>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="border-b-4 border-bauhaus-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2">
          {/* Left: text */}
          <div className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
              Screen
              <br />
              <span className="text-bauhaus-red">Sequences</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl font-medium text-bauhaus-black/70 max-w-lg leading-relaxed">
              Phase 1 biosecurity screening — BLAST search + LLM risk assessment.
              Cross-referenced against US Select Agents & Toxins and dual-use gene catalogs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#screen"
                className="inline-flex items-center gap-2 px-6 py-3 bg-bauhaus-red text-white font-bold uppercase tracking-wider text-sm border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] hover:bg-bauhaus-red/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
              >
                Start Screening
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#examples"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-bauhaus-black font-bold uppercase tracking-wider text-sm border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] hover:bg-bauhaus-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
              >
                Try Examples
              </a>
            </div>
          </div>
          {/* Right: geometric composition */}
          <div className="hidden lg:block bg-bauhaus-blue relative overflow-hidden border-l-4 border-bauhaus-black">
            <GeometricComposition />
          </div>
        </div>
      </section>

      {/* ─── Example Sequences ─── */}
      <section id="examples" className="border-b-4 border-bauhaus-black bg-bauhaus-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/60 mb-4">
            Example Sequences
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {exampleSequences.map((ex, i) => (
              <button
                key={ex.name}
                onClick={() => {
                  loadExample(ex.sequence);
                  document.getElementById("screen")?.scrollIntoView({ behavior: "smooth" });
                }}
                disabled={isLoading}
                className="group relative text-left p-4 bg-white border-2 border-bauhaus-black shadow-[3px_3px_0px_0px_#121212] sm:shadow-[4px_4px_0px_0px_#121212] hover:-translate-y-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 transition-all duration-200"
              >
                <CardDecoration color={shapeColors[i % 3]} shape={shapes[i % 3]} />
                <span className="block font-bold uppercase tracking-wider text-sm">
                  {ex.name}
                </span>
                <span className="block mt-1 text-xs font-medium text-bauhaus-black/50 uppercase tracking-wider">
                  {ex.expectedRisk} Risk
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Screening Section ─── */}
      <section id="screen" className="border-b-4 border-bauhaus-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Section header */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-bauhaus-red flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter">
                  Analyze Sequence
                </h2>
                <p className="text-sm font-medium text-bauhaus-black/50 uppercase tracking-wider">
                  Paste FASTA or plain text, max 1 KB
                </p>
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-3">
              <label
                htmlFor="sequence"
                className="block text-xs font-bold uppercase tracking-widest text-bauhaus-black/60"
              >
                Sequence Input
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
                className="w-full bg-white border-2 sm:border-4 border-bauhaus-black px-4 py-3 text-sm font-mono font-medium placeholder-bauhaus-black/30 focus:outline-none focus:ring-2 focus:ring-bauhaus-blue focus:ring-offset-2 resize-y shadow-[4px_4px_0px_0px_#121212] sm:shadow-[6px_6px_0px_0px_#121212]"
                disabled={isLoading}
              />
              {validationError && (
                <div className="flex items-center gap-2 p-3 bg-bauhaus-red text-white border-2 border-bauhaus-black">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p className="text-sm font-bold">{validationError}</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || !sequence.trim()}
              className="w-full py-4 bg-bauhaus-blue text-white font-bold uppercase tracking-wider text-base border-2 sm:border-4 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] sm:shadow-[8px_8px_0px_0px_#121212] hover:bg-bauhaus-blue/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? "Analyzing..." : "Screen Sequence"}
            </button>

            {/* ─── Results ─── */}
            <div className="space-y-6">
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
                <div className={`relative bg-white border-2 sm:border-4 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] sm:shadow-[8px_8px_0px_0px_#121212] ${riskLevel ? riskBorderColors[riskLevel] : ""}`}>
                  <CardDecoration color="bg-bauhaus-red" shape="triangle" />
                  {/* Header bar */}
                  <div className="p-4 sm:p-6 border-b-2 sm:border-b-4 border-bauhaus-black flex items-center gap-4">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wider text-sm">
                      Risk Assessment
                    </span>
                    {riskLevel && (
                      <span
                        className={`px-4 py-1 text-xs font-bold uppercase tracking-widest border-2 border-bauhaus-black ${riskColors[riskLevel] ?? "bg-bauhaus-muted"}`}
                      >
                        {riskLevel} RISK
                      </span>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-4 sm:p-6">
                    <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                      {assistantMessage.content}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-bauhaus-black text-white border-t-4 border-bauhaus-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BauhausLogo />
            <span className="text-lg font-black uppercase tracking-tighter">
              Pane
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 text-center sm:text-right">
            Phase 1 — BLAST + LLM Assessment
            <br />
            US Select Agents & Toxins &middot; Dual-Use Gene Catalog
          </p>
        </div>
      </footer>
    </main>
  );
}
