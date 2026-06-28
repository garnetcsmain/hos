// Anthropic (Claude) provider. Calls the Messages API over raw HTTP so the
// provider layer stays dependency-free and uniform across vendors (the same
// shape as the OpenAI adapter). To swap in the official @anthropic-ai/sdk
// later, only this file changes.
//
// Default model is claude-opus-4-8 (most capable); override per deployment with
// HOS_ANTHROPIC_MODEL — e.g. claude-haiku-4-5 for cheap high-volume scoring.

import type { AiProvider, MatchSignal, PairInput, ProviderConfig } from "../types.ts";
import { MATCH_SYSTEM_PROMPT, buildMatchUserPrompt, parseMatchResponse } from "../prompt.ts";

const ANTHROPIC_VERSION = "2023-06-01";
const TIMEOUT_MS = 20_000;

interface AnthropicTextBlock {
  type: string;
  text?: string;
}
interface AnthropicResponse {
  content?: AnthropicTextBlock[];
}

function extractText(data: AnthropicResponse): string {
  if (!Array.isArray(data.content)) return "";
  return data.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n");
}

export function createAnthropicProvider(config: ProviderConfig): AiProvider {
  const base = { provider: "anthropic", model: config.model } as const;

  return {
    name: "anthropic",
    isConfigured: () => config.apiKey.length > 0,
    async scorePair(input: PairInput): Promise<MatchSignal> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const response = await fetch(`${config.baseUrl}/v1/messages`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": config.apiKey,
            "anthropic-version": ANTHROPIC_VERSION,
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: 256,
            system: MATCH_SYSTEM_PROMPT,
            messages: [{ role: "user", content: buildMatchUserPrompt(input) }],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const detail = (await response.text()).slice(0, 200);
          return { ...base, score: 0, rationale: "", ok: false, error: `HTTP ${response.status}: ${detail}` };
        }

        const parsed = parseMatchResponse(extractText((await response.json()) as AnthropicResponse));
        if (!parsed) {
          return { ...base, score: 0, rationale: "", ok: false, error: "unparseable model response" };
        }
        return { ...base, score: parsed.score, rationale: parsed.rationale, ok: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ...base, score: 0, rationale: "", ok: false, error: message };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
