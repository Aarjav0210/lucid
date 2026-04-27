"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, AlertTriangle, Loader2 } from "lucide-react";
import type { DomainReport } from "@/lib/report-types";
import { RiskBadge } from "./risk-badge";
import { PipelineStep } from "./pipeline-step";
import { StructureViewer } from "./structure-viewer";

function AlignmentView({
  qseq,
  sseq,
  isThreat,
}: {
  qseq: string;
  sseq: string;
  isThreat: boolean;
}) {
  const matchColor = isThreat
    ? "color-mix(in oklch, var(--lc-danger) 75%, transparent)"
    : "color-mix(in oklch, var(--lc-accent) 75%, transparent)";
  const mismatchColor = "color-mix(in oklch, var(--lc-ink) 12%, transparent)";

  function ResidueRow({
    seq,
    otherSeq,
    label,
  }: {
    seq: string;
    otherSeq: string;
    label: string;
  }) {
    return (
      <div className="flex items-start gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)] w-9 shrink-0 pt-0.5">
          {label}
        </span>
        <div className="flex flex-wrap gap-px flex-1 min-w-0">
          {seq.split("").map((aa, j) => {
            const isGap = aa === "-";
            const isMatch = !isGap && aa === otherSeq[j];
            return (
              <div
                key={j}
                className="w-[4px] h-3 shrink-0"
                style={{
                  backgroundColor: isGap
                    ? "transparent"
                    : isMatch
                    ? matchColor
                    : mismatchColor,
                  border: "1px solid color-mix(in oklch, var(--lc-ink) 6%, transparent)",
                }}
                title={`${aa} (pos ${j + 1})`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[color:var(--lc-rule)] bg-[color:var(--lc-bg-2)] p-3 space-y-3 overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)]">
          Sequence alignment
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--lc-ink-3)]">
          {qseq.length} positions
        </span>
      </div>
      <div className="space-y-2">
        <ResidueRow seq={qseq} otherSeq={sseq} label="QRY" />
        <ResidueRow seq={sseq} otherSeq={qseq} label="REF" />
      </div>
      <div className="flex items-center gap-4 pt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3" style={{ backgroundColor: matchColor }} />
          Match
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3" style={{ backgroundColor: mismatchColor }} />
          Mismatch
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 border border-dashed border-[color:var(--lc-ink-3)]/40"
            style={{ backgroundColor: "var(--lc-bg)" }}
          />
          Gap
        </span>
      </div>
    </div>
  );
}

interface DomainCardProps {
  report: DomainReport;
  index: number;
}

export function DomainCard({ report, index }: DomainCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const hasStructure =
    report.structure?.status === "completed" &&
    (report.structure.pdbString || report.structure.pdbUrl);
  const isLoading = !report.summary;

  const [revealed, setRevealed] = useState(!isLoading);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !revealed) {
      requestAnimationFrame(() => setRevealed(true));
    }
  }, [isLoading, revealed]);

  return (
    <div
      className="bg-[color:var(--lc-bg)] border border-[color:var(--lc-rule)] relative"
      style={{
        // Soft accent rail down the left edge.
        boxShadow: "inset 3px 0 0 0 color-mix(in oklch, var(--lc-accent) 70%, transparent)",
      }}
    >
      {/* ── Domain header ── */}
      <button
        onClick={() => !isLoading && setExpanded(!expanded)}
        className={`w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left transition-colors ${
          isLoading
            ? ""
            : "hover:bg-[color:var(--lc-bg-2)]"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-[color:var(--lc-accent)] animate-spin shrink-0" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-[color:var(--lc-ink-3)] transition-transform duration-200 shrink-0 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          )}
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)] shrink-0">
            Domain {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-[15px] text-[color:var(--lc-ink)] truncate">
            {report.domain.annotation}
          </span>
          <span className="font-mono text-[11px] tracking-[0.04em] text-[color:var(--lc-ink-3)] shrink-0">
            {report.domain.start}–{report.domain.end} · {report.domain.sequence.length} aa
          </span>
        </div>
        {isLoading ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)] shrink-0">
            Analyzing…
          </span>
        ) : (
          report.summary && (
            <span className="shrink-0">
              <RiskBadge level={report.summary.riskLevel} size="sm" />
            </span>
          )
        )}
      </button>

      {/* ── Body ── */}
      {!isLoading && expanded && (
        <div
          ref={contentRef}
          className={`border-t border-[color:var(--lc-rule)] transition-all duration-500 ease-out overflow-hidden ${
            revealed ? "opacity-100 max-h-[2400px]" : "opacity-0 max-h-0"
          }`}
        >
          <div className={hasStructure ? "flex flex-col md:flex-row" : ""}>
            <div
              className={
                hasStructure
                  ? "flex-1 md:border-r md:border-[color:var(--lc-rule)] min-w-0"
                  : ""
              }
            >
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
                      const accentColor = isThreat
                        ? "var(--lc-danger)"
                        : "var(--lc-accent)";
                      return (
                        <div key={`${hit.accession}-${i}`} className="space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[13.5px] text-[color:var(--lc-ink)]">
                              {hit.title}
                            </span>
                            <div className="flex items-center gap-3">
                              <span
                                className="font-mono text-[11px] uppercase tracking-[0.12em]"
                                style={{ color: accentColor }}
                              >
                                {hit.identity.toFixed(1)}% identity
                              </span>
                              {isThreat && (
                                <span
                                  className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.12em]"
                                  style={{ color: "var(--lc-danger)" }}
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  {hit.threatFlags.join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                          {hit.qseq && hit.sseq && (
                            <AlignmentView
                              qseq={hit.qseq}
                              sseq={hit.sseq}
                              isThreat={isThreat}
                            />
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
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                    {report.foldseek.hits.map((hit, i) => (
                      <div
                        key={`fs-${i}`}
                        className="flex items-start justify-between gap-3 py-1 border-b border-[color:var(--lc-rule)] last:border-b-0"
                      >
                        <div className="min-w-0">
                          <span className="text-[color:var(--lc-ink)]">
                            {hit.proteinName}
                          </span>
                          <span className="ml-2 text-[color:var(--lc-ink-3)]">
                            {hit.organism}
                          </span>
                          {hit.pdbId && (
                            <span className="ml-1 font-mono text-[11px] text-[color:var(--lc-ink-3)]">
                              (PDB: {hit.pdbId})
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-[color:var(--lc-ink-2)]">
                            P={hit.probability.toFixed(2)}
                          </span>
                          {hit.flagged && (
                            <span
                              className="flex items-center gap-1 uppercase tracking-[0.1em]"
                              style={{ color: "var(--lc-danger)" }}
                            >
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

            {hasStructure && report.structure && (
              <div className="w-full md:w-[340px] shrink-0 p-3 flex flex-col">
                <StructureViewer
                  pdbString={report.structure.pdbString}
                  pdbUrl={report.structure.pdbUrl}
                  plddtMean={report.structure.plddtMean}
                  height={250}
                />
              </div>
            )}
          </div>

          {/* ── Domain summary ── */}
          {report.summary && (
            <div className="border-t border-[color:var(--lc-rule)]">
              <button
                onClick={() => setSummaryExpanded(!summaryExpanded)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-[color:var(--lc-bg-2)] transition-colors"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)]">
                    Domain assessment
                  </span>
                  <RiskBadge level={report.summary.riskLevel} size="sm" showLabel={false} />
                  <span className="font-mono text-[11px] tracking-[0.06em] text-[color:var(--lc-ink-3)]">
                    {(report.summary.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[color:var(--lc-ink-3)] transition-transform duration-200 ${
                    summaryExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              {summaryExpanded && (
                <div className="px-5 pb-5 space-y-3 text-[14px] leading-relaxed text-[color:var(--lc-ink-2)]">
                  <p>{report.summary.reasoning}</p>
                  {report.summary.flags.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)]">
                        Risk keywords
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {report.summary.flags.map((flag, i) => {
                          const [kw, countStr] = flag.includes(":")
                            ? flag.split(":")
                            : [flag, "1"];
                          const count = parseInt(countStr);
                          return (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] rounded-full border"
                              style={{
                                color: "var(--lc-danger)",
                                borderColor:
                                  "color-mix(in oklch, var(--lc-danger) 35%, transparent)",
                                backgroundColor: "var(--lc-danger-soft)",
                              }}
                            >
                              {kw}
                              {count > 1 && <span className="opacity-60">×{count}</span>}
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
