// Console text search for the coordinator board (HOS-2026-013-01, judge D5
// console ergonomics). Pure and accent-insensitive so "medico" matches
// "Médico" and "chacao" matches "Chacao"; a multi-word query ANDs its tokens
// so "agua chacao" narrows to water needs in Chacao. Kept free of component /
// React imports so it lives under app/lib and is unit-tested in isolation —
// the caller composes the searchable fields (including Spanish category labels)
// and this module owns only the matching semantics.

/** Lowercase + strip diacritics so accents never defeat a search. */
export function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/**
 * True if every whitespace-separated token of `query` appears somewhere across
 * the record's searchable `fields`. A blank query matches everything (the
 * search box is additive — empty means "no text filter"). Numbers are matched
 * as-is (so "200" finds a 200-unit need).
 */
export function matchesQuery(
  fields: Array<string | number | null | undefined>,
  query: string,
): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  const haystack = normalizeSearch(
    fields
      .filter((f) => f !== null && f !== undefined && f !== "")
      .join(" "),
  );
  return q.split(/\s+/).every((token) => haystack.includes(token));
}
