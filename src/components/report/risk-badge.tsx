"use client";

import type { RiskLevel } from "@/lib/report-types";

const riskColorVar: Record<RiskLevel, string> = {
  HIGH: "var(--lc-danger)",
  MEDIUM: "var(--lc-warn)",
  LOW: "var(--lc-ok)",
  UNKNOWN: "var(--lc-ink-3)",
};

interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function RiskBadge({ level, size = "md", showLabel = true }: RiskBadgeProps) {
  const sizeCls = {
    sm: "h-5 px-2 text-[10px]",
    md: "h-6 px-2.5 text-[10.5px]",
    lg: "h-7 px-3.5 text-[11.5px]",
  }[size];

  const dotSize = size === "sm" ? 5 : size === "lg" ? 7 : 6;
  const color = riskColorVar[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-[0.14em] ${sizeCls}`}
      style={{ color, borderColor: color }}
    >
      <span
        aria-hidden="true"
        className="rounded-full"
        style={{
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          backgroundColor: color,
        }}
      />
      <span>
        {level}
        {showLabel && " Risk"}
      </span>
    </span>
  );
}
