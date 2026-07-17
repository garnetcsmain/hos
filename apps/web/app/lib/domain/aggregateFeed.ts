// Public aggregate feed CONTRACT (HOS-2026-013-05, Judge D3).
//
// This is the SINGLE public projection that the (gated) public pulse board,
// the Ver-como public preview (HOS-2026-013-D4), and the companion site
// stewardship public "confirmado" surface (HOS-2026-014) all depend on. Design
// it ONCE, here, as a versioned contract so those surfaces cannot each drift
// into their own leak (Judge D3, Expansionist gate-neutral note).
//
// WHAT THIS IS — schema discipline only. It ships NOTHING publicly and does not
// pre-empt the HOS-2026-007 public-feed gate. The one read endpoint that emits
// it (app/api/coordination/aggregate) is COORDINATOR-GATED today; no
// unauthenticated caller receives this payload until the 007 re-review passes
// (human threat-model sign-off + real auth HOS-2026-001-08 + a written
// adversarial pattern-inference simulation on the real district data). See
// docs/decision-log/2026-07-03-HOS-013-public-presentation-ux/
// aggregate-feed-contract.md.
//
// TWO layers of minimization, not one (Judge D3, Principals Logic Check #2):
//  1. A typed ALLOWLIST DTO whose shape structurally cannot hold a name, free
//     text, a precise coordinate, a record id, or a timestamp/interval. There is
//     simply no field to put them in — a denylist/redaction serializer would
//     fail open on the next field added; an allowlist cannot.
//  2. k-SUPPRESSION at the aggregation step: a district×category cell whose
//     count is below the declared k-threshold is never emitted.
// Adversarial/fuzz tests are the regression guard on top (aggregateFeed.test.ts).
//
// Cadence/interval data is DROPPED, not coarsened (Judge D2 condition): the feed
// is a single retrospective SNAPSHOT. It carries no posted->assigned interval, no
// response-time, no per-event timing — the operational-tempo signal never enters
// the contract. `bucket` is a declared label for the snapshot, not a rate.
//
// district/category are DECLARED PARAMETERS, not Venezuela hard-codes (Judge D3):
// the core projection is region-agnostic. The VE vocabulary is supplied by
// defaultAggregateFeedParams(), kept deliberately separate from the pure grid.

import type { Need, NeedCategory, Site } from "./coordination.ts";

/** Bump when the wire shape changes. Emitted in the payload so a future consumer
 *  (widget, OG card, syndication — none built here) can pin a version. */
export const AGGREGATE_FEED_SCHEMA_VERSION = 1 as const;

/** Default k-anonymity threshold: a district×category cell must contain at least
 *  this many needs or it is suppressed. The public flip may only RAISE this (the
 *  007 re-review defends the number against snapshot-differencing); it is a
 *  declared parameter, never an implicit constant. */
export const DEFAULT_K_THRESHOLD = 5 as const;

/** The declared parameters a release is computed under — echoed in the payload so
 *  the release is self-describing and reproducible. */
export interface AggregateFeedParams {
  /** Minimum cell count; cells with fewer needs are never emitted. k >= 1. */
  kThreshold: number;
  /** Opaque label for the retrospective snapshot window (e.g. an ISO date or
   *  "2026-W29"). NOT a cadence or interval — a single bucket by design. */
  bucket: string;
  /** The district vocabulary this release aggregates over. The ONLY district
   *  strings that can appear in the output come from this array — never from a
   *  need's own (possibly PII-injected) district field. */
  regions: readonly string[];
  /** The category vocabulary this release aggregates over. Same guarantee. */
  categories: readonly string[];
}

/** One aggregate cell: a district×category count. Allowlist by construction —
 *  every field is either a controlled-vocabulary string (drawn from
 *  params.regions / params.categories) or a non-negative integer. There is no
 *  field that can carry a name, free text, a precise coordinate, a record id, or
 *  a timestamp/interval. */
export interface AggregateCell {
  district: string;
  category: string;
  /** Open needs in this cell. Always >= params.kThreshold (suppression floor). */
  openNeeds: number;
  /** Subset of openNeeds flagged critical. Coarse magnitude, no per-need detail. */
  criticalNeeds: number;
}

/** Coarse, already-public magnitude totals — the honest "the system is alive"
 *  signal (Judge D2: "1,021 necesidades, 150 sitios"). Scalars only; they carry
 *  no per-cell targeting information. */
