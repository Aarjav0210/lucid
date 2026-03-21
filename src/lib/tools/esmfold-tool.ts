import { tool } from "ai";
import { z } from "zod";
import { predictStructureEsm } from "../esmfold";

export const esmFoldPredict = tool({
  description:
    "Predict the 3D protein structure for a given amino acid sequence using ESMFold. Returns a PDB string with per-residue confidence scores (pLDDT). Use this for structural screening after sequence-level analysis.",
  parameters: z.object({
    sequence: z
      .string()
      .describe("The raw amino acid sequence (single-letter codes, no FASTA header)"),
  }),
  execute: async ({ sequence }) => {
    return predictStructureEsm(sequence);
  },
});
