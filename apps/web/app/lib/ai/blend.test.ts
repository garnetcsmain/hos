import { test } from "node:test";
import assert from "node:assert/strict";

import { blendScore } from "./blend.ts";
import { MATCH_FLOOR } from "../matching/engine.ts";
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

test("a confident AI signal can NEVER raise the score above the baseline (baseline is the ceiling)", () => {
  // Even a perfect external signal cannot lift the deterministic score.
  const result = blendScore(50, [signal(1)]);
  assert.equal(result.score, 50);
  assert.equal(result.factors.length, 1);
  assert.equal(result.factors[0].key, "ai:mock");
});

test("a doubtful AI signal demotes the score", () => {
  // baseline 80, AI 0 -> mixed = 0.5*80 + 0.5*0 = 40 -> min(80,40) = 40.
  const result = blendScore(80, [signal(0)]);
  assert.equal(result.score, 40);
});

test("AI can never lift a sub-floor pair over the match floor", () => {
  // baseline 30 (below floor), perfect AI -> mixed 65, but clamped to baseline 30.
  const result = blendScore(30, [signal(1)]);
  assert.equal(result.score, 30);
  assert.ok(result.score < MATCH_FLOOR);
});

test("blend stays within 0..100", () => {
  assert.equal(blendScore(100, [signal(1)]).score, 100);
  assert.equal(blendScore(0, [signal(0)]).score, 0);
});
