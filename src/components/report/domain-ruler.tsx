"use client";

import type { DomainReport } from "@/lib/report-types";

const DOMAIN_COLORS = [
  "bg-bauhaus-red",
  "bg-bauhaus-blue",
  "bg-bauhaus-yellow",
  "bg-[#8B5CF6]",   // purple
  "bg-[#059669]",   // emerald
  "bg-[#EA580C]",   // orange
];

interface DomainRulerProps {
  domains: DomainReport[];
  sequenceLength: number;
}

export function DomainRuler({ domains, sequenceLength }: DomainRulerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-bauhaus-black/50">
        <span>1</span>
        <span>Domain Architecture</span>
        <span>{sequenceLength} AA</span>
      </div>

      {/* Ruler bar */}
      <div className="relative h-12 bg-bauhaus-muted border-2 border-bauhaus-black overflow-hidden">
        {domains.map((dr, i) => {
          const left = ((dr.domain.start - 1) / sequenceLength) * 100;
          const width =
            ((dr.domain.end - dr.domain.start + 1) / sequenceLength) * 100;
          const color = DOMAIN_COLORS[i % DOMAIN_COLORS.length];

          return (
            <div
              key={`${dr.domain.start}-${dr.domain.end}`}
              className={`absolute top-0 h-full ${color} border-r-2 border-bauhaus-black flex items-center justify-center overflow-hidden`}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${dr.domain.annotation} (${dr.domain.start}–${dr.domain.end})`}
            >
              <span className="text-[10px] font-bold text-white uppercase tracking-wider truncate px-1">
                {dr.domain.annotation}
              </span>
            </div>
          );
        })}
      </div>

      {/* Labels below */}
      <div className="flex flex-wrap gap-3">
        {domains.map((dr, i) => {
          const color = DOMAIN_COLORS[i % DOMAIN_COLORS.length];
          return (
            <div key={`label-${dr.domain.start}`} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 ${color} border border-bauhaus-black`} />
              <span className="text-xs font-medium">
                {dr.domain.annotation}{" "}
                <span className="text-bauhaus-black/40">
                  ({dr.domain.start}–{dr.domain.end})
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
