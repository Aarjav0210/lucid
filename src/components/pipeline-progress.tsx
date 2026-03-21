"use client";

import {
  Loader2,
  Check,
  AlertCircle,
  Search,
  Layers,
  FileText,
  Shield,
  Minus,
} from "lucide-react";

export interface DomainProgress {
  annotation: string;
  diamond: "pending" | "running" | "done" | "matched";
  esmfold: "pending" | "running" | "done" | "skipped";
  foldseek: "pending" | "running" | "done" | "skipped";
}

export interface PipelineState {
  stage:
    | "starting"
    | "interpro"
    | "domains"
    | "generating_report"
    | "done"
    | "error";
  domains: DomainProgress[];
  logs: string[];
  errorMessage?: string;
}

function StepIcon({ status }: { status: string }) {
  switch (status) {
    case "running":
      return <Loader2 className="w-4 h-4 text-bauhaus-blue animate-spin" />;
    case "done":
    case "completed":
      return <Check className="w-4 h-4 text-green-600" />;
    case "matched":
      return <AlertCircle className="w-4 h-4 text-bauhaus-red" />;
    case "skipped":
      return <Minus className="w-4 h-4 text-bauhaus-black/20" />;
    case "error":
      return <AlertCircle className="w-4 h-4 text-bauhaus-red" />;
    default:
      return <Minus className="w-4 h-4 text-bauhaus-black/20" />;
  }
}

function StepLabel({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "text-bauhaus-black/30",
    running: "text-bauhaus-blue",
    done: "text-green-700",
    matched: "text-bauhaus-red font-bold",
    skipped: "text-bauhaus-black/30 line-through",
    error: "text-bauhaus-red",
  };
  return colors[status] ?? "text-bauhaus-black/30";
}

interface PipelineProgressProps {
  state: PipelineState;
}

export function PipelineProgress({ state }: PipelineProgressProps) {
  const stageLabel = {
    starting: "Initializing pipeline...",
    interpro: "Running InterPro domain scan...",
    domains: "Analyzing domains...",
    generating_report: "Generating integrated report...",
    done: "Pipeline complete",
    error: "Pipeline error",
  };

  return (
    <div className="bg-white border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212]">
      {/* Header */}
      <div className="p-4 border-b-2 border-bauhaus-black flex items-center gap-3">
        {state.stage === "done" ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : state.stage === "error" ? (
          <AlertCircle className="w-5 h-5 text-bauhaus-red" />
        ) : (
          <Loader2 className="w-5 h-5 text-bauhaus-blue animate-spin" />
        )}
        <span className="text-xs font-bold uppercase tracking-widest">
          {stageLabel[state.stage]}
        </span>
      </div>

      {/* Overall pipeline steps */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-3">
          <StepIcon
            status={
              state.stage === "starting"
                ? "running"
                : "done"
            }
          />
          <span className={`text-xs font-bold uppercase tracking-wider ${
            state.stage === "starting" ? "text-bauhaus-blue" : "text-green-700"
          }`}>
            Validation
          </span>
        </div>

        <div className="flex items-center gap-3">
          <StepIcon
            status={
              state.stage === "starting"
                ? "pending"
                : state.stage === "interpro"
                  ? "running"
                  : "done"
            }
          />
          <span className={`text-xs font-bold uppercase tracking-wider ${
            state.stage === "interpro"
              ? "text-bauhaus-blue"
              : state.stage === "starting"
                ? "text-bauhaus-black/30"
                : "text-green-700"
          }`}>
            InterPro Domain Scan
          </span>
        </div>
      </div>

      {/* Per-domain progress */}
      {state.domains.length > 0 && (
        <div className="border-t-2 border-bauhaus-black">
          <div className="px-4 py-2 bg-bauhaus-muted/30">
            <span className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/40">
              Per-Domain Analysis ({state.domains.length} domain{state.domains.length !== 1 ? "s" : ""})
            </span>
          </div>
          <div className="divide-y divide-bauhaus-black/10">
            {state.domains.map((domain, i) => (
              <div key={i} className="px-4 py-3">
                <div className="text-xs font-bold mb-2">
                  Domain {i + 1}: {domain.annotation}
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <Search className="w-3 h-3 text-bauhaus-black/40" />
                    <StepIcon status={domain.diamond} />
                    <span className={`text-[11px] font-medium ${StepLabel({ status: domain.diamond })}`}>
                      Diamond
                      {domain.diamond === "matched" && " — THREAT MATCH"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-bauhaus-black/40" />
                    <StepIcon status={domain.esmfold} />
                    <span className={`text-[11px] font-medium ${StepLabel({ status: domain.esmfold })}`}>
                      ESMFold
                      {domain.esmfold === "skipped" && " — skipped"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-bauhaus-black/40" />
                    <StepIcon status={domain.foldseek} />
                    <span className={`text-[11px] font-medium ${StepLabel({ status: domain.foldseek })}`}>
                      Foldseek
                      {domain.foldseek === "skipped" && " — skipped"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gemini report step */}
      {(state.stage === "generating_report" || state.stage === "done") && (
        <div className="border-t-2 border-bauhaus-black p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-bauhaus-black/40" />
            <StepIcon
              status={state.stage === "generating_report" ? "running" : "done"}
            />
            <span className={`text-xs font-bold uppercase tracking-wider ${
              state.stage === "generating_report" ? "text-bauhaus-blue" : "text-green-700"
            }`}>
              Integrated Report
            </span>
          </div>
        </div>
      )}

      {/* Error message */}
      {state.errorMessage && (
        <div className="border-t-2 border-bauhaus-red p-4 bg-bauhaus-red/5">
          <p className="text-xs font-medium text-bauhaus-red">
            {state.errorMessage}
          </p>
        </div>
      )}
    </div>
  );
}
