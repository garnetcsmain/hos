// Free-text search + triage presets for the coordinator console
// (HOS-2026-013-01, board-cleared 2026-07-12, judge D5). Pure and deterministic
// — no UI/React imports, no "now" read from the clock — so the filtering logic
// is unit-testable and identical whether it runs in the browser console or in a
// test. The console holds ~1000 imported needs + ~150 sites; a coordinator needs
// to jump to "críticas abiertas en Maiquetía" without scrolling, so search and
// triage are additive to (not a replacement for) the existing category chips.

import type { NeedView, SiteView } from "@/app/lib/domain/coordinationViews";
import type { NeedCategory, SiteCategory } from "@/app/lib/domain/coordination";
import { freshnessOf } from "./freshness.ts";

/** Accent- and case-insensitive fold so "medico" matches "Médico" and
 *  "maiquetia" matches "Maiquetía". Essential for Spanish free-text where a
 *  coordinator typing on a phone will rarely enter the diacritics. */
export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** True when EVERY whitespace-separated token in `query` appears somewhere in
 *  `haystack` (AND semantics, so "agua maiquetia" narrows to both). A blank
 *  query matches everything — search never hides the board on its own; it only
 *  narrows what the chips already selected. */
export function haystackMatches(haystack: string, query: string): boolean {
  const q = normalizeText(query);
  if (!q) return true;
  const hay = normalizeText(haystack);
  return q.split(/\s+/).every((tok) => hay.includes(tok));
}

/** Match a need against a free-text query. Searches the coordinator-visible,
 *  low-PII fields only — district, category (Spanish label AND raw token),
 *  unit, notes, requesting org, claiming org. Never searches ids or coordinates. */
export function needMatchesQuery(
  view: NeedView,
  query: string,
  categoryLabel: Record<NeedCategory, string>,
): boolean {
  const parts = [
    view.need.district,
    categoryLabel[view.need.category] ?? "",
    view.need.category,
    view.need.unit,
    view.need.notes,
    view.org?.name ?? "",
    view.claimedByOrg?.name ?? "",
  ];
  return haystackMatches(parts.join(" "), query);
}

/** Match a site against a free-text query: name, district, category (label AND
 *  raw token), notes, and the owning org. */
export function siteMatchesQuery(
  view: SiteView,
  query: string,
  categoryLabel: Record<SiteCategory, string>,
): boolean {
  const parts = [
    view.site.name,
    view.site.district,
    categoryLabel[view.site.category] ?? "",
    view.site.category,
    view.site.notes,
    view.org?.name ?? "",
  ];
  return haystackMatches(parts.join(" "), query);
}

// --- Triage presets ---------------------------------------------------------
// One-tap coordinator shortcuts that answer a concrete operational question,
// so the console opens on "what needs a decision now" instead of the full list.
// Each preset is a pure predicate over a NeedView (+ an explicit `now` for the
// freshness-based one). Presets act on NEEDS only; sites keep the category chip.

export type TriagePresetId = "todas" | "criticas" | "sin_asignar" | "vencidas";

export interface TriagePreset {
  id: TriagePresetId;
  label: string;
  /** Short helper describing exactly what it surfaces (shown as a subtitle). */
  hint: string;
}

export const TRIAGE_PRESETS: TriagePreset[] = [
  { id: "todas", label: "Todas", hint: "Sin filtro de triaje" },
  { id: "criticas", label: "Críticas abiertas", hint: "Urgencia crítica, aún sin resolver" },
  { id: "sin_asignar", label: "Sin asignar", hint: "Abiertas que ninguna organización tomó" },
  { id: "vencidas", label: "Vencidas", hint: "Sin actualizar en más de 24 h — reconfirmar" },
];

/** Whether a need is still awaiting operational action (open or claimed but not
 *  yet received/cancelled). Triage is about pending work, so resolved needs drop
 *  out of every narrowing preset. */
function isActionable(status: NeedView["need"]["status"]): boolean {
  return status === "open" || status === "claimed";
}

/** Pure triage predicate. `now` is passed in (never read from the clock here)
 *  so the "vencidas" (stale) preset is deterministic and testable. */
export function needMatchesTriage(view: NeedView, preset: TriagePresetId, now: string): boolean {
  const { status, urgency, claimedByOrgId, updatedAt } = view.need;
  switch (preset) {
    case "todas":
      return true;
    case "criticas":
      return urgency === "critical" && isActionable(status);
    case "sin_asignar":
      return status === "open" && !claimedByOrgId;
    case "vencidas":
      return isActionable(status) && freshnessOf(updatedAt, now) === "stale";
    default:
      return true;
  }
}
