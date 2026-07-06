// Public family-facing lookup. This is a CASE-NUMBER lookup, not a name browser:
// a bare name or city must not confirm a specific person's presence or status to
// an unauthenticated caller. This closes the re-identification oracle named as a
// CRITICAL risk since HOS-2026-002-D3 and re-flagged by HOS-2026-008-D4: the
// previous implementation matched the query against each record's FULL name and
// city, so anyone could type a full name and confirm that exact person is in the
// system. Now only a caller who already holds a case number (the family who
// filed the report, or was given it) can confirm a case exists, and even then
// sees only the least-PII projection (AGENTS.md §4).
//
// The coarse first-name registry listing served by /api/missing and /api/found
// is a separate, lesser surface (first name only, no surname); enforcing tiered
// visibility on it is tracked on HOS-2026-001-08 and is blocked on the role
// primitive + Postgres (BLK-001), not on this change.

import { listMissing } from "../repositories/missingReports.ts";
import { listFound } from "../repositories/foundReports.ts";
import { toPublicFound, toPublicMissing } from "../domain/projections.ts";
import type { PublicFound, PublicMissing } from "../domain/projections.ts";

export interface PublicSearchResult {
  missing: PublicMissing[];
  found: PublicFound[];
}

// Case numbers look like MP-VE-A1B2C3 / FP-VE-A1B2C3 (see ids.ts). The random
// 6-char code is the shared secret; the MP-VE / FP-VE prefix is guessable, so
// the code is the minimum a caller must know to confirm a case.
const CASE_CODE_LENGTH = 6;

/** Uppercase and keep only [A-Z0-9], so "mp-ve a1b2c3", "MPVEA1B2C3" and the
 *  bare "a1b2c3" all compare on the same footing. */
export function normalizeCaseNumber(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** True only when the normalized query is a record's full case number or its
 *  6-char code — never a name or city substring, and never a short prefix. */
export function caseNumberMatches(id: string, normalizedQuery: string): boolean {
  const normId = normalizeCaseNumber(id);
  return normId === normalizedQuery || normId.slice(-CASE_CODE_LENGTH) === normalizedQuery;
}

export async function searchPublic(query: string): Promise<PublicSearchResult> {
  const q = normalizeCaseNumber(query);
  // Require at least the full random code, so a partial prefix ("MP", "VE")
  // cannot browse the registry.
  if (q.length < CASE_CODE_LENGTH) return { missing: [], found: [] };

  const [allMissing, allFound] = await Promise.all([listMissing(), listFound()]);

  return {
    missing: allMissing.filter((r) => caseNumberMatches(r.id, q)).map(toPublicMissing),
    found: allFound.filter((r) => caseNumberMatches(r.id, q)).map(toPublicFound),
  };
}
