// Provider configuration, driven entirely by environment variables so keys can
// be added later without code changes, and so SEVERAL providers can run at once.
//
//   HOS_AI_PROVIDERS   optional CSV to select/order providers, e.g.
//                      "anthropic,openai". If unset, providers are auto-enabled
//                      by the presence of their API key.
//   ANTHROPIC_API_KEY  enables the Anthropic provider
//   OPENAI_API_KEY     enables the OpenAI provider
//   HOS_<NAME>_MODEL   overrides the model id for a provider
//   HOS_<NAME>_BASE_URL overrides the API base URL (proxies/self-host)
//
// No keys configured => the list is empty and the system runs baseline-only.

import type { ProviderConfig } from "./types.ts";

interface ProviderDefaults {
  model: string;
  baseUrl: string;
  apiKeyEnv: string;
}

const PROVIDER_DEFAULTS: Record<string, ProviderDefaults> = {
  // Default to the most capable model for correctness on life-critical matches.
  // For high-volume pairwise scoring where cost matters, override with
  // HOS_ANTHROPIC_MODEL=claude-haiku-4-5 (fast and inexpensive).
  anthropic: {
    model: "claude-opus-4-8",
    baseUrl: "https://api.anthropic.com",
    apiKeyEnv: "ANTHROPIC_API_KEY",
  },
  openai: {
    model: "gpt-4o-mini",
    baseUrl: "https://api.openai.com",
    apiKeyEnv: "OPENAI_API_KEY",
  },
  // `mock` has no real key; it is enabled only when explicitly listed in
  // HOS_AI_PROVIDERS, for local testing of the AI path without a key.
  mock: { model: "mock@v1", baseUrl: "", apiKeyEnv: "HOS_MOCK_AI" },
};

function selectedNames(): string[] {
  const explicit = (process.env.HOS_AI_PROVIDERS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (explicit.length > 0) return explicit;

  const auto: string[] = [];
  if (process.env.ANTHROPIC_API_KEY) auto.push("anthropic");
  if (process.env.OPENAI_API_KEY) auto.push("openai");
  return auto;
}

const upper = (name: string): string => name.toUpperCase().replace(/[^A-Z0-9]/g, "_");

export function loadProviderConfigs(): ProviderConfig[] {
  const configs: ProviderConfig[] = [];
  for (const name of selectedNames()) {
    const defaults = PROVIDER_DEFAULTS[name];
    if (!defaults) continue;
    const apiKey = name === "mock" ? "mock" : process.env[defaults.apiKeyEnv] ?? "";
    configs.push({
      name,
      apiKey,
      model: process.env[`HOS_${upper(name)}_MODEL`] ?? defaults.model,
      baseUrl: process.env[`HOS_${upper(name)}_BASE_URL`] ?? defaults.baseUrl,
    });
  }
  return configs;
}
