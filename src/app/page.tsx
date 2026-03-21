"use client";

import { useState } from "react";
import { exampleSequences } from "@/lib/examples";
import {
  mockReports,
  type SequenceReport,
  type DomainAnalysis,
} from "@/lib/mock-reports";
import { LiveScreening } from "@/components/live-screening";
import {
  Circle,
  Square,
  Triangle,
  ArrowRight,
  AlertTriangle,
  Shield,
  ChevronDown,
  Search,
  Layers,
  FileText,
  X,
} from "lucide-react";

/* ─── Color maps ─── */

const domainRiskColors: Record<string, string> = {
  LOW: "bg-bauhaus-blue text-white",
  MEDIUM: "bg-bauhaus-yellow text-bauhaus-black",
  HIGH: "bg-bauhaus-red text-white",
  CRITICAL: "bg-bauhaus-black text-white",
};

const domainRiskBorder: Record<string, string> = {
  LOW: "border-l-bauhaus-blue",
  MEDIUM: "border-l-bauhaus-yellow",
  HIGH: "border-l-bauhaus-red",
  CRITICAL: "border-l-bauhaus-black",
};

const overallRiskColors: Record<string, string> = {
  PASS: "bg-bauhaus-blue text-white",
  FLAG: "bg-bauhaus-yellow text-bauhaus-black",
  REJECT: "bg-bauhaus-red text-white",
};

const domainBarColors: Record<string, string> = {
  LOW: "bg-bauhaus-blue",
  MEDIUM: "bg-bauhaus-yellow",
  HIGH: "bg-bauhaus-red",
  CRITICAL: "bg-bauhaus-black",
};

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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-48 sm:h-48 rounded-full border-4 border-white/30" />
      <div className="absolute top-[15%] left-[20%] w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-bauhaus-red opacity-80" />
      <div className="absolute bottom-[15%] right-[15%] w-20 h-20 sm:w-28 sm:h-28 bg-bauhaus-yellow opacity-70 rotate-45" />
      <div className="absolute top-[20%] right-[25%] w-10 h-10 sm:w-14 sm:h-14 bg-white opacity-30" />
      <div
        className="absolute bottom-[25%] left-[15%] w-14 h-14 sm:w-20 sm:h-20 bg-white opacity-40"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      />
    </div>
  );
}

