"use client";

import { useState, useCallback } from "react";
import { ArrowRight, AlertTriangle, Loader2, Wand2 } from "lucide-react";

const SAMPLE_SEQUENCE =
  "MATLEKMSQVINSTQEPVKNMTDEVLEALEMDLSSQAQEVLQQLLHLTKNDMQDVKVQLSLPVLQVRDVLVRGFGDSVEEVLSEARQHLKDGTCGLVEVEKGVLPQLEQPYVFIKRSDARTAPHGHVMVELVAELEGIQYGRSGETLGVLVPHVGETPIAYRNVLLRKNGNKGAGGHSYGADLKSFDLGDELGTDPYEDFQENWNTKHSSGVTRELMRELNGG";

interface SequenceInputProps {
  onSubmit: (sequence: string) => void;
  isRunning: boolean;
}

export function SequenceInput({ onSubmit, isRunning }: SequenceInputProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const getCleanSequence = useCallback((raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed.startsWith(">")) {
      return trimmed
        .split("\n")
        .filter((l) => !l.startsWith(">"))
        .map((l) => l.trim())
        .join("");
    }
    return trimmed.replace(/\s+/g, "");
  }, []);

  const cleanSeq = getCleanSequence(input);
  const aaCount = cleanSeq.length;

  const handleSubmit = () => {
    if (isRunning) return;

    const seq = cleanSeq;
    if (!seq) {
      setError("Please enter a protein sequence.");
      return;
    }

    const validChars = /^[ACDEFGHIKLMNPQRSTVWYacdefghiklmnpqrstvwy*\-]+$/;
    if (!validChars.test(seq)) {
      setError(
        "Sequence contains invalid characters. Only standard amino acid letters are accepted."
      );
      return;
    }

    const aminoOnly = /[DEFHIKLMPQRSVWY]/i;
    if (!aminoOnly.test(seq)) {
      setError("This appears to be a nucleotide sequence. Only protein sequences are supported.");
      return;
    }

    setError(null);
    onSubmit(input);
  };

  const labelCls =
    "font-mono text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--lc-ink-3)]";

  return (
    <div className="bg-[color:var(--lc-bg)] border border-[color:var(--lc-rule)]">
      <div className="px-5 py-3.5 border-b border-[color:var(--lc-rule)] flex items-center justify-between">
        <span className={labelCls}>Submit sequence</span>
        <span
          className={`font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors ${
            aaCount > 0
              ? "text-[color:var(--lc-ink-2)]"
              : "text-[color:var(--lc-ink-3)]/60"
          }`}
        >
          {aaCount} aa
        </span>
      </div>

      <div className="p-5 space-y-4">
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          placeholder={`Paste a protein sequence (FASTA or raw)…\n\nExample:\nMSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLK…`}
          rows={6}
          disabled={isRunning}
          className="w-full px-4 py-3 font-mono text-sm leading-relaxed bg-[color:var(--lc-bg-2)] text-[color:var(--lc-ink)] border border-[color:var(--lc-rule)] focus:border-[color:var(--lc-ink)] focus:outline-none resize-y placeholder:text-[color:var(--lc-ink-3)]/60 disabled:opacity-50 transition-colors"
          spellCheck={false}
        />

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[color:var(--lc-danger-soft)] border border-[color:var(--lc-danger)]/30">
            <AlertTriangle className="w-4 h-4 text-[color:var(--lc-danger)] shrink-0" />
            <span className="text-xs text-[color:var(--lc-danger)]">{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSubmit}
            disabled={isRunning || aaCount === 0}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full text-[13.5px] font-medium bg-[color:var(--lc-ink)] text-[color:var(--lc-bg)] border border-[color:var(--lc-ink)] hover:bg-transparent hover:text-[color:var(--lc-ink)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[color:var(--lc-ink)] disabled:hover:text-[color:var(--lc-bg)] transition-colors"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Pipeline running…
              </>
            ) : (
              <>
                Screen sequence
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setInput(SAMPLE_SEQUENCE);
              setError(null);
            }}
            disabled={isRunning}
            title="Insert a sample sequence"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full text-[13px] font-medium text-[color:var(--lc-ink-2)] border border-[color:var(--lc-rule)] hover:border-[color:var(--lc-ink)] hover:text-[color:var(--lc-ink)] disabled:opacity-40 transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            Sample
          </button>
        </div>
      </div>
    </div>
  );
}
