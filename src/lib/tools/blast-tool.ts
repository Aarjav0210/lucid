import { tool } from "ai";
import { z } from "zod";
import { runBlastSearch } from "../blast";

export const blastSearch = tool({
  description:
    "Run a BLAST sequence similarity search against NCBI databases and cross-reference results with a curated threat sequence catalog. This tool MUST be called for every sequence submitted.",
  parameters: z.object({
    sequence: z
      .string()
      .describe("The raw nucleotide or protein sequence to search (no FASTA header)"),
    sequenceType: z
      .enum(["nucleotide", "protein"])
      .describe("Whether the sequence is nucleotide or protein"),
  }),
  execute: async ({ sequence, sequenceType }) => {
    return runBlastSearch(sequence, sequenceType);
  },
});
