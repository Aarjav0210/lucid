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

    // Check it's protein, not nucleotide
    const aminoOnly = /[DEFHIKLMPQRSVWY]/i;
    if (!aminoOnly.test(seq)) {
      setError("This appears to be a nucleotide sequence. Only protein sequences are supported.");
      return;
    }

    setError(null);
    onSubmit(input);
  };

  return (
    <div className="bg-white border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212]">
      <div className="p-4 border-b-2 border-bauhaus-black flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-bauhaus-black/60">
          Submit Sequence for Screening
        </span>
        <span
          className={`text-xs font-bold uppercase tracking-widest ${
            aaCount > 0
              ? "text-bauhaus-black/40"
              : "text-bauhaus-black/20"
          }`}
        >
          {aaCount} AA
        </span>
      </div>

      <div className="p-4 space-y-3">
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          placeholder={`Paste a protein sequence (FASTA or raw)...\n\nExample:\nMSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLK...`}
          rows={6}
          disabled={isRunning}
          className="w-full px-4 py-3 font-mono text-sm bg-bauhaus-muted/30 border-2 border-bauhaus-black/20 focus:border-bauhaus-black focus:outline-none resize-y placeholder:text-bauhaus-black/25 disabled:opacity-50"
          spellCheck={false}
        />

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-bauhaus-red/10 border border-bauhaus-red/30">
            <AlertTriangle className="w-4 h-4 text-bauhaus-red shrink-0" />
            <span className="text-xs font-medium text-bauhaus-red">{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isRunning || aaCount === 0}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-bauhaus-blue text-white font-bold uppercase tracking-wider text-sm border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] hover:bg-bauhaus-blue/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0px_0px_#121212]"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Pipeline Running...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Screen Sequence
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
            title="Generate a sample sequence"
            className="flex items-center justify-center gap-2 px-4 py-4 bg-white text-bauhaus-black font-bold uppercase tracking-wider text-sm border-2 border-bauhaus-black shadow-[4px_4px_0px_0px_#121212] hover:bg-bauhaus-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0px_0px_#121212]"
          >
            <Wand2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
