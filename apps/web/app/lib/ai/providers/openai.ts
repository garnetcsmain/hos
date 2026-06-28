// OpenAI-compatible provider (Chat Completions). Raw HTTP, same shape as the
// Anthropic adapter, so the matching layer can run several providers at once.
// Works with any OpenAI-compatible endpoint via HOS_OPENAI_BASE_URL.

import type { AiProvider, MatchSignal, PairInput, ProviderConfig } from "../types.ts";
import { MATCH_SYSTEM_PROMPT, buildMatchUserPrompt, parseMatchResponse } from "../prompt.ts";

const TIMEOUT_MS = 20_000;

interface OpenAiResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export function createOpenAiProvider(config: ProviderConfig): AiProvider {
  const base = { provider: "openai", model: config.model } as const;

  return {
    name: "openai",
    isConfigured: () => config.apiKey.length > 0,
    async scorePair(input: PairInput): Promise<MatchSignal> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: 256,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: MATCH_SYSTEM_PROMPT },
              { role: "user", content: buildMatchUserPrompt(input) },
            ],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const detail = (await response.text()).slice(0, 200);
          return { ...base, score: 0, rationale: "", ok: false, error: `HTTP ${response.status}: ${detail}` };
        }

        const data = (await response.json()) as OpenAiResponse;
        const text = data.choices?.[0]?.message?.content ?? "";
        const parsed = parseMatchResponse(text);
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
