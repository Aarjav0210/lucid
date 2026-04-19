"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { track } from "@vercel/analytics";
import { Loader2 } from "lucide-react";
import { SequenceInput } from "./sequence-input";
import { SequenceReport } from "./report/sequence-report";
import type {
  SequenceReport as SequenceReportType,
  DomainReport,
} from "@/lib/report-types";
import { createEmptyDomainProgress } from "@/lib/report-types";
import type { ExtractedDomain } from "@/lib/extract-domains";

interface LiveScreeningProps {
  onSequenceSubmit?: (sequence: string) => void;
  stickyOffset?: number;
}

export function LiveScreening({ onSequenceSubmit, stickyOffset = 0 }: LiveScreeningProps) {
  const [report, setReport] = useState<SequenceReportType | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanningDomains, setScanningDomains] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(async (rawSequence: string) => {
    setIsRunning(true);
    setReport(null);
    setErrorMessage(null);
    setScanningDomains(true);
    setGeneratingReport(false);
    setHasSubmitted(true);
    onSequenceSubmit?.(rawSequence);

    const cleanedSequence = rawSequence.replace(/^>.*\n/, "").replace(/\s+/g, "");
    track("screen_sequence", { length: cleanedSequence.length });

    try {
      const res = await fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence: rawSequence, gemini: true }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.error ?? `Server error: ${res.status}`);
        setIsRunning(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setErrorMessage("Failed to read response stream.");
        setIsRunning(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          let eventType = "";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ")) {
              eventData = line.slice(6);
            }
          }

          if (!eventType || !eventData) continue;

          try {
            const data = JSON.parse(eventData);
            handleSSEEvent(eventType, data);
          } catch {
            // skip malformed events
          }
        }
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Network error occurred."
      );
    } finally {
      setIsRunning(false);
    }
  }, []);

  const handleSSEEvent = useCallback(
    (event: string, data: Record<string, unknown>) => {
      switch (event) {
        case "status": {
          const stage = data.stage as string;
          if (stage === "generating_report") {
            setGeneratingReport(true);
          }
          break;
        }

        case "domains_extracted": {
          const domains = data.domains as ExtractedDomain[];
          const sequenceLength = data.sequenceLength as number;
          const orderId = data.orderId as string;
          setScanningDomains(false);

          const skeleton: SequenceReportType = {
            id: orderId,
            inputSequence: "",
            sequenceLength,
            status: "analyzing_domains",
            domains: domains
              .filter((d) => !d.isLinker)
              .map((domain) => ({
                domain,
                diamond: null,
                structure: null,
                foldseek: null,
                summary: null,
                progress: createEmptyDomainProgress(),
              })),
            integratedReport: null,
            startedAt: new Date().toISOString(),
          };
          setReport(skeleton);

          // Scroll to report
          setTimeout(() => {
            reportRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
          break;
        }

        case "domain_start": {
          const idx = data.index as number;
          setReport((prev) => {
            if (!prev) return prev;
            const domains = [...prev.domains];
            if (domains[idx]) {
              domains[idx] = {
                ...domains[idx],
                progress: { ...domains[idx].progress, diamond: "running" },
              };
            }
            return { ...prev, domains };
          });
          break;
        }

        case "diamond_complete": {
          const idx = data.index as number;
          const matched = data.matched as boolean;
          setReport((prev) => {
            if (!prev) return prev;
            const domains = [...prev.domains];
            if (domains[idx]) {
              domains[idx] = {
                ...domains[idx],
                progress: {
                  ...domains[idx].progress,
                  diamond: "completed",
                  structure: matched ? "skipped" : "running",
                  foldseek: matched ? "skipped" : domains[idx].progress.foldseek,
                },
              };
            }
            return { ...prev, domains };
          });
          break;
        }

        case "esmfold_complete": {
          const idx = data.index as number;
          setReport((prev) => {
            if (!prev) return prev;
            const domains = [...prev.domains];
            if (domains[idx]) {
              domains[idx] = {
                ...domains[idx],
                progress: {
                  ...domains[idx].progress,
                  structure: "completed",
                  foldseek: "running",
                },
              };
            }
            return { ...prev, domains };
          });
          break;
        }

        case "foldseek_complete": {
          const idx = data.index as number;
          setReport((prev) => {
            if (!prev) return prev;
            const domains = [...prev.domains];
            if (domains[idx]) {
              domains[idx] = {
                ...domains[idx],
                progress: {
                  ...domains[idx].progress,
                  foldseek: "completed",
                },
              };
            }
            return { ...prev, domains };
          });
          break;
        }

        case "domain_complete": {
          const idx = data.index as number;
          const domainReport = data.domainReport as DomainReport;
          setReport((prev) => {
            if (!prev) return prev;
            const domains = [...prev.domains];
            if (domains[idx]) {
              domains[idx] = domainReport;
            }
            return { ...prev, domains };
          });
          break;
        }

        case "result": {
          const reportData = data as unknown as SequenceReportType;
          setGeneratingReport(false);
          setReport(reportData);
          break;
        }

        case "error": {
          setErrorMessage(data.message as string);
          break;
        }
      }
    },
    []
  );

  // Listen for resubmit events from the sequence hero edit
  useEffect(() => {
    const handler = (e: Event) => {
      const seq = (e as CustomEvent).detail as string;
      handleSubmit(seq);
    };
    window.addEventListener("lucid:resubmit", handler);
    return () => window.removeEventListener("lucid:resubmit", handler);
  }, [handleSubmit]);

  return (
    <div>
      {!hasSubmitted && (
        <div className="mb-10">
          <SequenceInput onSubmit={handleSubmit} isRunning={isRunning} />
        </div>
      )}

      {errorMessage && (
        <div className="bg-bauhaus-red/5 border-2 border-bauhaus-red p-4 mb-6">
          <p className="text-xs font-medium text-bauhaus-red">{errorMessage}</p>
        </div>
      )}

      {scanningDomains && (
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40 mb-4">
            Structural Domain Identification
          </p>
          <div className="bg-white border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] px-6 py-5 flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-bauhaus-blue animate-spin" />
            <span className="text-sm font-medium text-bauhaus-black/60">
              Running InterPro domain scan...
            </span>
          </div>
        </div>
      )}

      {report && (
        <div ref={reportRef} style={{ scrollMarginTop: `${stickyOffset + 24}px` }}>
          <SequenceReport report={report} stickyOffset={stickyOffset} isGeneratingReport={generatingReport} />
        </div>
      )}
    </div>
  );
}
