const MAX_SEQUENCE_BYTES = 1024; // 1 KB limit

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sequence: string;
  header?: string;
}

export function validateSequence(input: string): ValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { valid: false, error: "No sequence provided.", sequence: "" };
  }

  const bytes = new TextEncoder().encode(trimmed).length;
  if (bytes > MAX_SEQUENCE_BYTES) {
    return {
      valid: false,
      error: `Sequence exceeds the 1 KB limit (${bytes} bytes).`,
      sequence: "",
    };
  }

  // Parse FASTA: extract header and sequence
  let header: string | undefined;
  let sequence: string;

  if (trimmed.startsWith(">")) {
    const lines = trimmed.split("\n");
    header = lines[0];
    sequence = lines
      .slice(1)
      .map((l) => l.trim())
      .join("");
  } else {
    // Plain text — strip whitespace
    sequence = trimmed.replace(/\s+/g, "");
  }

  // Allow standard nucleotide + amino acid characters
  const validChars = /^[ACDEFGHIKLMNPQRSTVWYacdefghiklmnpqrstvwy*\-]+$/;
  if (!validChars.test(sequence)) {
    return {
      valid: false,
      error:
        "Sequence contains invalid characters. Only standard nucleotide (ACGT) or amino acid letters are accepted.",
      sequence: "",
    };
  }

  return { valid: true, sequence, header };
}

// Detect whether a sequence is nucleotide or protein.
// Nucleotides use only A, C, G, T, N, U. Anything with amino-acid-only
// letters (D, E, F, H, I, K, L, M, P, Q, R, S, V, W, Y) is protein.
export function detectSequenceType(sequence: string): "nucleotide" | "protein" {
  const upper = sequence.toUpperCase();
  const aminoOnlyChars = /[DEFHIKLMPQRSVWY]/;
  return aminoOnlyChars.test(upper) ? "protein" : "nucleotide";
}
