// Base-rate / name-commonness signal (Board HOS-2026-002-D1).
//
// A high match score on a COMMON name is far weaker evidence than the same
// score on a rare one: many distinct people share "Jose Garcia", so a strong
// name agreement there is expected by chance, not a strong identity signal.
// This computes, for a candidate, how many OTHER open reports share its name,
// so a coordinator can absorb the common-name collision risk before trusting a
// high score (the engine's named "wrong morgue" failure mode).
//
// It deliberately does NOT change the score: the board asked to inform the
// human, not to silently re-weight the engine here.

import { nameSimilarity } from "./similarity.ts";

/** Name agreement at or above this counts as "the same name" for the base-rate.
 *  High enough that an incidental shared given name alone does not inflate the
 *  count, low enough that a dropped maternal apellido ("Jose Garcia" vs "Jose
 *  Garcia Perez", ~0.8) still counts as the same name. */
export const SHARED_NAME_THRESHOLD = 0.7;

/** Count how many of `otherNames` share `referenceName` (name agreement at or
 *  above the threshold). The caller is responsible for excluding the
 *  candidate's own two reports from `otherNames`. */
export function countSharedName(
  referenceName: string,
  otherNames: string[],
  threshold: number = SHARED_NAME_THRESHOLD,
): number {
  let count = 0;
  for (const name of otherNames) {
    const sim = nameSimilarity(referenceName, name);
    if (sim !== null && sim >= threshold) count += 1;
  }
  return count;
}
