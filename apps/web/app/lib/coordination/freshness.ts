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

/** Freshness of a site's last EXPLICIT "operativo" confirmation
 *  (HOS-2026-014-01, Judge D1/D2), plus an "unconfirmed" state for a site that
 *  has never been confirmed operative. */
export type ConfirmationFreshness = Freshness | "unconfirmed";

/** Decay of the last "confirmar operativo" a steward gave a site. It uses the
 *  SAME thresholds as data freshness, but is driven ONLY by site.confirmed
 *  events — so a busy bed-count churn (site.capacity_updated) can no longer make
 *  a site read as "still operating" when no one has actually said so. A site
 *  that has never been confirmed operative is "unconfirmed": we do NOT fabricate
 *  a confirmation from the site's creation, a nightly import, or a capacity edit
 *  (that is exactly the confirm-vs-bed-count conflation the board asked us to
 *  split). `confirmedAt` is the occurred_at of the latest site.confirmed event,
 *  or null if there is none. */
export function confirmationFreshnessOf(
  confirmedAt: string | null,
  now: string,
): ConfirmationFreshness {
  if (!confirmedAt) return "unconfirmed";
  return freshnessOf(confirmedAt, now);
}
