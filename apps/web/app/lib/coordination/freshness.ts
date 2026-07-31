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

/** Operational-liveness freshness of a site (HOS-2026-014-01, Judge D3). Derived
 *  from the last "confirmar operativo" (lastConfirmedAt), NOT from updatedAt, so a
 *  bare confirm can never launder a stale bed count. `null` (never confirmed)
 *  returns null — the caller renders it as "sin confirmar", honestly distinct
 *  from a confirmed-but-stale site. */
export function confirmFreshnessOf(lastConfirmedAt: string | null, now: string): Freshness | null {
  if (!lastConfirmedAt) return null;
  return freshnessOf(lastConfirmedAt, now);
}