export interface AggregateFeedTotals {
  /** Distinct in-vocabulary districts with at least one emitted cell. */
  districtsReporting: number;
  /** Active public aid points (already public; the source map publishes them). */
  activeSites: number;
}

/** The versioned public aggregate feed. This is the whole contract — a consumer
 *  sees these fields and nothing else. */
export interface PublicAggregateFeed {
  schemaVersion: typeof AGGREGATE_FEED_SCHEMA_VERSION;
  params: AggregateFeedParams;
  cells: AggregateCell[];
  totals: AggregateFeedTotals;
}

/** Only OPEN needs count toward demand. claimed/received/cancelled are lifecycle
 *  states that would leak response cadence, so they are excluded by construction. */
function isOpenDemand(need: Need): boolean {
  return need.status === "open";
}

/**
 * Project raw needs + sites into the PII-free aggregate feed.
 *
 * The output district/category strings are taken from `params.regions` /
 * `params.categories` — the projection iterates the declared vocabulary grid and
 * COUNTS matching needs; a need's own district/category/notes are only ever
 * compared for equality, never copied into the output. That is the structural
 * allowlist: an adversary who injects a name into a need's district field can
 * never make it appear in the feed, because the feed only ever emits vocabulary
 * strings.
 *
 * k-suppression: a cell below `params.kThreshold` is dropped entirely.
 */
export function toPublicAggregateFeed(
  needs: readonly Need[],
  sites: readonly Site[],
  params: AggregateFeedParams,
): PublicAggregateFeed {
  const k = Math.max(1, Math.floor(params.kThreshold));

  // Count into a (district -> category -> {open, critical}) grid keyed strictly
  // by the declared vocabulary. A need whose district or category is outside the
  // vocabulary contributes to no cell and is silently excluded — that is the
  // allowlist doing its job, not a bug.
  const regionSet = new Set(params.regions);
  const categorySet = new Set(params.categories);
  const grid = new Map<string, Map<string, { open: number; critical: number }>>();

  for (const need of needs) {
    if (!isOpenDemand(need)) continue;
    if (!regionSet.has(need.district) || !categorySet.has(need.category)) continue;
    let byCategory = grid.get(need.district);
    if (!byCategory) {
      byCategory = new Map();
      grid.set(need.district, byCategory);
    }
    const cell = byCategory.get(need.category) ?? { open: 0, critical: 0 };
    cell.open += 1;
    if (need.urgency === "critical") cell.critical += 1;
    byCategory.set(need.category, cell);
  }

  // Emit in declared-vocabulary order (deterministic; no data-dependent leak of
  // insertion order), applying k-suppression.
  const cells: AggregateCell[] = [];
  const districtsReporting = new Set<string>();
  for (const district of params.regions) {
    const byCategory = grid.get(district);
    if (!byCategory) continue;
    for (const category of params.categories) {
      const cell = byCategory.get(category);
      if (!cell || cell.open < k) continue;
      cells.push({
        district,
        category,
        openNeeds: cell.open,
        criticalNeeds: cell.critical,
      });
      districtsReporting.add(district);
    }
  }

  return {
    schemaVersion: AGGREGATE_FEED_SCHEMA_VERSION,
    params: {
      kThreshold: k,
      bucket: params.bucket,
      regions: params.regions,
      categories: params.categories,
    },
    cells,
    totals: {
      districtsReporting: districtsReporting.size,
      activeSites: sites.reduce((n, s) => n + (s.status === "active" ? 1 : 0), 0),
    },
  };
}

/** The Venezuela vocabulary, supplied as PARAMETERS (never hard-coded inside the
 *  projection). Kept here, separate from the region-agnostic grid, so a different
 *  deployment supplies its own regions/categories without touching the contract. */
export const NEED_CATEGORIES: readonly NeedCategory[] = [
  "rescue",
  "water",
  "food",
  "formula",
  "medical",
  "shelter",
  "hygiene",
  "clothing",
  "other",
];

/** Build default params for the current (VE) deployment. `regions` is passed in
 *  by the caller (the district vocabulary lives in lib/geo/districts.ts, a server
 *  concern) so this pure module stays free of geography imports. */
export function defaultAggregateFeedParams(
  bucket: string,
  regions: readonly string[],
  kThreshold: number = DEFAULT_K_THRESHOLD,
): AggregateFeedParams {
  return { kThreshold, bucket, regions, categories: NEED_CATEGORIES };
}
