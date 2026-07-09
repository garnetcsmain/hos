import { test } from "node:test";
import assert from "node:assert/strict";

import { caseNumberMatches, normalizeCaseNumber } from "./search.ts";

// HOS-2026-008-D4: the public search must be a case-number lookup, never a name
// browser. These tests pin the closed re-identification oracle.

test("search: matches a full case number regardless of dashes or case", () => {
  const q = normalizeCaseNumber("mp-ve-a1b2c3");
  assert.equal(caseNumberMatches("MP-VE-A1B2C3", q), true);
  assert.equal(caseNumberMatches("MP-VE-A1B2C3", normalizeCaseNumber("MPVEA1B2C3")), true);
});

test("search: matches the bare 6-char case code", () => {
  assert.equal(caseNumberMatches("MP-VE-A1B2C3", normalizeCaseNumber("a1b2c3")), true);
  assert.equal(caseNumberMatches("FP-VE-9Z8Y7X", normalizeCaseNumber("9Z8Y7X")), true);
});

test("search: a name or city never confirms presence (the closed oracle)", () => {
  // These used to hit via the fullName + city haystack; they must now miss.
  for (const probe of ["Maria", "Caracas", "Maria Gonzalez", "Gonzalez Caracas"]) {
    assert.equal(caseNumberMatches("MP-VE-A1B2C3", normalizeCaseNumber(probe)), false);
  }
});

test("search: a partial prefix or wrong code cannot browse the registry", () => {
  assert.equal(caseNumberMatches("MP-VE-A1B2C3", normalizeCaseNumber("MP")), false);
  assert.equal(caseNumberMatches("MP-VE-A1B2C3", normalizeCaseNumber("MP-VE")), false);
  // A 6-char string of the right length but the wrong code still misses.
  assert.equal(caseNumberMatches("MP-VE-A1B2C3", normalizeCaseNumber("Z9Z9Z9")), false);
});
