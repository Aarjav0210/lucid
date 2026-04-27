"use client";

import { useState } from "react";
import {
  ChevronDown,
  Check,
  Loader2,
  AlertCircle,
  Minus,
  Dna,
  Box,
  Search,
  Fingerprint,
} from "lucide-react";
import type { PipelineStepStatus } from "@/lib/report-types";

const statusIcons: Record<PipelineStepStatus, React.ReactNode> = {
  pending: <Minus className="w-3.5 h-3.5 text-[color:var(--lc-ink-3)]/70" />,
  running: <Loader2 className="w-3.5 h-3.5 text-[color:var(--lc-accent)] animate-spin" />,
  completed: <Check className="w-3.5 h-3.5 text-[color:var(--lc-ok)]" />,
  error: <AlertCircle className="w-3.5 h-3.5 text-[color:var(--lc-danger)]" />,
  skipped: <Minus className="w-3.5 h-3.5 text-[color:var(--lc-ink-3)]/40" />,
};

const moduleInfo: Record<string, { icon: React.ReactNode; hint: string }> = {
  Diamond: {
    icon: <Dna className="w-3.5 h-3.5 text-[color:var(--lc-ink-3)]" />,
    hint: "Sequence alignment against known threats",
  },
  ESMFold: {
    icon: <Box className="w-3.5 h-3.5 text-[color:var(--lc-ink-3)]" />,
    hint: "3D protein structure prediction",
  },
  Foldseek: {
    icon: <Search className="w-3.5 h-3.5 text-[color:var(--lc-ink-3)]" />,
    hint: "Structural similarity search",
  },
  InterPro: {
    icon: <Fingerprint className="w-3.5 h-3.5 text-[color:var(--lc-ink-3)]" />,
    hint: "Protein domain identification",
  },
};

interface PipelineStepProps {
  label: string;
  status: PipelineStepStatus;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PipelineStep({ label, status, subtitle, children }: PipelineStepProps) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = !!children;
  const info = moduleInfo[label];

  return (
    <div className="border-t border-[color:var(--lc-rule)]">
      <button
        onClick={() => hasContent && setExpanded(!expanded)}
        disabled={!hasContent}
        className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${
          hasContent
            ? "hover:bg-[color:var(--lc-bg-2)] cursor-pointer"
            : "cursor-default"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {statusIcons[status]}
          {info && info.icon}
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--lc-ink)]">
            {label}
          </span>
          {info && (
            <span className="hidden sm:inline text-[12px] text-[color:var(--lc-ink-3)] truncate">
              {info.hint}
            </span>
          )}
          {subtitle && (
            <span className="text-[12px] text-[color:var(--lc-ink-2)] truncate">
              · {subtitle}
            </span>
          )}
        </div>
        {hasContent && (
          <ChevronDown
            className={`w-4 h-4 text-[color:var(--lc-ink-3)] transition-transform duration-200 shrink-0 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </button>
      {expanded && children && (
        <div className="px-5 pb-4 pt-1 text-[13px] leading-relaxed text-[color:var(--lc-ink-2)] space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
