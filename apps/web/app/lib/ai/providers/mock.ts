// Mock provider: lets us exercise the full AI path (config -> registry ->
// augment -> blend -> event log) without any real key. Enable with
// HOS_AI_PROVIDERS=mock. Its score is derived deterministically from name
// similarity so tests are stable.

import type { AiProvider, PairInput, ProviderConfig } from "../types.ts";
import { nameSimilarity } from "../../matching/similarity.ts";

export function createMockProvider(config: ProviderConfig): AiProvider {
  return {
    name: "mock",
    isConfigured: () => true,
    async scorePair(input: PairInput) {
      const name = nameSimilarity(input.missing.fullName, input.found.fullName);
      const score = name ?? 0.5;
      return {
        provider: "mock",
        model: config.model,
        score,
        rationale: "deterministic mock based on name similarity",
        ok: true,
      };
    },
  };
}
