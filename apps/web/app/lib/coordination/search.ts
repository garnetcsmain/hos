// Free-text search over the coordination board (HOS-2026-013-01, D5 console
// ergonomics). The imported board carries ~1000 needs and ~150 sites, so
// pagination alone (HOS-2026-007-09) is not enough to FIND a specific record —
// a coordinator needs to type "agua petare" and land on it.
//
// Pure and deterministic: no React/UI imports, no "now". Category LABEL maps are
// passed in (they live in a UI module that pulls lucide) so this stays testable
// and UI-free. Matching is accent-insensitive and AND-of-tokens, so "agua
// petare" matches a water need in Petare regardless of order or accents.

import type { NeedCategory, SiteCategory } from "../domain/coordination.ts";
import type { NeedView, SiteView } from "../domain/coordinationViews.ts";

/** Lowercase + strip diacritics so "Maiquetía" matches a typed "maiquetia". */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Split a query into normalized, non-empty tokens. */
export function tokenize(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean);
}

/** True when every token appears somewhere in the (already-joined) haystack.
 *  Empty token list matches everything (an empty search is not a filter). */
export function matchesTokens(haystack: string, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const h = normalize(haystack);
  return tokens.every((t) => h.includes(t));
}

/** Searchable text for a need: what a coordinator would type to find it. */
export function needHaystack(
  v: NeedView,
  categoryLabel: Record<NeedCategory, string>,
): string {
  const n = v.need;
  return [
    categoryLabel[n.category] ?? n.category,
    n.category,
    n.district,
    n.unit,
    n.notes,
    v.org?.name ?? "",
    v.claimedByOrg?.name ?? "",
  ].join(" ");
}

/** Searchable text for a site. */
export function siteHaystack(
  v: SiteView,
  siteCategoryLabel: Record<SiteCategory, string>,
): string {
  const s = v.site;
  return [
    s.name,
    siteCategoryLabel[s.category] ?? s.category,
    s.category,
    s.district,
    s.notes,
    s.announcement,
    v.org?.name ?? "",
  ].join(" ");
}

export function filterNeeds(
  needs: NeedView[],
  query: string,
  categoryLabel: Record<NeedCategory, string>,
): NeedView[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return needs;
  return needs.filter((v) => matchesTokens(needHaystack(v, categoryLabel), tokens));
}

export function filterSites(
  sites: SiteView[],
  query: string,
  siteCategoryLabel: Record<SiteCategory, string>,
): SiteView[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return sites;
  return sites.filter((v) => matchesTokens(siteHaystack(v, siteCategoryLabel), tokens));
}
