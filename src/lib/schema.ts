import { z } from "zod";

export const RiskLevel = z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]);
export type RiskLevel = z.infer<typeof RiskLevel>;

// Each screening layer (BLAST, domain annotation, structure, etc.) will
// append an entry here. Phase 0 has no layers — the model reasons from
// training knowledge only.
export const ScreeningLayer = z.object({
  tool: z.string(),
  summary: z.string(),
  riskContribution: RiskLevel,
});

export const RiskAssessment = z.object({
  riskLevel: RiskLevel,
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  reasoning: z.string(),
  flags: z.array(z.string()).optional(),
  screeningLayers: z.array(ScreeningLayer).optional(),
});

export type RiskAssessment = z.infer<typeof RiskAssessment>;
