"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Download } from "lucide-react";
import type { SequenceReport as SequenceReportType } from "@/lib/report-types";
import { DomainRuler } from "./domain-ruler";
import { DomainCard } from "./domain-card";
import { IntegratedReport } from "./integrated-report";

const NAV_SECTIONS = [
  { id: "section-domains", label: "Domain identification" },
  { id: "section-analysis", label: "Per-domain analysis" },
  { id: "section-report", label: "Integrated report" },
];

interface SequenceReportProps {
  report: SequenceReportType;
  stickyOffset?: number;
  isGeneratingReport?: boolean;
}

export function SequenceReport({ report, stickyOffset = 0, isGeneratingReport = false }: SequenceReportProps) {
  const [activeSection, setActiveSection] = useState(NAV_SECTIONS[0].id);
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  const handleSavePdf = useCallback(async () => {
    setIsSavingPdf(true);
    try {
      const { generateScreeningPDF } = await import("@/lib/generate-pdf");
      generateScreeningPDF(report);
    } finally {
      setIsSavingPdf(false);
    }
  }, [report]);

  useEffect(() => {
    const handleScroll = () => {
      const offset = stickyOffset + 48;
      let current = NAV_SECTIONS[0].id;
      for (const section of NAV_SECTIONS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= offset) current = section.id;
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
    <div className="flex gap-10">
      {/* ── Sidebar navigation ── */}
      <nav className="hidden lg:block w-52 shrink-0">
        <div className="sticky" style={{ top: `${stickyOffset + 32}px` }}>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)] pb-3 border-b border-[color:var(--lc-rule)] mb-3">
            On this report
          </div>
          <ul className="space-y-px">
            {NAV_SECTIONS.map((section, i) => {
              if (section.id === "section-report" && !report.integratedReport) return null;
              const isActive = activeSection === section.id;
              return (
                <li key={section.id}>
                  <button
                    onClick={() => scrollTo(section.id)}
                    className="block w-full text-left py-2 pl-3 border-l text-[13px] transition-all duration-200"
                    style={{
                      color: isActive
                        ? "var(--lc-ink)"
                        : "var(--lc-ink-3)",
                      borderColor: isActive ? "var(--lc-ink)" : "transparent",
                    }}
                  >
                    <span className="font-mono text-[10px] mr-2 opacity-60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {section.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ── Report content ── */}
      <div className="flex-1 min-w-0 space-y-10">
        {/* Sequence overview + domain ruler */}
        <div
          id="section-domains"
          className="space-y-3"
          style={{ scrollMarginTop: `${stickyOffset + 24}px` }}
        >
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)]">
            Domain identification
          </p>
          <div className="bg-[color:var(--lc-bg)] border border-[color:var(--lc-rule)] p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)]">
                  Input sequence
                </p>
                <p className="text-[14px] text-[color:var(--lc-ink-2)] mt-1.5">
                  {report.sequenceLength} amino acids ·{" "}
                  {report.domains.length} structural domain
                  {report.domains.length !== 1 ? "s" : ""} identified
                </p>
              </div>
              <span className="font-mono text-[11px] tracking-[0.06em] text-[color:var(--lc-ink-3)]">
                {report.id}
              </span>
            </div>

            <DomainRuler
              domains={report.domains}
              sequenceLength={report.sequenceLength}
            />
          </div>
        </div>

        {/* Hairline connector */}
        <div className="flex justify-center">
          <span className="block w-px h-8 bg-[color:var(--lc-rule)]" />
        </div>

        {/* Per-domain analysis */}
        <div
          id="section-analysis"
          className="space-y-3"
          style={{ scrollMarginTop: `${stickyOffset + 24}px` }}
        >
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)]">
              Per-domain analysis
            </p>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)]">
              {report.domains.length} domain{report.domains.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-col gap-5">
            {report.domains.map((domainReport, i) => (
              <DomainCard
                key={domainReport.domain.start}
                report={domainReport}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* Hairline connector */}
        <div className="flex justify-center">
          <span className="block w-px h-8 bg-[color:var(--lc-rule)]" />
        </div>

        {/* Integrated report */}
        {isGeneratingReport && !report.integratedReport && (
          <div
            id="section-report"
            style={{ scrollMarginTop: `${stickyOffset + 24}px` }}
          >
            <div className="bg-[color:var(--lc-bg)] border border-[color:var(--lc-rule)] px-6 py-5 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-[color:var(--lc-accent)] animate-spin" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-2)]">
                Generating integrated risk assessment…
              </span>
            </div>
          </div>
        )}
        {report.integratedReport && (
          <div
            id="section-report"
            style={{ scrollMarginTop: `${stickyOffset + 24}px` }}
          >
            <IntegratedReport report={report.integratedReport} />
          </div>
        )}

        {/* Save as PDF */}
        {report.integratedReport && (
          <div className="flex justify-center pt-2 pb-4">
            <button
              onClick={handleSavePdf}
              disabled={isSavingPdf}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-[12.5px] font-medium border border-[color:var(--lc-rule)] text-[color:var(--lc-ink-2)] hover:border-[color:var(--lc-ink)] hover:text-[color:var(--lc-ink)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSavingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isSavingPdf ? "Generating PDF…" : "Save report as PDF"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
