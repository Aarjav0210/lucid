"use client";

import { Shield, AlertTriangle } from "lucide-react";
import type { IntegratedReport as IntegratedReportType } from "@/lib/report-types";
import { RiskBadge } from "./risk-badge";

const riskBorderColor: Record<string, string> = {
  HIGH: "border-bauhaus-red",
  MEDIUM: "border-bauhaus-yellow",
  LOW: "border-bauhaus-blue",
  UNKNOWN: "border-bauhaus-muted",
};

interface IntegratedReportProps {
  report: IntegratedReportType;
}

export function IntegratedReport({ report }: IntegratedReportProps) {
  const borderColor = riskBorderColor[report.overallRisk] ?? "border-bauhaus-muted";

  return (
    <div
      className={`bg-white border-2 border-bauhaus-black shadow-[6px_6px_0px_0px_#121212] border-t-[6px] ${borderColor}`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b-2 border-bauhaus-black flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest">
            Integrated Risk Assessment
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-bauhaus-black/40">
            {(report.confidence * 100).toFixed(0)}% confidence
          </span>
          <RiskBadge level={report.overallRisk} size="md" />
        </div>
      </div>

      {/* Architecture summary */}
      <div className="px-6 py-4 border-b border-bauhaus-black/10 bg-bauhaus-muted/30">
        <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40 mb-1">
          Domain Architecture
        </p>
        <p className="text-sm font-bold font-mono">
          {report.architectureSummary}
        </p>
      </div>

      {/* Synergistic risk factors */}
      {report.synergisticFactors.length > 0 && (
        <div className="px-6 py-4 border-b border-bauhaus-black/10">
          <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40 mb-3">
            Synergistic Risk Factors
          </p>
          <div className="space-y-3">
            {report.synergisticFactors.map((factor, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-bauhaus-red/5 border border-bauhaus-red/20"
              >
                <AlertTriangle className="w-4 h-4 text-bauhaus-red shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">
                      {factor.domains.join(" + ")}
                    </span>
                    <RiskBadge
                      level={factor.riskContribution}
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                  <p className="text-xs font-medium text-bauhaus-black/70 leading-relaxed">
                    {factor.concern}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No synergistic factors — positive signal */}
      {report.synergisticFactors.length === 0 && (
        <div className="px-6 py-3 border-b border-bauhaus-black/10 bg-bauhaus-blue/5">
          <p className="text-xs font-medium text-bauhaus-blue">
            No synergistic risk factors identified between domains.
          </p>
        </div>
      )}

      {/* Full reasoning */}
      <div className="px-6 py-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40">
          Reasoning
        </p>
        <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
          {report.reasoning}
        </div>
      </div>

      {/* Flags */}
      {report.flags.length > 0 && (
        <div className="px-6 pb-5">
          <div className="flex flex-wrap gap-1.5">
            {report.flags.map((flag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-bauhaus-muted border border-bauhaus-black/20"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
