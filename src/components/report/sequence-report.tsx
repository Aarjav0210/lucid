"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { SequenceReport as SequenceReportType } from "@/lib/report-types";
import { DomainRuler } from "./domain-ruler";
import { DomainCard } from "./domain-card";
import { IntegratedReport } from "./integrated-report";

const NAV_SECTIONS = [
  { id: "section-domains", label: "Domain Identification" },
  { id: "section-analysis", label: "Per-Domain Analysis" },
  { id: "section-report", label: "Integrated Report" },
];

interface SequenceReportProps {
  report: SequenceReportType;
  stickyOffset?: number;
  isGeneratingReport?: boolean;
}

export function SequenceReport({ report, stickyOffset = 0, isGeneratingReport = false }: SequenceReportProps) {
  const [activeSection, setActiveSection] = useState(NAV_SECTIONS[0].id);

  useEffect(() => {
    const handleScroll = () => {
      const offset = stickyOffset + 48;
      let current = NAV_SECTIONS[0].id;
      for (const section of NAV_SECTIONS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= offset) {
          current = section.id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [report, stickyOffset]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex gap-8">
      {/* ── Sidebar navigation ── */}
      <nav className="hidden lg:block w-48 shrink-0">
        <div
          className="sticky space-y-1"
          style={{ top: `${stickyOffset + 24}px` }}
        >
          {NAV_SECTIONS.map((section) => {
            if (section.id === "section-report" && !report.integratedReport) return null;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                className={`block w-full text-left px-3 py-2 transition-all duration-300 ${
                  isActive
                    ? "text-sm font-bold text-bauhaus-black border-l-2 border-bauhaus-black"
                    : "text-xs font-medium text-bauhaus-black/40 border-l-2 border-transparent hover:text-bauhaus-black/60 hover:border-bauhaus-black/20"
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Report content ── */}
      <div className="flex-1 min-w-0 space-y-8">
        {/* ── Sequence overview + domain ruler ── */}
        <div id="section-domains" className="space-y-1" style={{ scrollMarginTop: `${stickyOffset + 24}px` }}>
          <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40 mb-4">
            Structural Domain Identification
          </p>
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
        </div>

        {/* ── Connector: domains fan out ── */}
        <div className="flex justify-center">
          <div className="w-0.5 h-6 bg-bauhaus-black/20" />
        </div>

        {/* ── Per-domain analysis cards ── */}
        <div id="section-analysis" className="space-y-1" style={{ scrollMarginTop: `${stickyOffset + 24}px` }}>
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
        {isGeneratingReport && !report.integratedReport && (
          <div id="section-report" style={{ scrollMarginTop: `${stickyOffset + 24}px` }}>
            <div className="bg-white border-2 border-bauhaus-black shadow-[6px_6px_0px_0px_#121212] border-t-[6px] border-t-bauhaus-muted px-6 py-5 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-bauhaus-blue animate-spin" />
              <span className="text-sm font-medium text-bauhaus-black/60">
                Generating integrated risk assessment...
              </span>
            </div>
          </div>
        )}
        {report.integratedReport && (
          <div id="section-report" style={{ scrollMarginTop: `${stickyOffset + 24}px` }}>
            <IntegratedReport report={report.integratedReport} />
          </div>
        )}
      </div>
    </div>
  );
}
