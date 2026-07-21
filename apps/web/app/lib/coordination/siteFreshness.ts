// Site operational-liveness freshness (HOS-2026-014-01, Judge D1 + D3-c).
//
// The coordination board already tags every record with a data-freshness signal
// derived from `updatedAt` (freshness.ts). That single signal conflated two
// different questions on a site: "is this shelter still OPEN and staffed?" and
// "is this BED COUNT current?". Judge D3 condition (c) requires them split, so a
// one-tap "confirmar operativo" can never launder a stale bed number
// ("operativo confirmado hace 3h · camas: dato de hace 2 días").
//
// This module derives operational liveness from a SEPARATE timestamp
// (`site.lastConfirmedAt`), bumped only by an explicit operational confirmation
// (or a capacity edit, which is itself a stronger sign of life) — never by an
// unrelated write. It renders STALENESS HONESTY only: it says how long since the
// site was last confirmed live, and NEVER attributes that confirmation to a
// named person (Judge D2 — no ownership reassurance until a verified identity
// exists; Judge D5 — the steward's routine is coordinator-only). A site that was
// never confirmed reads "unconfirmed", not "fresh".
//
// Pure + deterministic: every function takes an explicit `now` so it is
// unit-testable and free of Date.now().

import type { Site } from "../domain/coordination.ts";
import { AGING_HOURS, STALE_HOURS, freshnessOf, hoursSince } from "./freshness.ts";

/** Liveness band for a site's operational confirmation.
 *  - `confirmed`   — confirmed live within AGING_HOURS
 *  - `aging`       — confirmed a while ago; reconfirm soon
 *  - `stale`       — last confirmation older than STALE_HOURS; do not trust
 *  - `unconfirmed` — never confirmed operational (honest default, not "fresh")
 *
 *  These reuse the board's existing loose freshness thresholds (AGING_HOURS=6,
 *  STALE_HOURS=24) as INSTRUMENTED DEFAULTS. Per Judge D3, real SLA/decay numbers
 *  are tuned after 2-4 weeks of real steward data, not hard-coded here as truth.
 */
export type LivenessBand = "confirmed" | "aging" | "stale" | "unconfirmed";

export interface SiteLiveness {
  band: LivenessBand;
  /** Hours since the last operational confirmation; null if never confirmed. */
  hoursSinceConfirmed: number | null;
  /** ISO of the last confirmation; null if never confirmed. */
  confirmedAt: string | null;
}

export function siteLiveness(site: Site, now: string): SiteLiveness {
  const confirmedAt = site.lastConfirmedAt;
  if (!confirmedAt) return { band: "unconfirmed", hoursSinceConfirmed: null, confirmedAt: null };
  const hours = hoursSince(confirmedAt, now);
  const f = freshnessOf(confirmedAt, now);
  const band: LivenessBand = f === "fresh" ? "confirmed" : f === "aging" ? "aging" : "stale";
  return { band, hoursSinceConfirmed: hours, confirmedAt };
}

/** Coordinator triage: active sites whose operational confirmation has decayed
 *  (never-confirmed or older than the aging threshold), WORST-FIRST so the
 *  never-confirmed and longest-stale sites surface at the top of the list.
 *
 *  This is the honest "sitios vencidos" list (Judge D1) — a coordinator's real
 *  missing tool. It is a LIST the coordinator reads, not an automatic timer: it
 *  strips no one, publishes nothing outside the coordinator gate, and infers no
 *  neglect (Judge D3 — lapse is a coordinator action, never a silent timer).
 *  Closed sites are excluded (a closed site is not a liveness liability). */
export function sitesNeedingConfirmation(
  sites: Site[],
  now: string,
): Array<{ site: Site; liveness: SiteLiveness }> {
  const rank: Record<LivenessBand, number> = { unconfirmed: 0, stale: 1, aging: 2, confirmed: 3 };
  return sites
    .filter((s) => s.status === "active")
    .map((site) => ({ site, liveness: siteLiveness(site, now) }))
    .filter((x) => x.liveness.band !== "confirmed")
    .sort((a, b) => {
      const byBand = rank[a.liveness.band] - rank[b.liveness.band];
      if (byBand !== 0) return byBand;
      // Within a band, the oldest confirmation first. Never-confirmed sorts as
      // oldest possible (Infinity).
      const ah = a.liveness.hoursSinceConfirmed ?? Infinity;
      const bh = b.liveness.hoursSinceConfirmed ?? Infinity;
      return bh - ah;
    });
}

/** Coarse Spanish "hace X" phrasing for a coordinator-facing timestamp. Precise
 *  grain is fine here: D5's public timing-coarsening (staleness bands) applies to
 *  PUBLIC/volunteer surfaces, which this triage is not — it is coordinator-only. */
function agoEs(hours: number): string {
  if (hours < 1) return "hace <1 h";
  if (hours < 24) return `hace ${Math.floor(hours)} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} ${days === 1 ? "día" : "días"}`;
}

/** Honest, name-free liveness label. Never says "confirmado por <persona>": under
 *  the shared-token interim there is no verified identity to pin it to (Judge D2),
 *  and the steward's routine is a targetable asset (Judge D5). It states only what
 *  is true — how long since the site was confirmed operational. */
export function livenessLabel(l: SiteLiveness): string {
  switch (l.band) {
    case "unconfirmed":
      return "Sin confirmar operativo";
    case "confirmed":
      return `Operativo · confirmado ${agoEs(l.hoursSinceConfirmed as number)}`;
    case "aging":
      return `Confirmado ${agoEs(l.hoursSinceConfirmed as number)} · reconfirmar pronto`;
    case "stale":
      return `Confirmado ${agoEs(l.hoursSinceConfirmed as number)} · sin reconfirmar`;
  }
}

// Re-export the thresholds so callers/tests reference one source of truth.
export { AGING_HOURS, STALE_HOURS };
