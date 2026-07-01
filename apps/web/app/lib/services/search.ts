// Public family-facing search. Returns only least-PII projections (AGENTS.md
// §4) so a family can look up a case by name, city, or case number without
// exposing contact details, precise location, or medical notes to the open API.

import { listMissing } from "../repositories/missingReports.ts";
import { listFound } from "../repositories/foundReports.ts";
import { toPublicFound, toPublicMissing } from "../domain/projections.ts";
import { normalizeText } from "../matching/normalize.ts";
import type { PublicFound, PublicMissing } from "../domain/projections.ts";

export interface PublicSearchResult {
  missing: PublicMissing[];
  found: PublicFound[];
}

const LIMIT = 25;

export async function searchPublic(query: string): Promise<PublicSearchResult> {
  const q = normalizeText(query);
  if (q.length < 2) return { missing: [], found: [] };

  const [allMissing, allFound] = await Promise.all([listMissing(), listFound()]);

  const matchesMissing = allMissing.filter((report) => {
    const haystack = normalizeText(`${report.fullName} ${report.city} ${report.id}`);
    return haystack.includes(q);
  });
  const matchesFound = allFound.filter((report) => {
    const haystack = normalizeText(`${report.fullName} ${report.city} ${report.id}`);
    return haystack.includes(q);
  });

  return {
    missing: matchesMissing.slice(0, LIMIT).map(toPublicMissing),
    found: matchesFound.slice(0, LIMIT).map(toPublicFound),
  };
}
