"use client";

import type { SequenceReport as SequenceReportType } from "@/lib/report-types";
import { DomainRuler } from "./domain-ruler";
import { DomainCard } from "./domain-card";
import { IntegratedReport } from "./integrated-report";

interface SequenceReportProps {
  report: SequenceReportType;
}

export function SequenceReport({ report }: SequenceReportProps) {
  return (
    <div className="space-y-8">
      {/* ── Sequence overview + domain ruler ── */}
      <div className="bg-white border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40">
              Input Sequence
            </p>
            <p className="text-sm font-medium text-bauhaus-black/60 mt-1">
              {report.sequenceLength} amino acids &middot;{" "}
              {report.domains.length} structural domain
              {report.domains.length !== 1 ? "s" : ""} identified
            </p>
          </div>
          <div className="text-xs font-medium text-bauhaus-black/30">
            {report.id}
          </div>
        </div>

        <DomainRuler
          domains={report.domains}
          sequenceLength={report.sequenceLength}
        />
      </div>

      {/* ── Connector: domains fan out ── */}
      <div className="flex justify-center">
        <div className="w-0.5 h-6 bg-bauhaus-black/20" />
      </div>

      {/* ── Per-domain analysis cards ── */}
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40 mb-4">
          Per-Domain Analysis
        </p>
        <div className="flex flex-col gap-6">
          {report.domains.map((domainReport, i) => (
            <DomainCard key={domainReport.domain.start} report={domainReport} index={i} />
          ))}
        </div>
      </div>

      {/* ── Connector: domains converge ── */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-1">
          <div className="w-0.5 h-4 bg-bauhaus-black/20" />
          <div className="w-3 h-3 rotate-45 border-b-2 border-r-2 border-bauhaus-black/20" />
          <div className="w-0.5 h-4 bg-bauhaus-black/20" />
        </div>
      </div>

      {/* ── Integrated report ── */}
      {report.integratedReport && (
        <IntegratedReport report={report.integratedReport} />
      )}
    </div>
  );
}
