import { test } from "node:test";
import assert from "node:assert/strict";

import { blendScore } from "./blend.ts";
import type { MatchSignal } from "./types.ts";

function signal(score: number, ok = true): MatchSignal {
  return { provider: "mock", model: "m", score, rationale: "r", ok };
}

test("blend with no signals returns the baseline unchanged", () => {
  const result = blendScore(72, []);
  assert.equal(result.score, 72);
  assert.equal(result.factors.length, 0);
});

test("blend ignores failed signals", () => {
  const result = blendScore(72, [signal(0.1, false)]);
  assert.equal(result.score, 72);
  assert.equal(result.factors.length, 0);
});

test("blend is a 50/50 mix of baseline and mean AI score", () => {
  const result = blendScore(50, [signal(1)]);
  assert.equal(result.score, 75); // 0.5*50 + 0.5*100
  assert.equal(result.factors.length, 1);
  assert.equal(result.factors[0].key, "ai:mock");
});

test("blend averages multiple providers", () => {
  const result = blendScore(40, [signal(1), signal(0)]);
  // mean AI = 0.5 -> 0.5*40 + 0.5*50 = 45
  assert.equal(result.score, 45);
  assert.equal(result.factors.length, 2);
});

test("blend clamps to 0..100", () => {
  assert.equal(blendScore(100, [signal(1)]).score, 100);
  assert.equal(blendScore(0, [signal(0)]).score, 0);
});
