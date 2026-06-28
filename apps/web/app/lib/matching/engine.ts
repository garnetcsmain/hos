// The AI matching engine — the heart of HOS Phase 0.
//
// It compares a missing-person report against a found-person report and
// produces a confidence score with a transparent, per-factor evidence chain.
// It is deterministic and explainable on purpose: in a life-critical system,
// a coordinator must be able to see *why* two reports were linked.
//
// Hard rule (AGENTS.md): a score here is a CANDIDATE TO VERIFY, never a
// confirmation. Nothing in this module marks a person as found.

import type { MatchableFound, MatchableMissing, MatchFactor } from "@/app/lib/domain/types";
import { daysBetween, normalizeText } from "./normalize.ts";
import { nameSimilarity, traitSimilarity } from "./similarity.ts";

export const MODEL_VERSION = "rule-engine@v1";

/** Minimum overall score (0..100) for a pair to be stored as a candidate.
 *  Below this, no link is asserted — the reports simply stay unmatched. */
export const MATCH_FLOOR = 45;

/** Max candidates retained per missing report, to keep the queue reviewable. */
export const TOP_K = 5;

type Assessable = { score: number | null; detail: string };

interface FactorSpec {
  key: string;
  label: string;
  weight: number;
  assess: (missing: MatchableMissing, found: MatchableFound) => Assessable;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Jaccard overlap of location tokens (city + free-text place), 0..1. */
function locationOverlap(a: string, b: string): number | null {
  const tokensA = new Set(normalizeText(a).split(" ").filter((t) => t.length > 1));
  const tokensB = new Set(normalizeText(b).split(" ").filter((t) => t.length > 1));
  if (tokensA.size === 0 || tokensB.size === 0) return null;
  let shared = 0;
  for (const token of tokensA) if (tokensB.has(token)) shared += 1;
  const union = tokensA.size + tokensB.size - shared;
  return union === 0 ? 0 : shared / union;
}

const FACTORS: FactorSpec[] = [
  {
    key: "name",
    label: "Name similarity",
    weight: 0.34,
    assess: (m, f) => {
      const score = nameSimilarity(m.fullName, f.fullName);
      if (score === null) {
        return { score: null, detail: "One report has no usable name" };
      }
      return { score, detail: `Name agreement ${(score * 100).toFixed(0)}% (accent + nickname + surname aware)` };
    },
  },
  {
    key: "location",
    label: "Location proximity",
    weight: 0.2,
    assess: (m, f) => {
      const score = locationOverlap(`${m.city} ${m.lastSeenLocation}`, `${f.city} ${f.foundLocation}`);
      if (score === null) return { score: null, detail: "Location missing on one side" };
      return { score, detail: `Shared location terms ${(score * 100).toFixed(0)}%` };
    },
  },
  {
    key: "age",
    label: "Age proximity",
    weight: 0.16,
    assess: (m, f) => {
      if (m.age === null || f.age === null) return { score: null, detail: "Age unknown on one side" };
      const diff = Math.abs(m.age - f.age);
      const score = clamp01(1 - diff / 12);
      return { score, detail: `${diff} year difference (${m.age} vs ${f.age})` };
    },
  },
  {
    key: "sex",
    label: "Sex",
    weight: 0.1,
    assess: (m, f) => {
      if (m.sex === "U" || f.sex === "U") return { score: null, detail: "Sex unspecified on one side" };
      const match = m.sex === f.sex;
      return { score: match ? 1 : 0, detail: match ? "Sex matches" : "Sex differs" };
    },
  },
  {
    key: "traits",
    label: "Identifying traits",
    weight: 0.12,
    assess: (m, f) => {
      const score = traitSimilarity(m.description, f.description);
      if (score === null) return { score: null, detail: "No comparable trait text" };
      return { score, detail: `Trait overlap ${(score * 100).toFixed(0)}%` };
    },
  },
  {
    key: "time",
    label: "Timeline plausibility",
    weight: 0.08,
    assess: (m, f) => {
      const d = daysBetween(m.lastSeenAt, f.foundAt);
      if (d === null) return { score: null, detail: "Missing date on one side" };
      if (d < -3) return { score: 0.15, detail: `Found ${Math.abs(d)}d before last seen (implausible)` };
      const score = clamp01(1 - Math.max(0, d) / 60);
      const score2 = Math.max(0.3, score);
      return { score: score2, detail: `Found ${d}d after last seen` };
    },
  },
];

export interface MatchResult {
  score: number;
  factors: MatchFactor[];
}

/** Hard-negative penalties. A strongly matching name must not, on its own,
 *  carry a pair over the threshold when other evidence actively contradicts
 *  it (the classic "two different people share a common name" false positive).
 *  Penalties multiply the overall score and are surfaced as zero-weight flags
 *  in the evidence chain so a coordinator sees why the score was cut. */
function contradictionPenalty(
  missing: MatchableMissing,
  found: MatchableFound,
): { multiplier: number; flags: MatchFactor[] } {
  const flags: MatchFactor[] = [];
  let multiplier = 1;

  if (missing.sex !== "U" && found.sex !== "U" && missing.sex !== found.sex) {
    multiplier *= 0.35;
    flags.push({ key: "sex_conflict", label: "Sex conflict", weight: 0, score: 0.35, detail: "Reported sex differs" });
  }

  if (missing.age !== null && found.age !== null) {
    const diff = Math.abs(missing.age - found.age);
    if (diff > 30) {
      multiplier *= 0.4;
      flags.push({ key: "age_conflict", label: "Age conflict", weight: 0, score: 0.4, detail: `${diff} year age gap` });
    } else if (diff > 18) {
      multiplier *= 0.65;
      flags.push({ key: "age_conflict", label: "Age conflict", weight: 0, score: 0.65, detail: `${diff} year age gap` });
    }
  }

  return { multiplier, flags };
}

/** Score a missing↔found pair. Returns an overall 0..100 confidence and the
 *  per-factor breakdown (the evidence chain), weighted only over the factors
 *  that could actually be assessed from the available data, then reduced by
 *  any hard-negative contradiction penalties. */
export function scoreMatch(missing: MatchableMissing, found: MatchableFound): MatchResult {
  const factors: MatchFactor[] = [];
  let weightedSum = 0;
  let weightTotal = 0;

  for (const spec of FACTORS) {
    const { score, detail } = spec.assess(missing, found);
    if (score === null) continue;
    factors.push({ key: spec.key, label: spec.label, weight: spec.weight, score, detail });
    weightedSum += score * spec.weight;
    weightTotal += spec.weight;
  }

  const base = weightTotal === 0 ? 0 : weightedSum / weightTotal;
  const { multiplier, flags } = contradictionPenalty(missing, found);
  factors.push(...flags);

  return { score: Math.round(base * multiplier * 100), factors };
}

export interface RankedCandidate<F> {
  found: F;
  result: MatchResult;
}

/** Rank found reports against one missing report, keeping only those at or
 *  above MATCH_FLOOR, best first, capped at TOP_K. */
export function rankFoundForMissing<F extends MatchableFound>(
  missing: MatchableMissing,
  founds: F[],
): Array<RankedCandidate<F>> {
  return founds
    .map((found) => ({ found, result: scoreMatch(missing, found) }))
    .filter((entry) => entry.result.score >= MATCH_FLOOR)
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, TOP_K);
}
