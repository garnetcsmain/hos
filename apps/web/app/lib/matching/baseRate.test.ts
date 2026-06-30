import { test } from "node:test";
import assert from "node:assert/strict";

import { countSharedName, SHARED_NAME_THRESHOLD } from "./baseRate.ts";

test("base-rate: counts exact and accent-insensitive name matches", () => {
  const n = countSharedName("José García", ["Jose Garcia", "jose garcia", "Maria Lopez"]);
  assert.equal(n, 2);
});

test("base-rate: a dropped maternal apellido still counts as the same name", () => {
  // "Jose Garcia" vs "Jose Garcia Perez" scores ~0.8 (asymmetric subset).
  assert.equal(countSharedName("Jose Garcia", ["Jose Garcia Perez"]), 1);
});

test("base-rate: a different paternal apellido does NOT count", () => {
  // "Jose Garcia" vs "Jose Martinez" scores ~0.33 — a distinct surname.
  assert.equal(countSharedName("Jose Garcia", ["Jose Martinez"]), 0);
});

test("base-rate: a shared given name alone does NOT count (too common)", () => {
  // One matched token out of two is kept weak (~0.5) and stays under threshold.
  assert.equal(countSharedName("Jose Garcia", ["Jose"]), 0);
});

test("base-rate: empty corpus and unusable names yield 0", () => {
  assert.equal(countSharedName("Jose Garcia", []), 0);
  assert.equal(countSharedName("Jose Garcia", ["", "   "]), 0);
});

test("base-rate: counts every common-name collision in the pool", () => {
  const pool = ["Jose Garcia", "Jose Garcia", "Jose Garcia Perez", "Ana Mendoza"];
  assert.equal(countSharedName("Jose Garcia", pool), 3);
});

test("base-rate: threshold is configurable and gates the count", () => {
  // A lone given-name match (~0.5) is excluded at the default but included if
  // the caller lowers the bar.
  assert.equal(countSharedName("Jose Garcia", ["Jose"], 0.4), 1);
  assert.ok(SHARED_NAME_THRESHOLD > 0.5);
});
