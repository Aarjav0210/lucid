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
  pending: <Minus className="w-3.5 h-3.5 text-bauhaus-black/30" />,
  running: <Loader2 className="w-3.5 h-3.5 text-bauhaus-blue animate-spin" />,
  completed: <Check className="w-3.5 h-3.5 text-green-600" />,
  error: <AlertCircle className="w-3.5 h-3.5 text-bauhaus-red" />,
  skipped: <Minus className="w-3.5 h-3.5 text-bauhaus-black/20" />,
};

const moduleInfo: Record<string, { icon: React.ReactNode; hint: string }> = {
  Diamond: {
    icon: <Dna className="w-3.5 h-3.5 text-bauhaus-black/30" />,
    hint: "Sequence alignment against known threats",
  },
  ESMFold: {
    icon: <Box className="w-3.5 h-3.5 text-bauhaus-black/30" />,
    hint: "3D protein structure prediction",
  },
  Foldseek: {
    icon: <Search className="w-3.5 h-3.5 text-bauhaus-black/30" />,
    hint: "Structural similarity search",
  },
  InterPro: {
    icon: <Fingerprint className="w-3.5 h-3.5 text-bauhaus-black/30" />,
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
    <div className="border-t border-bauhaus-black/10">
      <button
        onClick={() => hasContent && setExpanded(!expanded)}
        disabled={!hasContent}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-left ${
          hasContent ? "hover:bg-bauhaus-muted/50 cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {statusIcons[status]}
          {info && info.icon}
          <span className="text-xs font-bold uppercase tracking-wider">
            {label}
          </span>
          {info && (
            <span className="text-[10px] text-bauhaus-black/30 font-medium hidden sm:inline">
              {info.hint}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-bauhaus-black/40 font-medium">
              &middot; {subtitle}
            </span>
          )}
        </div>
        {hasContent && (
          <ChevronDown
            className={`w-4 h-4 text-bauhaus-black/30 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </button>
      {expanded && children && (
        <div className="px-4 pb-3 text-xs font-medium text-bauhaus-black/70 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
