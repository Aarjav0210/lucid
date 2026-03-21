"use client";

import { useState } from "react";
import { ChevronDown, AlertTriangle } from "lucide-react";
import type { DomainReport } from "@/lib/report-types";
import { RiskBadge } from "./risk-badge";
import { PipelineStep } from "./pipeline-step";

const DOMAIN_COLORS = [
  "border-l-bauhaus-red",
  "border-l-bauhaus-blue",
  "border-l-bauhaus-yellow",
  "border-l-[#8B5CF6]",
  "border-l-[#059669]",
  "border-l-[#EA580C]",
];

interface DomainCardProps {
  report: DomainReport;
  index: number;
}

export function DomainCard({ report, index }: DomainCardProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const borderColor = DOMAIN_COLORS[index % DOMAIN_COLORS.length];

  return (
    <div
      className={`bg-white border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] border-l-[6px] ${borderColor}`}
    >
      {/* Domain header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-bauhaus-black/10">
        <div className="flex items-center gap-3">
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
        {report.summary && (
          <RiskBadge level={report.summary.riskLevel} size="sm" />
        )}
      </div>

      {/* Pipeline steps */}
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
          <div className="space-y-1.5">
            {report.diamond.hits.slice(0, 5).map((hit, i) => (
              <div key={`${hit.accession}-${i}`} className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold">{hit.title}</span>
                  <span className="text-bauhaus-black/40 ml-2">{hit.organism}</span>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span>{hit.identity.toFixed(1)}% id</span>
                  {hit.threatFlags.length > 0 && (
                    <span className="flex items-center gap-1 text-bauhaus-red font-bold">
                      <AlertTriangle className="w-3 h-3" />
                      {hit.threatFlags.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            ))}
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
      >
        {report.structure && (
          <div className="flex items-center gap-4">
            <span>
              Mean pLDDT:{" "}
              <strong
                className={
                  report.structure.plddtMean >= 90
                    ? "text-green-600"
                    : report.structure.plddtMean >= 70
                      ? "text-bauhaus-blue"
                      : "text-bauhaus-red"
                }
              >
                {report.structure.plddtMean.toFixed(1)}
              </strong>
            </span>
            <span>Confidence: {report.structure.confidenceCategory}</span>
          </div>
        )}
      </PipelineStep>

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
          <div className="space-y-1.5">
            {report.foldseek.hits.slice(0, 5).map((hit, i) => (
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

      {/* Domain summary */}
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
                <div className="flex flex-wrap gap-1.5">
                  {report.summary.flags.map((flag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-bauhaus-muted border border-bauhaus-black/20"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
