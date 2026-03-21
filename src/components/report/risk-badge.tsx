"use client";

import type { RiskLevel } from "@/lib/report-types";

const riskStyles: Record<RiskLevel, string> = {
  HIGH: "bg-bauhaus-red text-white",
  MEDIUM: "bg-bauhaus-yellow text-bauhaus-black",
  LOW: "bg-bauhaus-blue text-white",
  UNKNOWN: "bg-bauhaus-muted text-bauhaus-black",
};

interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function RiskBadge({ level, size = "md", showLabel = true }: RiskBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-block font-bold uppercase tracking-widest border-2 border-bauhaus-black ${riskStyles[level]} ${sizeClasses[size]}`}
    >
      {level}{showLabel && " RISK"}
    </span>
  );
}
