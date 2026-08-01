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

/** Freshness of a site's "confirmar operativo" liveness signal (HOS-2026-014-01,
 *  Judge D1). This is deliberately SEPARATE from `freshnessOf(site.updatedAt)`:
 *  a bed-count edit bumps updatedAt but is NOT a re-confirmation that the site is
 *  still operating, so it must not reset the confirmation clock. `lastConfirmedAt`
 *  comes from the last `site.confirmed` event; `null` means no one has confirmed
 *  the site operational through HOS at all — rendered honestly as "unconfirmed",
 *  never as fresh. */
export type ConfirmFreshness = "unconfirmed" | Freshness;

export function confirmFreshnessOf(
  lastConfirmedAt: string | null,
  now: string,
): ConfirmFreshness {
  if (!lastConfirmedAt) return "unconfirmed";
  return freshnessOf(lastConfirmedAt, now);
}