function CardDecoration({
  color,
  shape,
}: {
  color: string;
  shape: "circle" | "square" | "triangle";
}) {
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

/* ─── Sequence Map: visual bar showing domains ─── */

function SequenceMap({ report }: { report: SequenceReport }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Layers className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/60">
          Domain Architecture — {report.sequenceLength} aa
        </span>
      </div>
      <div className="relative h-10 border-2 border-bauhaus-black bg-bauhaus-muted/50 flex overflow-hidden">
        {report.domains.map((d) => {
          const [startStr, endStr] = d.range.replace("–", "-").split("-");
          const start = parseInt(startStr);
          const end = parseInt(endStr);
          const widthPct = ((end - start + 1) / report.sequenceLength) * 100;
          const leftPct = ((start - 1) / report.sequenceLength) * 100;
          return (
            <div
              key={d.domainId}
              className={`absolute top-0 bottom-0 ${domainBarColors[d.riskLevel]} border-r-2 border-bauhaus-black flex items-center justify-center`}
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider ${d.riskLevel === "MEDIUM" ? "text-bauhaus-black/70" : "text-white/90"} truncate px-1`}>
                {d.domainId}
              </span>
            </div>
          );
        })}
      </div>
      {/* Domain legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {report.domains.map((d) => (
          <div key={d.domainId} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 ${domainBarColors[d.riskLevel]} border border-bauhaus-black`} />
            <span className="text-xs font-medium text-bauhaus-black/70">
              {d.domainId}: {d.domainName} ({d.range})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Analysis method section inside domain card ─── */

function AnalysisSection({
  title,
  icon,
  children,
  threatMatch,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  threatMatch?: boolean;
}) {
  return (
    <div className={`p-3 sm:p-4 ${threatMatch ? "bg-bauhaus-red/5" : "bg-bauhaus-bg/50"}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">
          {title}
        </span>
        {threatMatch && (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-bauhaus-red text-white border border-bauhaus-black">
            THREAT MATCH
          </span>
        )}
      </div>
      <div className="text-sm font-medium leading-relaxed text-bauhaus-black/80">
        {children}
      </div>
    </div>
  );
}

/* ─── Domain Analysis Card ─── */

function DomainCard({ domain, index }: { domain: DomainAnalysis; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const shapes = ["circle", "square", "triangle"] as const;
  const shapeColors = ["bg-bauhaus-red", "bg-bauhaus-blue", "bg-bauhaus-yellow"];

  return (
    <div className="relative">
      {/* Connector line from sequence map */}
      <div className="absolute -top-6 left-8 w-0.5 h-6 bg-bauhaus-black/20" />

      <div
        className={`relative bg-white border-2 sm:border-4 border-bauhaus-black shadow-[3px_3px_0px_0px_#121212] sm:shadow-[6px_6px_0px_0px_#121212] border-l-8 ${domainRiskBorder[domain.riskLevel]} transition-transform duration-200 ease-out`}
      >
        <CardDecoration
          color={shapeColors[index % 3]}
          shape={shapes[index % 3]}
        />

        {/* Domain header — always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-bauhaus-black text-white flex items-center justify-center font-black text-sm shrink-0">
              {domain.domainId}
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-sm sm:text-base truncate">
                {domain.domainName}
              </span>
              <span className="block text-xs font-medium text-bauhaus-black/50 mt-0.5">
                {domain.interproId} &middot; Residues {domain.range}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span
              className={`px-3 py-1 text-xs font-bold uppercase tracking-widest border-2 border-bauhaus-black ${domainRiskColors[domain.riskLevel]}`}
            >
              {domain.riskLevel}
            </span>
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {/* Risk summary — always visible */}
        <div className="px-4 sm:px-5 pb-4 -mt-1">
          <p className="text-sm font-medium text-bauhaus-black/60 leading-relaxed">
            {domain.riskSummary}
          </p>
        </div>

        {/* Expanded analysis details */}
        {expanded && (
          <div className="border-t-2 sm:border-t-4 border-bauhaus-black divide-y-2 divide-bauhaus-black">
            {/* DIAMOND */}
            <AnalysisSection
              title="Diamond — Sequence Similarity"
              icon={<Search className="w-4 h-4" />}
              threatMatch={domain.diamond.threatMatch}
            >
              <div className="space-y-2">
                <p>
                  <strong>Top Hit:</strong> {domain.diamond.topHit}
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-bauhaus-black/60">
                  <span>
                    Identity:{" "}
                    <strong className="text-bauhaus-black">
                      {domain.diamond.identity}%
                    </strong>
                  </span>
                  <span>
                    Coverage:{" "}
                    <strong className="text-bauhaus-black">
                      {domain.diamond.coveragePercent}%
                    </strong>
                  </span>
                  <span>
                    E-value:{" "}
                    <strong className="text-bauhaus-black">
                      {domain.diamond.evalue.toExponential(1)}
                    </strong>
                  </span>
                  <span>
                    Organism:{" "}
                    <strong className="text-bauhaus-black">
                      {domain.diamond.organism}
                    </strong>
                  </span>
                </div>
                <p className="text-xs text-bauhaus-black/60 leading-relaxed">
                  {domain.diamond.details}
                </p>
              </div>
            </AnalysisSection>

            {/* ESMfold */}
            <AnalysisSection
              title="ESMfold — Structure Prediction"
              icon={<Layers className="w-4 h-4" />}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-bauhaus-black/60">
                    pLDDT:{" "}
                    <strong className="text-bauhaus-black">
                      {domain.esmfold.pLDDT}
                    </strong>
                  </span>
                  {/* Confidence bar */}
                  <div className="flex-1 h-2 bg-bauhaus-muted max-w-[200px]">
                    <div
                      className={`h-full ${domain.esmfold.pLDDT > 70 ? "bg-bauhaus-blue" : "bg-bauhaus-yellow"}`}
                      style={{ width: `${domain.esmfold.pLDDT}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-bauhaus-black/60 leading-relaxed">
                  {domain.esmfold.structuralNotes}
                </p>
              </div>
            </AnalysisSection>

            {/* FoldSeek */}
            <AnalysisSection
              title="FoldSeek — Structural Similarity"
              icon={<FileText className="w-4 h-4" />}
              threatMatch={domain.foldseek.threatMatch}
            >
              <div className="space-y-2">
                <p>
                  <strong>Top Hit:</strong> {domain.foldseek.topHit}
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-bauhaus-black/60">
                  {domain.foldseek.pdbId && (
                    <span>
                      PDB:{" "}
                      <strong className="text-bauhaus-black">
                        {domain.foldseek.pdbId}
                      </strong>
                    </span>
                  )}
                  <span>
                    TM-score:{" "}
                    <strong className="text-bauhaus-black">
                      {domain.foldseek.tmScore.toFixed(2)}
                    </strong>
                  </span>
                  {domain.foldseek.organism !== "N/A" && (
                    <span>
                      Organism:{" "}
                      <strong className="text-bauhaus-black">
                        {domain.foldseek.organism}
                      </strong>
                    </span>
                  )}
                </div>
                <p className="text-xs text-bauhaus-black/60 leading-relaxed">
                  {domain.foldseek.details}
                </p>
              </div>
            </AnalysisSection>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Unified Assessment ─── */

function UnifiedAssessment({ report }: { report: SequenceReport }) {
  const { unified } = report;
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  return (
    <div className="relative bg-white border-2 sm:border-4 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] sm:shadow-[8px_8px_0px_0px_#121212]">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b-2 sm:border-b-4 border-bauhaus-black flex flex-wrap items-center gap-3">
        <Shield className="w-5 h-5" />
        <span className="font-bold uppercase tracking-wider text-sm">
          Unified Risk Assessment
        </span>
        <span
          className={`px-4 py-1 text-xs font-bold uppercase tracking-widest border-2 border-bauhaus-black ${overallRiskColors[unified.overallRisk]}`}
        >
          {unified.overallRisk}
        </span>
        <span className="text-xs font-medium text-bauhaus-black/50 ml-auto">
          Confidence: {(unified.confidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* Summary */}
      <div className="p-4 sm:p-6 space-y-4">
        <p className="text-sm font-medium leading-relaxed">
          {unified.summary}
        </p>

        {/* Synergistic effects */}
        {unified.synergisticEffects && (
          <div className="bg-bauhaus-yellow/20 border-2 border-bauhaus-black p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Synergistic Effects Detected
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed whitespace-pre-line">
              {unified.synergisticEffects}
            </p>
          </div>
        )}

        {/* Flags */}
        {unified.flags.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/60">
              Flags
            </span>
            <div className="flex flex-wrap gap-2">
              {unified.flags.map((flag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-bauhaus-bg border-2 border-bauhaus-black"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className={`p-4 border-2 border-bauhaus-black ${unified.overallRisk === "REJECT" ? "bg-bauhaus-red/10" : unified.overallRisk === "FLAG" ? "bg-bauhaus-yellow/10" : "bg-bauhaus-blue/10"}`}>
          <span className="block text-xs font-bold uppercase tracking-widest text-bauhaus-black/60 mb-2">
            Recommendation
          </span>
          <p className="text-sm font-bold leading-relaxed">
            {unified.recommendation}
          </p>
        </div>

        {/* Action buttons */}
        {unified.overallRisk === "FLAG" && (
          <div className="pt-2">
            {actionTaken === "forwarded" ? (
              <div className="flex items-center gap-3 p-4 bg-bauhaus-yellow/20 border-2 border-bauhaus-black">
                <AlertTriangle className="w-5 h-5 text-bauhaus-black" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  Forwarded to expert review panel
                </span>
              </div>
            ) : (
              <button
                onClick={() => setActionTaken("forwarded")}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-bauhaus-yellow text-bauhaus-black font-bold uppercase tracking-wider text-sm border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] hover:bg-bauhaus-yellow/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
              >
                <ArrowRight className="w-5 h-5" />
                Forward to Expert Review
              </button>
            )}
          </div>
        )}

        {unified.overallRisk === "PASS" && (
          <div className="pt-2">
            {actionTaken === "approved" ? (
              <div className="flex items-center gap-3 p-4 bg-green-100 border-2 border-bauhaus-black">
                <Shield className="w-5 h-5 text-green-700" />
                <span className="text-sm font-bold uppercase tracking-wider text-green-800">
                  Synthesis approved — order cleared
                </span>
              </div>
            ) : (
              <button
                onClick={() => setActionTaken("approved")}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white font-bold uppercase tracking-wider text-sm border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] hover:bg-green-600/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
              >
                <Shield className="w-5 h-5" />
                Approve Synthesis
              </button>
            )}
          </div>
        )}

        {unified.overallRisk === "REJECT" && (
          <div className="pt-2">
            <div className="flex items-center gap-3 p-4 bg-bauhaus-red/10 border-2 border-bauhaus-black">
              <X className="w-5 h-5 text-bauhaus-red" />
              <span className="text-sm font-bold uppercase tracking-wider text-bauhaus-red">
                Synthesis blocked — order will not proceed
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Full Report View ─── */

function ReportView({
  report,
  onClose,
}: {
  report: SequenceReport;
  onClose: () => void;
}) {
  return (
    <section className="border-b-4 border-bauhaus-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Report header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-bauhaus-black flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter">
                  {report.orderId}
                </h2>
                <p className="text-sm font-medium text-bauhaus-black/50 uppercase tracking-wider">
                  Screening Report — {report.domainCount} domain
                  {report.domainCount !== 1 ? "s" : ""} &middot;{" "}
                  {report.sequenceLength} aa
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white border-2 border-bauhaus-black shadow-[2px_2px_0px_0px_#121212] hover:bg-bauhaus-muted active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sequence domain map */}
          <div className="bg-white border-2 sm:border-4 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] sm:shadow-[6px_6px_0px_0px_#121212] p-4 sm:p-6">
            <SequenceMap report={report} />
          </div>

          {/* Branch connector */}
          <div className="flex justify-center">
            <div className="w-0.5 h-6 bg-bauhaus-black/20" />
          </div>

          {/* Domain heading */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-0.5 bg-bauhaus-black/10" />
            <span className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40">
              Per-Domain Analysis
            </span>
            <div className="flex-1 h-0.5 bg-bauhaus-black/10" />
          </div>

          {/* Domain cards */}
          <div className="space-y-10">
            {report.domains.map((domain, i) => (
              <DomainCard key={domain.domainId} domain={domain} index={i} />
            ))}
          </div>

          {/* Branch connector to unified */}
          <div className="flex flex-col items-center gap-0">
            <div className="w-0.5 h-8 bg-bauhaus-black/20" />
            <div className="flex items-center gap-3">
              <div className="flex-1 h-0.5 bg-bauhaus-black/10" />
              <span className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40">
                Integrated Assessment
              </span>
              <div className="flex-1 h-0.5 bg-bauhaus-black/10" />
            </div>
            <div className="w-0.5 h-4 bg-bauhaus-black/20" />
          </div>

          {/* Unified report */}
          <UnifiedAssessment report={report} />
        </div>
      </div>
    </section>
  );
}

/* ─── Main Page ─── */

export default function Home() {
  const [activeReport, setActiveReport] = useState<SequenceReport | null>(null);

  const shapes = ["circle", "square", "triangle"] as const;
  const shapeColors = [
    "bg-bauhaus-red",
    "bg-bauhaus-blue",
    "bg-bauhaus-yellow",
  ];

  const loadReport = (orderId: string) => {
    const report = mockReports.find((r) => r.orderId === orderId);
    if (report) {
      setActiveReport(report);
      setTimeout(() => {
        document
          .getElementById("report")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* ─── Navigation ─── */}
      <nav className="border-b-4 border-bauhaus-black bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <BauhausLogo />
            <span className="text-xl sm:text-2xl font-black uppercase tracking-tighter">
              Lucid
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
          <div className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
              Screen
              <br />
              <span className="text-bauhaus-red">Sequences</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl font-medium text-bauhaus-black/70 max-w-lg leading-relaxed">
              Biosecurity screening — InterPro domain analysis, Diamond sequence
              search, ESMfold structure prediction, and FoldSeek structural
              similarity. Cross-referenced against known threat domains.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#screen"
                className="inline-flex items-center gap-2 px-6 py-3 bg-bauhaus-red text-white font-bold uppercase tracking-wider text-sm border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] hover:bg-bauhaus-red/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
              >
                Screen a Sequence
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#orders"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-bauhaus-black font-bold uppercase tracking-wider text-sm border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] hover:bg-bauhaus-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
              >
                View Sample Orders
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="hidden lg:block bg-bauhaus-blue relative overflow-hidden border-l-4 border-bauhaus-black">
            <GeometricComposition />
          </div>
        </div>
      </section>

      {/* ─── Live Screening ─── */}
      <section id="screen" className="border-b-4 border-bauhaus-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-bauhaus-red flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">
                Screen a Sequence
              </h2>
            </div>
            <LiveScreening />
          </div>
        </div>
      </section>

      {/* ─── Sample Orders ─── */}
      <section
        id="orders"
        className="border-b-4 border-bauhaus-black bg-bauhaus-yellow"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/60 mb-4">
            Sample Orders — Select to view screening report
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exampleSequences.map((ex, i) => {
              const report = mockReports.find((r) => r.orderId === ex.name);
              const isActive = activeReport?.orderId === ex.name;
              return (
                <button
                  key={ex.name}
                  onClick={() => loadReport(ex.name)}
                  className={`group relative text-left p-4 bg-white border-2 border-bauhaus-black shadow-[3px_3px_0px_0px_#121212] sm:shadow-[4px_4px_0px_0px_#121212] hover:-translate-y-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200 ${isActive ? "ring-2 ring-bauhaus-black ring-offset-2" : ""}`}
                >
                  <CardDecoration
                    color={shapeColors[i % 3]}
                    shape={shapes[i % 3]}
                  />
                  <span className="block font-bold uppercase tracking-wider text-sm">
                    {ex.name}
                  </span>
                  <span className="block mt-1 text-xs font-medium text-bauhaus-black/50 tracking-wider">
                    {ex.description}
                  </span>
                  {report && (
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border border-bauhaus-black ${overallRiskColors[report.unified.overallRisk]}`}
                    >
                      {report.unified.overallRisk}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Report View ─── */}
      {activeReport && (
        <div id="report">
          <ReportView
            report={activeReport}
            onClose={() => setActiveReport(null)}
          />
        </div>
      )}

      {/* ─── Footer ─── */}
      <footer className="bg-bauhaus-black text-white border-t-4 border-bauhaus-black mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BauhausLogo />
            <span className="text-lg font-black uppercase tracking-tighter">
              Lucid
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 text-center sm:text-right">
            Diamond + ESMfold + FoldSeek + LLM Assessment
            <br />
            US Select Agents & Toxins &middot; Dual-Use Gene Catalog
          </p>
        </div>
      </footer>
    </main>
  );
}
