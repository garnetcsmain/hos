// HOS-2026-014-01 — the honest, coordinator-only half of site stewardship
// (Judge D1 + D5, docs/decision-log/2026-07-03-HOS-014-site-stewardship/judge_decision.yaml).
//
// This module is deliberately the STALENESS-HONESTY layer only. It carries no
// steward record, no name, no trust-tier, and no remote/self-request path — all
// of which the board WITHHELD from the interim (D2/D4) until a verified identity
// exists to pin them to. It reuses the existing freshness signal and asserts
// only what the system can back: "this active site has not been confirmed in a
// long time" — never "someone specific vouches for it".
//
// Pure functions (no server imports, explicit `now`) so they are deterministic
// and unit-testable, matching freshness.ts.

import type { SiteView } from "../domain/coordinationViews.ts";
import { hoursSince } from "./freshness.ts";

// --- D1: "sitios vencidos" triage -------------------------------------------
// The coordinator's real, missing tool (User: HIGH value for Carla): the
// worklist of still-ACTIVE sites whose freshness can no longer be trusted, so a
// coordinator can go re-confirm or close them. A site is "overdue" (vencido)
// when it is active yet its capacity/status has not been touched past the stale
// threshold — nobody has confirmed it operativo recently. Coordinator-gated
// only; it names no steward and makes no ownership claim.

export function isOverdueSite(view: SiteView): boolean {
  return view.site.status === "active" && view.freshness === "stale";
}

/** Active-but-stale sites, MOST overdue first (the oldest confirmation leads the
 *  triage list). Sorting by `updatedAt` ascending is equivalent to "longest
 *  since last confirmation first" and needs no clock. */
export function overdueSites(views: SiteView[]): SiteView[] {
  return views
    .filter(isOverdueSite)
    .sort((a, b) => Date.parse(a.site.updatedAt) - Date.parse(b.site.updatedAt));
}

// --- D5: shared public staleness BAND (solve timing-coarsening ONCE) ---------
// Public/volunteer surfaces must NEVER see a precise "confirmado hace 2h": a
// daily precise confirmation publishes a single steward's presence routine, and
// under the Operacion Tun Tun threat model the keeper of an aid site is a
// targetable role. So public confirmation timing is coarsened to a BAND. This is
// the one timing-coarsening primitive HOS-2026-013's public feed and
// HOS-2026-014's public confirmation are required to share (D5: "solve this
// timing-coarsening ONCE, shared with the HOS-2026-013 public feed").
//
// Gate-neutral: this is schema discipline only. It is wired to NO public route
// today — the public feed itself stays behind the HOS-2026-007 gate — exactly
// as the PII-free aggregate feed contract (HOS-2026-013-05) was shipped unwired.

export type StalenessBand = "recent" | "days" | "week" | "old";

/** Coarse band boundaries, in hours. Anything within a band collapses to the
 *  same label so distinct precise confirmation times cannot be assembled into a
 *  cadence. */
export const BAND_HOURS: Readonly<Record<Exclude<StalenessBand, "old">, number>> = {
  recent: 24,
  days: 24 * 3,
  week: 24 * 7,
};

export function publicStalenessBand(updatedAt: string, now: string): StalenessBand {
  const h = hoursSince(updatedAt, now);
  if (h < BAND_HOURS.recent) return "recent";
  if (h < BAND_HOURS.days) return "days";
  if (h < BAND_HOURS.week) return "week";
  return "old";
}

/** Coarse Spanish label for a band — a range, never a precise elapsed time, and
 *  never the word "responsable" (D5: drop the "por el responsable" clause on
 *  public surfaces). */
export const STALENESS_BAND_LABEL: Readonly<Record<StalenessBand, string>> = {
  recent: "confirmado en las últimas 24 h",
  days: "confirmado en los últimos días",
  week: "confirmado esta semana",
  old: "sin confirmar hace más de una semana",
};
