// Freshness signal for coordination data (HOS-2026-007 Board condition: stale
// data must read as stale, not as truth — the #1 documented failure of
// coordination boards). Pure: takes an updatedAt and an explicit "now" so it is
// deterministic and unit-testable.

export type Freshness = "fresh" | "aging" | "stale";

/** Capacity/needs older than this are "aging" (show a soft warning). */
export const AGING_HOURS = 6;
/** Older than this is "stale" — do not trust without re-confirming. */
export const STALE_HOURS = 24;

export function hoursSince(updatedAt: string, now: string): number {
  const then = Date.parse(updatedAt);
  const ref = Date.parse(now);
  if (Number.isNaN(then) || Number.isNaN(ref)) return Infinity;
  return Math.max(0, (ref - then) / 3_600_000);
}

export function freshnessOf(updatedAt: string, now: string): Freshness {
  const h = hoursSince(updatedAt, now);
  if (h >= STALE_HOURS) return "stale";
  if (h >= AGING_HOURS) return "aging";
  return "fresh";
}

// --- Confirmation freshness (HOS-2026-014-01, Judge D1/D2) -----------------
//
// A site's general `freshness` is driven by `updatedAt`, which ANY write bumps
// — a bed-count edit, an aviso, a status flip. That is the wrong signal for the
// one question a coordinator actually needs answered before sending a family:
// "did a human recently vouch that this site is still OPERATING?" Touching the
// bed count is a chore, not a fresh operational vouch — the whole reason the
// board split one-tap "confirmar operativo" from the bed-count edit. So the
// confirmation clock is driven ONLY by the events that assert operational
// status, and it decays independently of `updatedAt`.

/** Event types that assert a site is operational (they reset the confirmation
 *  clock). `site.created` is the origin vouch by whoever registered it;
 *  `site.confirmed` is the explicit one-tap. A `site.capacity_updated`, an
 *  announcement, or a sync import is deliberately NOT here — none is a fresh
 *  vouch that the doors are still open. */
export const CONFIRMATION_EVENT_TYPES = ["site.created", "site.confirmed"] as const;

/** Minimal structural shape of an event, so this pure leaf module never has to
 *  import the HosEvent domain type. */
export interface ConfirmationEvent {
  type: string;
  occurredAt: string;
}

const CONFIRMATION_TYPES: ReadonlySet<string> = new Set(CONFIRMATION_EVENT_TYPES);

/** The most recent operational-confirmation timestamp among `events`, or null if
 *  none exists (e.g. an aid point imported from the external feed that no human
 *  has confirmed). Order-independent — it scans for the max, not the last. */
export function lastConfirmedAt(events: ReadonlyArray<ConfirmationEvent>): string | null {
  let latest: string | null = null;
  let latestMs = -Infinity;
  for (const e of events) {
    if (!CONFIRMATION_TYPES.has(e.type)) continue;
    const ms = Date.parse(e.occurredAt);
    if (Number.isNaN(ms)) continue;
    if (ms > latestMs) {
      latestMs = ms;
      latest = e.occurredAt;
    }
  }
  return latest;
}

/** Freshness of a site's operational confirmation. null means never confirmed
 *  in our records — reported as `null` (rendered as "sin confirmar"), NOT as
 *  "fresh": an unconfirmed site must never read as vouched-for. */
export function confirmationFreshnessOf(
  confirmedAt: string | null,
  now: string,
): Freshness | null {
  if (confirmedAt === null) return null;
  return freshnessOf(confirmedAt, now);
}
