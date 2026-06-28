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

/** Greedy best-pairing assignment score between two token lists, normalized by
 *  the longer list so that extra/unmatched tokens reduce the score. */
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
  let total = 0;
  for (const { i, j, strength } of pairs) {
    if (strength <= 0) break;
    if (usedA.has(i) || usedB.has(j)) continue;
    usedA.add(i);
    usedB.add(j);
    total += strength;
  }
  return total / Math.max(tokensA.length, tokensB.length);
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
