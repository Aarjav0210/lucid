"use client";

import { useState } from "react";
import { Shield, AlertTriangle, ClipboardCheck, XOctagon, CheckCircle } from "lucide-react";
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
  const decision = report.decision ?? "Manual Validation";
  const [reviewerAction, setReviewerAction] = useState<"approved" | "rejected" | null>(null);

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
        <RiskBadge level={report.overallRisk} size="md" />
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

      {/* Reasoning */}
      <div className="px-6 py-4 space-y-3 border-b border-bauhaus-black/10">
        <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40">
          Reasoning
        </p>
        <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
          {report.reasoning}
        </div>
      </div>

      {/* Decision / Action area */}
      {decision === "Rejected" && (
        <div className="px-6 py-5 bg-bauhaus-red/10 border-t-4 border-bauhaus-red">
          <div className="flex items-center gap-3 mb-2">
            <XOctagon className="w-6 h-6 text-bauhaus-red" />
            <span className="text-base font-bold uppercase tracking-widest text-bauhaus-red">
              Order Rejected
            </span>
          </div>
          <p className="text-sm font-medium text-bauhaus-red/80">
            Clear biosecurity risk identified. This order has been automatically rejected.
          </p>
        </div>
      )}

      {decision === "Manual Validation" && (
        <div className="px-6 py-5 bg-bauhaus-yellow/10 border-t-4 border-bauhaus-yellow">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-bauhaus-yellow" />
            <span className="text-base font-bold uppercase tracking-widest text-bauhaus-yellow">
              Expert Review Required
            </span>
          </div>
          <p className="text-sm font-medium text-bauhaus-black/60 mb-4">
            This order has been flagged for manual review by a subject matter expert.
          </p>
          <button
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest border-2 border-bauhaus-black bg-bauhaus-yellow hover:bg-bauhaus-yellow/80 transition-colors shadow-[3px_3px_0px_0px_#121212]"
            onClick={() => {
              // TODO: hook up to review workflow
              alert("Request for expert review submitted.");
            }}
          >
            Send to Expert
          </button>
        </div>
      )}

      {decision === "Approved" && !reviewerAction && (
        <div className="px-6 py-5 bg-bauhaus-blue/5 border-t-4 border-bauhaus-blue">
          <div className="flex items-center gap-3 mb-3">
            <ClipboardCheck className="w-6 h-6 text-bauhaus-blue" />
            <span className="text-base font-bold uppercase tracking-widest text-bauhaus-blue">
              Pending Reviewer Approval
            </span>
          </div>
          <p className="text-sm font-medium text-bauhaus-black/60 mb-4">
            No risks identified by automated screening. A human reviewer must confirm approval before this order can proceed.
          </p>
          <div className="flex gap-3">
            <button
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest border-2 border-bauhaus-black bg-bauhaus-blue text-white hover:bg-bauhaus-blue/80 transition-colors shadow-[3px_3px_0px_0px_#121212]"
              onClick={() => setReviewerAction("approved")}
            >
              Approve Order
            </button>
            <button
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest border-2 border-bauhaus-black bg-white hover:bg-bauhaus-red/10 transition-colors shadow-[3px_3px_0px_0px_#121212]"
              onClick={() => setReviewerAction("rejected")}
            >
              Reject Order
            </button>
          </div>
        </div>
      )}

      {decision === "Approved" && reviewerAction === "approved" && (
        <div className="px-6 py-5 bg-green-50 border-t-4 border-green-600">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-base font-bold uppercase tracking-widest text-green-600">
              Order Approved
            </span>
          </div>
          <p className="text-sm font-medium text-green-600/80 mt-2">
            Confirmed by human reviewer. This order may proceed.
          </p>
        </div>
      )}

      {decision === "Approved" && reviewerAction === "rejected" && (
        <div className="px-6 py-5 bg-bauhaus-red/10 border-t-4 border-bauhaus-red">
          <div className="flex items-center gap-3">
            <XOctagon className="w-6 h-6 text-bauhaus-red" />
            <span className="text-base font-bold uppercase tracking-widest text-bauhaus-red">
              Order Rejected by Reviewer
            </span>
          </div>
          <p className="text-sm font-medium text-bauhaus-red/80 mt-2">
            A human reviewer has rejected this order.
          </p>
        </div>
      )}
    </div>
  );
}
