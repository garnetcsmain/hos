// Pluggable cloud-AI layer for the matching engine.
//
// Design intent (per the founder): the system must accept ANY API key given
// later, and possibly SEVERAL providers at once. So matching is layered:
//   1. A deterministic local baseline (matching/engine.ts) that always works,
//      offline, with no key — a fast pre-filter and permanent fallback.
//   2. Zero or more external AI providers (this layer) that, when configured
//      with a key, produce an independent same-person signal which is blended
//      with the baseline.
//
// Privacy (AGENTS.md §5): providers receive only the fields needed to judge a
// match — never family contact, medical/sensitive notes, or precise live
// location. What is sent is logged.

import type { MatchableFound, MatchableMissing } from "@/app/lib/domain/types";

/** The minimal, PII-minimized pair handed to an external model. */
export interface PairInput {
  missing: MatchableMissing & { id: string };
  found: MatchableFound & { id: string };
}

/** One provider's independent assessment of whether the pair is the same
 *  person. `score` is 0..1. `ok=false` means the call failed and the signal
 *  must be ignored by the blender (the baseline still stands). */
export interface MatchSignal {
  provider: string;
  model: string;
  score: number;
  rationale: string;
  ok: boolean;
  error?: string;
}

export interface AiProvider {
  readonly name: string;
  /** True when this provider has the credentials/config it needs to run. */
  isConfigured(): boolean;
  /** Independent same-person assessment for one candidate pair. Must never
   *  throw — return a signal with ok:false on any failure. */
  scorePair(input: PairInput): Promise<MatchSignal>;
}

export interface ProviderConfig {
  name: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
}
