import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeText, nameTokens, traitTokens, daysBetween } from "./normalize.ts";
import { expandName } from "./nicknames.ts";
import { levenshtein, levenshteinRatio, nameSimilarity, traitSimilarity } from "./similarity.ts";
import { scoreMatch, rankFoundForMissing, MATCH_FLOOR, TOP_K } from "./engine.ts";
import type { MatchableMissing, MatchableFound } from "@/app/lib/domain/types";

function missing(overrides: Partial<MatchableMissing> = {}): MatchableMissing {
  return {
    fullName: "Carlos Perez",
    age: 34,
    sex: "M",
    lastSeenLocation: "near plaza La Guaira",
    city: "La Guaira",
    lastSeenAt: "2026-06-24",
    description: "tall man, green jacket, scar on hand",
    ...overrides,
  };
}

function found(overrides: Partial<MatchableFound> = {}): MatchableFound {
  return {
    fullName: "Carlos Perez",
    age: 35,
    sex: "M",
    foundLocation: "Shelter 17, Maiquetia",
    city: "Maiquetia",
    foundAt: "2026-06-26",
    description: "tall green jacket scar on hand",
    ...overrides,
  };
}

test("normalizeText strips accents, case, and punctuation", () => {
  assert.equal(normalizeText("José Ángel, Pérez!"), "jose angel perez");
  assert.equal(normalizeText("  La   Guaíra  "), "la guaira");
  assert.equal(normalizeText(null), "");
});

test("nameTokens drops particles and initials", () => {
  assert.deepEqual(nameTokens("María de los Ángeles R."), ["maria", "angeles"]);
});

test("traitTokens drops generic stopwords", () => {
  assert.deepEqual(traitTokens("una persona con mochila roja"), ["mochila", "roja"]);
});

test("daysBetween is signed and null-safe", () => {
  assert.equal(daysBetween("2026-06-24", "2026-06-26"), 2);
  assert.equal(daysBetween("2026-06-26", "2026-06-24"), -2);
  assert.equal(daysBetween(null, "2026-06-26"), null);
});

test("nickname expansion resolves hipocoristicos", () => {
  assert.ok(expandName("pepe").includes("jose"));
  assert.ok(expandName("nacho").includes("ignacio"));
  assert.deepEqual(expandName("carlos"), ["carlos"]);
});

test("levenshtein and ratio behave", () => {
  assert.equal(levenshtein("perez", "peres"), 1);
  assert.equal(levenshtein("abc", "abc"), 0);
  assert.ok(levenshteinRatio("perez", "peres") > 0.79);
  assert.equal(levenshteinRatio("", ""), 1);
});

test("nameSimilarity: identical is 1, nickname matches high, unrelated low", () => {
  assert.equal(nameSimilarity("Carlos Perez", "Carlos Perez"), 1);
  assert.ok((nameSimilarity("Pepe Gomez", "Jose Gomez") ?? 0) >= 0.9);
  assert.ok((nameSimilarity("Carlos Perez", "Luis Ramirez") ?? 1) < 0.2);
});

test("nameSimilarity: partial name (subset) scores around half", () => {
  const s = nameSimilarity("Carlos", "Carlos Perez") ?? 0;
  assert.ok(s > 0.4 && s <= 0.55, `expected ~0.5, got ${s}`);
});

test("nameSimilarity returns null when a name is empty (unidentified)", () => {
  assert.equal(nameSimilarity("", "Carlos Perez"), null);
});

test("traitSimilarity is null when one side has no traits", () => {
  assert.equal(traitSimilarity("", "green jacket"), null);
  assert.ok((traitSimilarity("green jacket scar", "scar green jacket") ?? 0) > 0.9);
});

test("strong match: same person across La Guaira -> Maiquetia shelter", () => {
  const { score, factors } = scoreMatch(missing(), found());
  assert.ok(score >= 65, `expected strong score, got ${score}`);
  assert.ok(factors.some((f) => f.key === "name" && f.score === 1));
});

test("unidentified found person matched by age, sex, location, traits", () => {
  const m = missing({
    fullName: "Ana Rosa Mendoza",
    age: 64,
    sex: "F",
    lastSeenLocation: "Caracas West bus stop",
    city: "Caracas",
    lastSeenAt: "2026-06-25",
    description: "elderly woman, diabetic, blue dress",
  });
  const f = found({
    fullName: "",
    age: 66,
    sex: "F",
    foundLocation: "Hospital Caracas",
    city: "Caracas",
    foundAt: "2026-06-26",
    description: "unidentified elderly woman blue dress confused",
  });
  const { score, factors } = scoreMatch(m, f);
  assert.ok(score >= 50, `expected matchable without name, got ${score}`);
  assert.ok(!factors.some((fc) => fc.key === "name"), "name factor should be skipped");
});

test("adversarial: identical common name but 45-year age gap is rejected", () => {
  const m = missing({
    fullName: "Maria Gonzalez",
    age: 25,
    sex: "F",
    lastSeenLocation: "Petare",
    city: "Caracas",
    description: "student, red backpack",
  });
  const f = found({
    fullName: "Maria Gonzalez",
    age: 70,
    sex: "F",
    foundLocation: "Hospital Valencia",
    city: "Valencia",
    description: "elderly, cane, gray hair",
  });
  const { score, factors } = scoreMatch(m, f);
  assert.ok(score < MATCH_FLOOR, `expected below floor, got ${score}`);
  assert.ok(factors.some((fc) => fc.key === "age_conflict"), "age conflict flag should be present");
});

test("adversarial: sex conflict cuts the score hard", () => {
  const withConflict = scoreMatch(missing({ sex: "F" }), found({ sex: "M" }));
  const baseline = scoreMatch(missing(), found());
  assert.ok(withConflict.score < baseline.score * 0.6, "sex conflict must reduce score sharply");
  assert.ok(withConflict.factors.some((f) => f.key === "sex_conflict"));
});

test("rankFoundForMissing orders by score, respects floor and TOP_K", () => {
  const m = missing();
  const candidates: MatchableFound[] = [
    found(), // strong
    found({ fullName: "Carlos Perez", age: 34, description: "green jacket scar" }), // strong
    found({ fullName: "Pedro Gomez", age: 70, sex: "M", city: "Valencia", foundLocation: "x", description: "nothing alike" }), // weak
  ];
  const ranked = rankFoundForMissing(m, candidates);
  assert.ok(ranked.length >= 1 && ranked.length <= TOP_K);
  assert.ok(ranked.every((r) => r.result.score >= MATCH_FLOOR));
  for (let i = 1; i < ranked.length; i += 1) {
    assert.ok(ranked[i - 1].result.score >= ranked[i].result.score, "must be sorted desc");
  }
});
