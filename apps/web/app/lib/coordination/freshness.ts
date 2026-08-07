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

/**
 * Freshness of a site's LAST OPERATIONAL CONFIRMATION (HOS-2026-014-01, Judge
 * D2), separate from data freshness. A site's `updatedAt` is bumped by any write
 * — a bed-count edit, an announcement — so freshnessOf(updatedAt) would read a
 * site as fresh just because someone touched its beds, masking the fact that
 * nobody has confirmed it is still operating in days. This decays only from the
 * last "confirmar operativo" (site.confirmed) write.
 *
 * A site that has NEVER been confirmed in HOS (lastConfirmedAt === null: an
 * imported/legacy row) reads as "stale", never as fresh — the same
 * stale-is-honest rule freshnessOf applies to an unparseable timestamp. The
 * caller distinguishes "never confirmed" from "confirmed but gone stale" via
 * the raw lastConfirmedAt for labelling.
 */
export function confirmationFreshnessOf(lastConfirmedAt: string | null, now: string): Freshness {
  if (!lastConfirmedAt) return "stale";
  return freshnessOf(lastConfirmedAt, now);
}
