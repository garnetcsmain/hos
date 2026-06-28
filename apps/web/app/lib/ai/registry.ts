// Builds the active set of AI providers from environment config. Supports zero
// providers (baseline-only), one, or several at once. The matcher blends every
// configured provider's signal with the deterministic baseline.

import { loadProviderConfigs } from "./config.ts";
import { createAnthropicProvider } from "./providers/anthropic.ts";
import { createOpenAiProvider } from "./providers/openai.ts";
import { createMockProvider } from "./providers/mock.ts";
import type { AiProvider, ProviderConfig } from "./types.ts";

function build(config: ProviderConfig): AiProvider | null {
  switch (config.name) {
    case "anthropic":
      return createAnthropicProvider(config);
    case "openai":
      return createOpenAiProvider(config);
    case "mock":
      return createMockProvider(config);
    default:
      return null;
  }
}

/** Providers that are both selected and fully configured (have a key). */
export function activeProviders(): AiProvider[] {
  return loadProviderConfigs()
    .map(build)
    .filter((provider): provider is AiProvider => provider !== null && provider.isConfigured());
}

export function aiEnabled(): boolean {
  return activeProviders().length > 0;
}
