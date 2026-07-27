// Public steward-confirmation timing CONTRACT (HOS-2026-014-02, Judge D5).
//
// The board's binding steward-safety finding: the targetable asset is not only
// a steward's NAME, it is their presence CADENCE. A public surface that renders
// a precise confirmation time ("confirmado hace 2 h") — or worse, refreshes it
// daily — publishes a single keeper's routine: when they are reliably at the
// site, and therefore when they can be found there. The Judge required that any
// leak of steward name OR presence cadence be treated as a SECURITY bug, and
// that the timing-coarsening be solved ONCE, shared with the public aggregate
// feed (HOS-2026-013-05, publicFeed.ts). This module is that single boundary.
//
// SHIPS NOTHING PUBLICLY. As with publicFeed.ts, no HTTP route is wired to this
// module. It is schema discipline only. The steward-confirmation surface itself
// is the honest-interim slice HOS-2026-014-01 (coordinator-gated, not yet
// built) and its enforced/public variants ride the still-closed 010/011/Postgres
// chain plus the HOS-2026-007 public-feed gate. Defining the projection first,
// as the 013-05 precedent did, means every future consumer shares one
// cadence-safe boundary instead of each re-deriving "how fresh is this?" and
// leaking the routine differently.
//
// TWO guarantees, by construction — a serializer/denylist would fail open the
// moment a field is added:
//   1. ALLOWLIST DTO. PublicStewardConfirmation holds exactly a coarse `band`
//      and its Spanish `label`. There is structurally nowhere to put a steward
//      name/handle, a contact, a precise instant, or a time-of-day. This is
//      also where the Judge's "drop the 'por el responsable' clause" lives: the
//      identity simply has no field to travel in.
//   2. DAY-GRANULARITY BANDS, not rolling hours. The band changes only at the
//      UTC date boundary, never at the steward's actual confirmation moment. A
//      naive rolling "últimas 24 h" window would flip precisely 24 h after each
//      confirmation, so an adversary differencing snapshots could read the
//      time-of-day off the transition edge — reconstructing the very cadence we
//      are hiding (the same snapshot-differencing attack the board flagged for
//      the aggregate feed). Comparing whole UTC days instead means a differencing
//      adversary learns at most the calendar day of a confirmation, never the
//      hour — the routine stays hidden by construction.
//
// Pure and deterministic: takes an explicit `nowIso` so the band is unit-testable
// and never reads a clock. The coordinator-facing PRECISE freshness signal is a
// separate concern and stays in coordination/freshness.ts (freshnessOf); this
// module is exclusively the public, cadence-safe projection.

/** Bump when the wire shape or band semantics change, so a future consumer can
 *  pin the contract it validated against (mirrors PUBLIC_FEED_SCHEMA_VERSION). */
export const STEWARD_CONFIRMATION_SCHEMA_VERSION = 1 as const;

/** Coarse public staleness bands. Ordered stalest-last. No band encodes a
 *  time-of-day; the finest grain any band represents is a whole calendar day. */
export type StewardConfirmationBand =
  | "today" // confirmed on the snapshot's UTC day (or, defensively, a future-dated instant)
  | "yesterday" // exactly one UTC day before the snapshot
  | "within_week" // 2..6 whole UTC days ago
  | "over_week" // 7..30 whole UTC days ago
  | "stale" // more than 30 whole UTC days ago
  | "never"; // no confirmation on record (null / empty / unparseable)

/** Day-difference upper bounds (inclusive) that define each band. Whole UTC days
 *  between the confirmation day and the snapshot day. */
export const WITHIN_WEEK_MAX_DAYS = 6;
export const OVER_WEEK_MAX_DAYS = 30;

/** Spanish public labels. Deliberately coarse and time-of-day-free. "confirmado
 *  hoy" states only that a confirmation landed sometime on the current calendar
 *  day — never at what hour. */
const BAND_LABELS: Record<StewardConfirmationBand, string> = {
  today: "confirmado hoy",
  yesterday: "confirmado ayer",
  within_week: "confirmado en la última semana",
  over_week: "sin confirmar hace más de una semana",
  stale: "sin confirmación reciente",
  never: "sin confirmación registrada",
};

/** The ONLY public shape. An allowlist DTO: it can represent a coarseness band
 *  and its label, and nothing else. No identity, no contact, no exact time. */
export interface PublicStewardConfirmation {
  schemaVersion: typeof STEWARD_CONFIRMATION_SCHEMA_VERSION;
  band: StewardConfirmationBand;
  label: string;
}

/** ISO instant -> whole-day index (days since the Unix epoch, UTC), or null when
 *  unparseable. Floor to the UTC day so all comparison is day-granular: the
 *  time-of-day component is discarded before it can influence the result. */
function utcDayIndex(iso: string): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor(t / 86_400_000);
}

/** Map a whole-day difference to a band. Negative diffs (a confirmation dated
 *  after the snapshot — clock skew across devices) collapse to "today" rather
 *  than inventing a future band. */
export function bandForDayDiff(dayDiff: number): Exclude<StewardConfirmationBand, "never"> {
  if (dayDiff <= 0) return "today";
  if (dayDiff === 1) return "yesterday";
  if (dayDiff <= WITHIN_WEEK_MAX_DAYS) return "within_week";
  if (dayDiff <= OVER_WEEK_MAX_DAYS) return "over_week";
  return "stale";
}

/**
 * Project a steward's last confirmation instant to the public, cadence-safe
 * band. `lastConfirmedAt` is null/empty when nothing has ever been confirmed.
 *
 * The precise instant NEVER leaves this function: only the band and its label
 * cross into the returned DTO.
 */
export function publicStewardConfirmation(
  lastConfirmedAt: string | null | undefined,
  nowIso: string,
): PublicStewardConfirmation {
  const base = { schemaVersion: STEWARD_CONFIRMATION_SCHEMA_VERSION } as const;

  if (!lastConfirmedAt) {
    return { ...base, band: "never", label: BAND_LABELS.never };
  }

  const confDay = utcDayIndex(lastConfirmedAt);
  const nowDay = utcDayIndex(nowIso);
  if (confDay === null || nowDay === null) {
    // An unparseable confirmation reads as "no confirmation on record" — the
    // honest, safest default (never silently "today"). An unparseable `now` has
    // no honest band, so it also collapses to "never".
    return { ...base, band: "never", label: BAND_LABELS.never };
  }

  const band = bandForDayDiff(nowDay - confDay);
  return { ...base, band, label: BAND_LABELS[band] };
}
