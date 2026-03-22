"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, AlertTriangle, Loader2 } from "lucide-react";
import type { DomainReport } from "@/lib/report-types";
import { RiskBadge } from "./risk-badge";
import { PipelineStep } from "./pipeline-step";
import { StructureViewer } from "./structure-viewer";

function KeywordTags({ keywords }: { keywords: string[] }) {
  if (keywords.length === 0) return null;
  const counts = new Map<string, number>();
  for (const kw of keywords) {
    counts.set(kw, (counts.get(kw) ?? 0) + 1);
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {[...counts.entries()].map(([kw, count]) => (
        <span
          key={kw}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-bauhaus-red/10 text-bauhaus-red border border-bauhaus-red/20"
        >
          {kw}
          {count > 1 && (
            <span className="text-bauhaus-red/60">x{count}</span>
          )}
        </span>
      ))}
    </div>
  );
}

function AlignmentView({ qseq, sseq, isThreat }: { qseq: string; sseq: string; isThreat: boolean }) {
  const matchColor = isThreat ? "bg-bauhaus-red" : "bg-bauhaus-blue";
  const mismatchColor = "bg-bauhaus-black/10";
  const gapColor = "bg-transparent";

  // Render a row of residue blocks that flex-shrinks within its container
  function ResidueRow({ seq, otherSeq, label }: { seq: string; otherSeq: string; label: string }) {
    return (
      <div className="flex items-start gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-bauhaus-black/30 w-10 shrink-0 pt-0.5">
          {label}
        </span>
        <div className="flex flex-wrap gap-px flex-1 min-w-0">
          {seq.split("").map((aa, j) => {
            const isGap = aa === "-";
            const isMatch = !isGap && aa === otherSeq[j];
            return (
              <div
                key={j}
                className={`w-[4px] h-3 shrink-0 ${isGap ? gapColor : isMatch ? matchColor : mismatchColor} border border-bauhaus-black/5`}
                title={`${aa} (pos ${j + 1})`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-bauhaus-black bg-bauhaus-muted/20 p-3 space-y-3 overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-bauhaus-black/40">
          Sequence Alignment
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-bauhaus-black/30">
          {qseq.length} positions
        </span>
      </div>
      <div className="space-y-2">
        <ResidueRow seq={qseq} otherSeq={sseq} label="QRY" />
        <ResidueRow seq={sseq} otherSeq={qseq} label="REF" />
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 pt-1">
        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-bauhaus-black/30">
          <span className={`w-3 h-3 ${matchColor} border border-bauhaus-black/10`} /> Match
        </span>
        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-bauhaus-black/30">
          <span className={`w-3 h-3 ${mismatchColor} border border-bauhaus-black/10`} /> Mismatch
        </span>
        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-bauhaus-black/30">
          <span className="w-3 h-3 bg-white border border-dashed border-bauhaus-black/20" /> Gap
        </span>
      </div>
    </div>
  );
}

const DOMAIN_BORDER = "border-l-bauhaus-blue";

interface DomainCardProps {
  report: DomainReport;
  index: number;
}

export function DomainCard({ report, index }: DomainCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const borderColor = DOMAIN_BORDER;
  const hasStructure = report.structure?.status === "completed" && report.structure.pdbString;
  const isLoading = !report.summary;

  // Track when loading finishes to trigger reveal animation
  const [revealed, setRevealed] = useState(!isLoading);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !revealed) {
      // Small delay so the browser can measure the content height
      requestAnimationFrame(() => setRevealed(true));
    }
  }, [isLoading, revealed]);

  return (
    <div
      className={`bg-white border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] border-l-[6px] ${borderColor}`}
    >
      {/* Domain header */}
      <button
        onClick={() => !isLoading && setExpanded(!expanded)}
        className={`w-full px-4 py-3 flex items-center justify-between ${
          isLoading ? "" : "border-b border-bauhaus-black/10 hover:bg-bauhaus-muted/30"
        } transition-colors`}
      >
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-bauhaus-blue animate-spin" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-bauhaus-black/30 transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          )}
          <span className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40">
            Domain {index + 1}
          </span>
          <span className="text-sm font-bold">
            {report.domain.annotation}
          </span>
          <span className="text-xs text-bauhaus-black/40 font-medium">
            {report.domain.start}–{report.domain.end} ({report.domain.sequence.length} AA)
          </span>
        </div>
        {isLoading ? (
          <span className="text-[10px] font-bold uppercase tracking-widest text-bauhaus-black/30">
            Analyzing...
          </span>
        ) : (
          report.summary && <RiskBadge level={report.summary.riskLevel} size="sm" />
        )}
      </button>

      {/* Content: hidden while loading, animated reveal when ready */}
      {!isLoading && expanded && (
        <div
          ref={contentRef}
          className={`transition-all duration-500 ease-out overflow-hidden ${
            revealed ? "opacity-100 max-h-[2000px]" : "opacity-0 max-h-0"
          }`}
        >
      <div className={hasStructure ? "flex flex-col md:flex-row" : ""}>
        {/* Left: pipeline steps */}
        <div className={hasStructure ? "flex-1 md:border-r border-bauhaus-black/10" : ""}>
          <PipelineStep
            label="Diamond"
            status={report.progress.diamond}
            subtitle={
              report.diamond
                ? `${report.diamond.hits.length} hit(s) · ${report.diamond.durationMs}ms`
                : undefined
            }
          >
            {report.diamond && report.diamond.hits.length > 0 && (
              <div className="space-y-4">
                {report.diamond.hits.slice(0, 5).map((hit, i) => {
                  const isThreat = hit.threatFlags.length > 0;
                  const textColor = isThreat ? "text-bauhaus-red" : "text-bauhaus-blue";
                  return (
                    <div key={`${hit.accession}-${i}`} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">{hit.title}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase tracking-wider ${textColor}`}>
                            {hit.identity.toFixed(1)}% Identity
                          </span>
                          {isThreat && (
                            <span className="flex items-center gap-1 text-bauhaus-red font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              {hit.threatFlags.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Per-residue alignment */}
                      {hit.qseq && hit.sseq && (
                        <AlignmentView qseq={hit.qseq} sseq={hit.sseq} isThreat={isThreat} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </PipelineStep>

          <PipelineStep
            label="ESMFold"
            status={report.progress.structure}
            subtitle={
              report.structure
                ? `pLDDT ${report.structure.plddtMean.toFixed(1)} · ${report.structure.confidenceCategory}`
                : undefined
            }
          />

          <PipelineStep
            label="Foldseek"
            status={report.progress.foldseek}
            subtitle={
              report.foldseek
                ? `${report.foldseek.hits.length} hit(s) · ${report.foldseek.durationMs}ms`
                : undefined
            }
          >
            {report.foldseek && report.foldseek.hits.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-3">
                {report.foldseek.hits.map((hit, i) => (
                  <div key={`fs-${i}`} className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold">{hit.proteinName}</span>
                      <span className="text-bauhaus-black/40 ml-2">{hit.organism}</span>
                      {hit.pdbId && (
                        <span className="text-bauhaus-black/30 ml-1">
                          (PDB: {hit.pdbId})
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span>P={hit.probability.toFixed(2)}</span>
                      {hit.flagged && (
                        <span className="flex items-center gap-1 text-bauhaus-red font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          {hit.riskKeywords.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PipelineStep>
        </div>

        {/* Right: 3D structure viewer */}
        {hasStructure && report.structure && (
          <div className="w-full md:w-[350px] shrink-0 p-3 flex flex-col">
            <StructureViewer
              pdbString={report.structure.pdbString!}
              plddtMean={report.structure.plddtMean}
              height={250}
            />
          </div>
        )}
      </div>

      {/* Domain summary — always full width below */}
      {report.summary && (
        <div className="border-t-2 border-bauhaus-black">
          <button
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-bauhaus-muted/50"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-widest">
                Domain Assessment
              </span>
              <RiskBadge level={report.summary.riskLevel} size="sm" showLabel={false} />
              <span className="text-xs text-bauhaus-black/40 font-medium">
                {(report.summary.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-bauhaus-black/30 transition-transform duration-200 ${
                summaryExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
          {summaryExpanded && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-sm font-medium leading-relaxed">
                {report.summary.reasoning}
              </p>
              {report.summary.flags.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-bauhaus-black/40">
                    Risk Keywords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.summary.flags.map((flag, i) => {
                      const [kw, countStr] = flag.includes(":") ? flag.split(":") : [flag, "1"];
                      const count = parseInt(countStr);
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-bauhaus-red/10 text-bauhaus-red border border-bauhaus-red/20"
                        >
                          {kw}
                          {count > 1 && (
                            <span className="text-bauhaus-red/60">x{count}</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
}
