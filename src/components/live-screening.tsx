"use client";

import { useState, useCallback, useRef } from "react";
import { SequenceInput } from "./sequence-input";
import {
  PipelineProgress,
  type PipelineState,
  type DomainProgress,
} from "./pipeline-progress";
import { SequenceReport } from "./report/sequence-report";
import type { SequenceReport as SequenceReportType } from "@/lib/report-types";

export function LiveScreening() {
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(
    null
  );
  const [report, setReport] = useState<SequenceReportType | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const domainsRef = useRef<DomainProgress[]>([]);

  const handleSubmit = useCallback(async (rawSequence: string) => {
    setIsRunning(true);
    setReport(null);
    domainsRef.current = [];

    const initialState: PipelineState = {
      stage: "starting",
      domains: [],
      logs: [],
    };
    setPipelineState(initialState);

    try {
      const res = await fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence: rawSequence, gemini: true }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setPipelineState((prev) => ({
          ...(prev ?? initialState),
          stage: "error",
          errorMessage: errData.error ?? `Server error: ${res.status}`,
        }));
        setIsRunning(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setPipelineState((prev) => ({
          ...(prev ?? initialState),
          stage: "error",
          errorMessage: "Failed to read response stream.",
        }));
        setIsRunning(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
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
      setPipelineState((prev) => ({
        ...(prev ?? initialState),
        stage: "error",
        errorMessage:
          err instanceof Error ? err.message : "Network error occurred.",
      }));
    } finally {
      setIsRunning(false);
    }
  }, []);

  const handleSSEEvent = useCallback(
    (event: string, data: Record<string, unknown>) => {
      switch (event) {
        case "status": {
          const stage = data.stage as string;
          setPipelineState((prev) => {
            const base = prev ?? {
              stage: "starting" as const,
              domains: [],
              logs: [],
            };
            if (stage === "done") {
              return { ...base, stage: "done", domains: domainsRef.current };
            }
            if (stage === "generating_report") {
              return {
                ...base,
                stage: "generating_report",
                domains: domainsRef.current,
              };
            }
            return { ...base, stage: stage as PipelineState["stage"], domains: domainsRef.current };
          });
          break;
        }

        case "log": {
          const msg = data.message as string;
          // Detect InterPro stage from logs
          if (msg.includes("InterPro")) {
            setPipelineState((prev) => {
              const base = prev ?? {
                stage: "starting" as const,
                domains: [],
                logs: [],
              };
              return {
                ...base,
                stage: base.stage === "starting" ? "interpro" : base.stage,
                logs: [...base.logs, msg],
                domains: domainsRef.current,
              };
            });
          } else if (msg.includes("Extracted") && msg.includes("domain")) {
            setPipelineState((prev) => {
              const base = prev ?? {
                stage: "starting" as const,
                domains: [],
                logs: [],
              };
              return {
                ...base,
                stage: "domains",
                logs: [...base.logs, msg],
                domains: domainsRef.current,
              };
            });
          }
          break;
        }

        case "domain_start": {
          const idx = data.index as number;
          const annotation = data.annotation as string;
          // Ensure domains array is large enough
          while (domainsRef.current.length <= idx) {
            domainsRef.current.push({
              annotation: "",
              diamond: "pending",
              esmfold: "pending",
              foldseek: "pending",
            });
          }
          domainsRef.current[idx] = {
            annotation,
            diamond: "running",
            esmfold: "pending",
            foldseek: "pending",
          };
          setPipelineState((prev) => ({
            ...(prev ?? { stage: "domains" as const, domains: [], logs: [] }),
            stage: "domains",
            domains: [...domainsRef.current],
          }));
          break;
        }

        case "diamond_complete": {
          const idx = data.index as number;
          const matched = data.matched as boolean;
          if (domainsRef.current[idx]) {
            domainsRef.current[idx].diamond = matched ? "matched" : "done";
            if (matched) {
              domainsRef.current[idx].esmfold = "skipped";
              domainsRef.current[idx].foldseek = "skipped";
            } else {
              domainsRef.current[idx].esmfold = "running";
            }
          }
          setPipelineState((prev) => ({
            ...(prev ?? { stage: "domains" as const, domains: [], logs: [] }),
            domains: [...domainsRef.current],
          }));
          break;
        }

        case "esmfold_complete": {
          const idx = data.index as number;
          if (domainsRef.current[idx]) {
            domainsRef.current[idx].esmfold = "done";
            domainsRef.current[idx].foldseek = "running";
          }
          setPipelineState((prev) => ({
            ...(prev ?? { stage: "domains" as const, domains: [], logs: [] }),
            domains: [...domainsRef.current],
          }));
          break;
        }

        case "foldseek_complete": {
          const idx = data.index as number;
          if (domainsRef.current[idx]) {
            domainsRef.current[idx].foldseek = "done";
          }
          setPipelineState((prev) => ({
            ...(prev ?? { stage: "domains" as const, domains: [], logs: [] }),
            domains: [...domainsRef.current],
          }));
          break;
        }

        case "domain_complete": {
          // Domain fully done — no additional state change needed
          break;
        }

        case "result": {
          const reportData = data as unknown as SequenceReportType;
          setReport(reportData);
          // Scroll to report after render
          setTimeout(() => {
            reportRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
          break;
        }

        case "error": {
          setPipelineState((prev) => ({
            ...(prev ?? { stage: "error" as const, domains: [], logs: [] }),
            stage: "error",
            errorMessage: data.message as string,
            domains: domainsRef.current,
          }));
          break;
        }
      }
    },
    []
  );

  return (
    <div className="space-y-10">
      <SequenceInput onSubmit={handleSubmit} isRunning={isRunning} />

      {pipelineState && pipelineState.stage !== "done" && (
        <PipelineProgress state={pipelineState} />
      )}

      {report && (
        <>
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-0.5 h-4 bg-bauhaus-black/20" />
              <div className="w-3 h-3 rotate-45 border-b-2 border-r-2 border-bauhaus-black/20" />
              <div className="w-0.5 h-4 bg-bauhaus-black/20" />
            </div>
          </div>
          <div ref={reportRef}>
            <SequenceReport report={report} />
          </div>
        </>
      )}
    </div>
  );
}
