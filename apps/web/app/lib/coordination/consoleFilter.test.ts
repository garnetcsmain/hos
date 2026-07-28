import { test } from "node:test";
import assert from "node:assert/strict";

import { matchesQuery, normalizeSearch } from "./consoleFilter.ts";

test("normalizeSearch strips accents and lowercases", () => {
  assert.equal(normalizeSearch("Médico"), "medico");
  assert.equal(normalizeSearch("  Chacaó  "), "chacao");
  assert.equal(normalizeSearch("AGUA"), "agua");
});

test("blank query matches everything", () => {
  assert.equal(matchesQuery(["Agua", "Chacao"], ""), true);
  assert.equal(matchesQuery(["Agua", "Chacao"], "   "), true);
});

test("accent-insensitive match both directions", () => {
  // Query without accent finds an accented field...
  assert.equal(matchesQuery(["Médico", "Baruta"], "medico"), true);
  // ...and an accented query finds the same field.
  assert.equal(matchesQuery(["Medico", "Baruta"], "médico"), true);
});

test("multi-word query ANDs its tokens across fields", () => {
  const fields = ["Agua", "Chacao", "Cruz Roja"];
  assert.equal(matchesQuery(fields, "agua chacao"), true);
  assert.equal(matchesQuery(fields, "agua baruta"), false); // second token absent
});

test("matches numbers and units", () => {
  assert.equal(matchesQuery([200, "botellones", "Agua"], "200"), true);
  assert.equal(matchesQuery([200, "botellones", "Agua"], "botellones"), true);
});

test("substring tokens match (partial typing narrows live)", () => {
  assert.equal(matchesQuery(["Rescate", "Petare"], "resc"), true);
  assert.equal(matchesQuery(["Rescate", "Petare"], "peta"), true);
});

test("null and undefined fields are skipped, never crash", () => {
  assert.equal(matchesQuery(["Agua", null, undefined, ""], "agua"), true);
  assert.equal(matchesQuery([null, undefined], "agua"), false);
});

test("a token absent from every field fails the whole match", () => {
  assert.equal(matchesQuery(["Comida", "Sucre"], "comida inexistente"), false);
});
