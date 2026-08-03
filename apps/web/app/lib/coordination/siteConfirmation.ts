// Operational-confirmation freshness for a site (HOS-2026-014-01, Judge D1).
//
// The board's honest-state requirement: "confirmar operativo" must carry its
// OWN decaying freshness, SEPARATE from the bed-count freshness. A single
// updatedAt-derived badge conflates the two — a site whose beds were edited an
// hour ago reads "Actualizado" even if nobody has confirmed it is still
// operating in days, which is exactly the "stale reads as truth" failure the
// HOS-2026-007 board named. Editing a number is not confirming a site is alive.
//
// So confirmation freshness is derived ONLY from explicit `site.confirmed`
// events (the one-tap "confirmar operativo" write). A `site.capacity_updated`
// (bed-count) or an announcement deliberately does NOT count as a confirmation.
// Derived from the append-only log — no new column, no migration.

import type { HosEvent } from "../domain/types.ts";
import { freshnessOf, type Freshness } from "./freshness.ts";

/** The event a one-tap "confirmar operativo" emits (see services/coordination
 *  updateSiteCapacity, intent: "confirm"). */
export const SITE_CONFIRMED_EVENT = "site.confirmed";

export interface SiteConfirmation {
  /** occurredAt of the most recent explicit operational confirmation, or null
   *  when the site has NEVER been confirmed operational. Null is honestly
   *  distinct from "stale": "we have never heard it is alive" is not the same
   *  claim as "it was alive but the confirmation has decayed". */
  lastConfirmedAt: string | null;
  /** Decay band of the confirmation, computed on its own timeline (not the
   *  bed-count timeline). Null when never confirmed. */
  freshness: Freshness | null;
}

/** Fold an event stream (one site or many) into a map of siteId -> the most
 *  recent `site.confirmed` occurredAt. Single pass, O(events). Events for other
 *  entity types or other event types are ignored, so a mixed stream from
 *  eventsForEntities is safe to pass straight in. */
export function confirmationsBySite(events: HosEvent[]): Map<string, string> {
  const latest = new Map<string, string>();
  for (const e of events) {
    if (e.entityType !== "site" || e.type !== SITE_CONFIRMED_EVENT) continue;
    const t = Date.parse(e.occurredAt);
    if (Number.isNaN(t)) continue;
    const prev = latest.get(e.entityId);
    if (prev === undefined || t > Date.parse(prev)) latest.set(e.entityId, e.occurredAt);
  }
  return latest;
}

/** Build the SiteConfirmation read-model value from a site's last-confirmed
 *  timestamp (or null when never confirmed) and the reference "now". Pure and
 *  deterministic so it is trivially unit-testable. */
export function confirmationFrom(lastConfirmedAt: string | null, now: string): SiteConfirmation {
  return {
    lastConfirmedAt,
    freshness: lastConfirmedAt ? freshnessOf(lastConfirmedAt, now) : null,
  };
}
