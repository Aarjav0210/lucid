"use client";

import type { DomainReport } from "@/lib/report-types";

interface DomainRulerProps {
  domains: DomainReport[];
  sequenceLength: number;
}

export function DomainRuler({ domains, sequenceLength }: DomainRulerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)]">
        <span>1</span>
        <span>InterPro domain architecture</span>
        <span>{sequenceLength} aa</span>
      </div>

      <div
        className="relative h-9 border border-[color:var(--lc-rule)] bg-[color:var(--lc-bg-2)] overflow-hidden"
      >
        {domains.map((dr) => {
          const left = ((dr.domain.start - 1) / sequenceLength) * 100;
          const width =
            ((dr.domain.end - dr.domain.start + 1) / sequenceLength) * 100;

          return (
            <div
              key={`${dr.domain.start}-${dr.domain.end}`}
              className="absolute top-0 h-full flex items-center justify-center overflow-hidden border-r border-[color:var(--lc-rule)]"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background:
                  "color-mix(in oklch, var(--lc-accent) 22%, var(--lc-bg))",
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent 0 19px, color-mix(in oklch, var(--lc-accent) 12%, transparent) 19px 20px)",
              }}
              title={`${dr.domain.annotation} (${dr.domain.start}–${dr.domain.end})`}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--lc-ink)] truncate px-1.5">
                {dr.domain.annotation}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {domains.map((dr) => (
          <div
            key={`label-${dr.domain.start}`}
            className="flex items-center gap-2"
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-[2px] border border-[color:var(--lc-rule)]"
              style={{
                background:
                  "color-mix(in oklch, var(--lc-accent) 28%, var(--lc-bg))",
              }}
            />
            <span className="text-[12.5px] text-[color:var(--lc-ink)]">
              {dr.domain.annotation}{" "}
              <span className="text-[color:var(--lc-ink-3)] font-mono text-[11px] tracking-[0.06em]">
                ({dr.domain.start}–{dr.domain.end})
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
