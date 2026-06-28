import { test } from "node:test";
import assert from "node:assert/strict";

import { activeProviders, aiEnabled } from "./registry.ts";
import type { PairInput } from "./types.ts";

const pair: PairInput = {
  missing: {
    id: "MP-1",
    fullName: "Carlos Perez",
    age: 34,
    sex: "M",
    lastSeenLocation: "La Guaira",
    city: "La Guaira",
    lastSeenAt: "2026-06-24",
    description: "green jacket",
  },
  found: {
    id: "FP-1",
    fullName: "Carlos Perez",
    age: 35,
    sex: "M",
    foundLocation: "Shelter 17",
    city: "Maiquetia",
    foundAt: "2026-06-26",
    description: "green jacket",
  },
};

test("no providers configured => baseline only", () => {
  delete process.env.HOS_AI_PROVIDERS;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  assert.equal(activeProviders().length, 0);
  assert.equal(aiEnabled(), false);
});

test("mock provider can be enabled and scores deterministically", async () => {
  process.env.HOS_AI_PROVIDERS = "mock";
  const providers = activeProviders();
  assert.equal(providers.length, 1);
  assert.equal(aiEnabled(), true);

  const signal = await providers[0].scorePair(pair);
  assert.equal(signal.ok, true);
  assert.equal(signal.provider, "mock");
  assert.equal(signal.score, 1); // identical names

  delete process.env.HOS_AI_PROVIDERS;
});
