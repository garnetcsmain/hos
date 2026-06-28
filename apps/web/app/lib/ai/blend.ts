// Blend the deterministic baseline score with external AI signals.
//
// Philosophy: the local baseline is always trustworthy and explainable; AI is a
// force multiplier, not an authority. The baseline is the CEILING — blending can
// only DEMOTE or FLAG a pair (pull the score down when a provider disagrees),
// never raise it above the deterministic score, and never lift a sub-floor pair
// over the match floor (Board HOS-2026-002-D1). With no (successful) AI signals,
// the baseline is returned unchanged.

import type { MatchFactor } from "@/app/lib/domain/types";
import type { MatchSignal } from "./types.ts";

const BASELINE_SHARE = 0.5;
const AI_SHARE = 0.5;

export interface BlendResult {
  score: number;
  /** AI contributions, as zero-or-shared-weight entries in the evidence chain. */
  factors: MatchFactor[];
}

export function blendScore(baseline: number, signals: MatchSignal[]): BlendResult {
  const usable = signals.filter((s) => s.ok);
  if (usable.length === 0) return { score: baseline, factors: [] };

  const meanAi = usable.reduce((sum, s) => sum + s.score, 0) / usable.length;
  const mixed = Math.round(BASELINE_SHARE * baseline + AI_SHARE * meanAi * 100);
  // Clamp to the baseline: AI may only lower the score, never raise it.
  const blended = Math.min(baseline, mixed);

  const perProviderWeight = AI_SHARE / usable.length;
  const factors: MatchFactor[] = usable.map((s) => ({
    key: `ai:${s.provider}`,
    label: `AI assessment (${s.provider})`,
    weight: perProviderWeight,
    score: s.score,
    detail: `${s.model}: ${s.rationale || `${Math.round(s.score * 100)}% same-person`}`,
  }));

  return { score: Math.min(100, Math.max(0, blended)), factors };
}
