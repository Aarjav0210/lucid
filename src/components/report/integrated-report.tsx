"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, ClipboardCheck, XOctagon, CheckCircle } from "lucide-react";
import type { IntegratedReport as IntegratedReportType } from "@/lib/report-types";
import { RiskBadge } from "./risk-badge";

const riskAccent: Record<string, string> = {
  HIGH: "var(--lc-danger)",
  MEDIUM: "var(--lc-warn)",
  LOW: "var(--lc-ok)",
  UNKNOWN: "var(--lc-ink-3)",
};

interface IntegratedReportProps {
  report: IntegratedReportType;
}

export function IntegratedReport({ report }: IntegratedReportProps) {
  const accent = riskAccent[report.overallRisk] ?? "var(--lc-ink-3)";
  const decision = report.decision ?? "Manual Validation";
  const [reviewerAction, setReviewerAction] = useState<"approved" | "rejected" | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(false), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div
      className="bg-[color:var(--lc-bg)] border border-[color:var(--lc-rule)] relative"
      style={{
        // Tinted top rail keyed to overall risk.
        boxShadow: `inset 0 3px 0 0 color-mix(in oklch, ${accent} 80%, transparent)`,
      }}
    >
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-[color:var(--lc-rule)] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 text-[color:var(--lc-ink)]">
          <Shield className="w-4 h-4 text-[color:var(--lc-ink-2)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-2)]">
            Integrated risk assessment
          </span>
        </div>
        <RiskBadge level={report.overallRisk} size="md" />
      </div>

      {/* ── Architecture summary ── */}
      <div className="px-6 py-4 border-b border-[color:var(--lc-rule)] bg-[color:var(--lc-bg-2)]">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)] mb-1.5">
          Domain architecture
        </p>
        <p className="font-mono text-[13.5px] text-[color:var(--lc-ink)] break-all">
          {report.architectureSummary}
        </p>
      </div>

      {/* ── Reasoning ── */}
      <div className="px-6 py-5 space-y-3 border-b border-[color:var(--lc-rule)]">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)]">
          Reasoning
        </p>
        <div className="text-[14.5px] leading-relaxed text-[color:var(--lc-ink-2)] whitespace-pre-wrap">
          {report.reasoning}
        </div>
      </div>

      {/* ── Decision area ── */}
      {decision === "Rejected" && (
        <DecisionRow
          tone="var(--lc-danger)"
          tint="var(--lc-danger-soft)"
          icon={<XOctagon className="w-5 h-5" />}
          label="Order rejected"
          body="Clear biosecurity risk identified. This order has been automatically rejected."
        />
      )}

      {decision === "Manual Validation" && (
        <DecisionRow
          tone="var(--lc-warn)"
          tint="var(--lc-warn-soft)"
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Expert review required"
          body="This order has been flagged for manual review by a subject matter expert."
        >
          <button
            type="button"
            onClick={() => setToast(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[12.5px] font-medium border transition-colors"
            style={{
              color: "var(--lc-bg)",
              borderColor: "var(--lc-warn)",
              backgroundColor: "var(--lc-warn)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "color-mix(in oklch, var(--lc-warn) 85%, black)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--lc-warn)";
            }}
          >
            Send to expert
          </button>
        </DecisionRow>
      )}

      {decision === "Approved" && !reviewerAction && (
        <DecisionRow
          tone="var(--lc-ok)"
          tint="var(--lc-ok-soft)"
          icon={<ClipboardCheck className="w-5 h-5" />}
          label="Pending reviewer approval"
          body="No risks identified by automated screening. A human reviewer must confirm approval before this order can proceed."
        >
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setReviewerAction("approved")}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[12.5px] font-medium border transition-colors"
              style={{
                color: "var(--lc-bg)",
                borderColor: "var(--lc-ok)",
                backgroundColor: "var(--lc-ok)",
              }}
            >
              Approve order
            </button>
            <button
              type="button"
              onClick={() => setReviewerAction("rejected")}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[12.5px] font-medium border transition-colors text-[color:var(--lc-ink-2)] border-[color:var(--lc-rule)] hover:border-[color:var(--lc-danger)] hover:text-[color:var(--lc-danger)]"
            >
              Reject order
            </button>
          </div>
        </DecisionRow>
      )}

      {decision === "Approved" && reviewerAction === "approved" && (
        <DecisionRow
          tone="var(--lc-ok)"
          tint="var(--lc-ok-soft)"
          icon={<CheckCircle className="w-5 h-5" />}
          label="Order approved"
          body="Confirmed by human reviewer. This order may proceed."
        />
      )}

      {decision === "Approved" && reviewerAction === "rejected" && (
        <DecisionRow
          tone="var(--lc-danger)"
          tint="var(--lc-danger-soft)"
          icon={<XOctagon className="w-5 h-5" />}
          label="Order rejected by reviewer"
          body="A human reviewer has rejected this order."
        />
      )}

      {/* ── Toast ── */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
          toast
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="px-4 py-2.5 bg-[color:var(--lc-ink)] text-[color:var(--lc-bg)] rounded-full font-mono text-[11px] uppercase tracking-[0.14em] shadow-lg">
          Request for expert review submitted
        </div>
      </div>
    </div>
  );
}

interface DecisionRowProps {
  tone: string;
  tint: string;
  icon: React.ReactNode;
  label: string;
  body: string;
  children?: React.ReactNode;
}

function DecisionRow({ tone, tint, icon, label, body, children }: DecisionRowProps) {
  return (
    <div
      className="px-6 py-5"
      style={{
        backgroundColor: tint,
        borderTop: `1px solid color-mix(in oklch, ${tone} 35%, transparent)`,
      }}
    >
      <div className="flex items-center gap-2.5 mb-2" style={{ color: tone }}>
        {icon}
        <span className="font-mono text-[12px] uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>
      <p className="text-[13.5px] leading-relaxed text-[color:var(--lc-ink-2)] mb-3 max-w-prose">
        {body}
      </p>
      {children}
    </div>
  );
}
