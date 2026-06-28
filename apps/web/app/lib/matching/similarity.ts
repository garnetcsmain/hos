// Pure string-similarity primitives used by the matching engine.
// No external dependencies, no I/O — every function here is deterministic and
// unit-tested, because this is the highest-risk code in the system.

import { nameTokens, traitTokens } from "./normalize.ts";
import { expandName } from "./nicknames.ts";

/** Classic Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Normalized 0..1 similarity (1 = identical) derived from edit distance. */
export function levenshteinRatio(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const max = Math.max(a.length, b.length);
  return max === 0 ? 1 : 1 - levenshtein(a, b) / max;
}

/** Agreement strength between two single name tokens, 0..1.
 *  1.0 when they share a canonical form (nickname/diminutive); otherwise a
 *  spelling-distance ratio, with weak partials floored to 0 to avoid noise. */
function tokenStrength(a: string, b: string): number {
  if (a === b) return 1;
  const expandedA = new Set(expandName(a));
  for (const form of expandName(b)) {
    if (expandedA.has(form)) return 1;
  }
  const ratio = levenshteinRatio(a, b);
  return ratio >= 0.5 ? ratio : 0;
}

// Cost of an extra trailing token in the LONGER name when the shorter name is
// fully contained in it — e.g. "Jose Garcia" vs "Jose Garcia Perez", where a
// family reported one apellido and a shelter logged two. An omitted maternal
// apellido is the single most common Spanish/Venezuelan intake mismatch, so the
// extra token costs less than a full mismatch (< 1) but is not free (> 0): the
// extra surname still carries a little real uncertainty.
const EXTRA_SURNAME_COST = 0.5;

/** Greedy best-pairing assignment score between two name-token lists, 0..1,
 *  with Spanish-surname-aware normalization:
 *
 *   - **Asymmetric subset** — when every token of the shorter name matches a
 *     token in the longer one AND at least a given name + one surname agree, the
 *     extra trailing token(s) in the longer name are only lightly penalized
 *     (`EXTRA_SURNAME_COST`). "Jose Garcia" vs "Jose Garcia Perez" scores ~0.8,
 *     not 0.67. A lone matched token (e.g. just a given name) is kept weak — too
 *     many people share a first name — by normalizing over the longer list.
 *
 *   - **Conflict** — when BOTH names carry an unmatched token, each side has a
 *     positively *different* name component (e.g. distinct paternal apellido),
 *     which is evidence against a match, not merely missing data. We normalize
 *     by the union (matched / |A∪B|) so "Jose Garcia" vs "Jose Martinez" stays
 *     low (~0.33) and never rises above the naive score it had before. */
function assignmentScore(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const pairs: Array<{ i: number; j: number; strength: number }> = [];
  for (let i = 0; i < tokensA.length; i += 1) {
    for (let j = 0; j < tokensB.length; j += 1) {
      pairs.push({ i, j, strength: tokenStrength(tokensA[i], tokensB[j]) });
    }
  }
  pairs.sort((x, y) => y.strength - x.strength);

  const usedA = new Set<number>();
  const usedB = new Set<number>();
  let matched = 0;
  let matchedCount = 0;
  for (const { i, j, strength } of pairs) {
    if (strength <= 0) break;
    if (usedA.has(i) || usedB.has(j)) continue;
    usedA.add(i);
    usedB.add(j);
    matched += strength;
    matchedCount += 1;
  }

  const shorter = Math.min(tokensA.length, tokensB.length);
  const longer = Math.max(tokensA.length, tokensB.length);
  const unmatchedShort = shorter - matchedCount; // tokens the shorter name could not place

  // Asymmetric subset: the shorter name is fully contained in the longer one.
  if (unmatchedShort === 0) {
    const extraTokens = longer - matchedCount; // extra apellido(s) only the longer name has
    // Be lenient only once a given name + at least one surname agree; otherwise
    // (a single matched token) keep it weak by normalizing over the longer list.
    const denom = shorter >= 2 ? shorter + EXTRA_SURNAME_COST * extraTokens : longer;
    return matched / denom;
  }

  // Conflict: both names carry a distinct, unmatched component — normalize by the
  // union so a genuinely different surname is not over-credited.
  return matched / (tokensA.length + tokensB.length - matchedCount);
}

/** Similarity 0..1 between two person names, accent- and nickname-aware.
 *  Returns null when either name has no usable tokens (not assessable). */
export function nameSimilarity(a: string, b: string): number | null {
  const tokensA = nameTokens(a);
  const tokensB = nameTokens(b);
  if (tokensA.length === 0 || tokensB.length === 0) return null;
  return assignmentScore(tokensA, tokensB);
}

/** Jaccard overlap 0..1 of two trait/description token sets.
 *  Returns null when either side has no usable trait tokens. */
export function traitSimilarity(a: string, b: string): number | null {
  const setA = new Set(traitTokens(a));
  const setB = new Set(traitTokens(b));
  if (setA.size === 0 || setB.size === 0) return null;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
