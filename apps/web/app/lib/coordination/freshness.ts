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

/** Freshness of a site's OPERATIONAL CONFIRMATION specifically (HOS-2026-014-01,
 *  Judge D1/D2). `lastConfirmedAt` is the time of the site's most recent
 *  `site.confirmed` event — a one-tap "confirmar operativo" — which is a distinct
 *  liveness signal from the row's `updatedAt`: any edit (a bed-count chore, an
 *  aviso) bumps `updatedAt`, but only an explicit confirmation renews this. A
 *  coordinator must be able to read "last confirmed operational" apart from
 *  "last touched", or a stale site keeps reading as alive because someone edited
 *  an unrelated field.
 *
 *  A site never confirmed is `"unconfirmed"` — a real "needs a look" state, never
 *  "fresh" and deliberately NOT collapsed into "stale" (stale implies it was
 *  fresh once; this one never was). Honest-state discipline: seen-at-time is
 *  never "safe", and silence is never read as confirmation. */
export type ConfirmationFreshness = Freshness | "unconfirmed";

export function confirmationFreshnessOf(
  lastConfirmedAt: string | null,
  now: string,
): ConfirmationFreshness {
  if (!lastConfirmedAt) return "unconfirmed";
  return freshnessOf(lastConfirmedAt, now);
}
