# HOS-2026-013-05 — Public aggregate feed CONTRACT (design-once, gate-neutral)

Status: DELIVERED 2026-07-17. Schema discipline only. Ships nothing publicly.
Traces to: `judge_decision.yaml` D3 (two-layer minimization) + the Expansionist
gate-neutral "design it once as a versioned contract" note; D2 (cadence dropped);
D4 (Ver-como parasitic on this single projection).

## What was built

- `apps/web/app/lib/domain/aggregateFeed.ts` — the pure, region-agnostic
  contract: the `PublicAggregateFeed` DTO, the `toPublicAggregateFeed()`
  projection, `AGGREGATE_FEED_SCHEMA_VERSION`, and `defaultAggregateFeedParams()`.
- `apps/web/app/lib/domain/aggregateFeed.test.ts` — the adversarial/fuzz guard.
- `apps/web/app/lib/services/coordination.ts` — `publicAggregateFeed()` wires the
  contract to live sites/needs.
- `apps/web/app/api/coordination/aggregate/route.ts` — the ONE clean read
  endpoint, **coordinator-gated** (`requireCoordinator`), not public.

## The two layers of minimization (D3)

1. **Typed allowlist DTO.** `PublicAggregateFeed` / `AggregateCell` have no field
   that can hold a name, free text, a precise coordinate, a record id, or a
   timestamp/interval. There is nowhere to put PII. A denylist/redaction
   serializer fails open on the next field added; an allowlist cannot.
   Strengthened beyond "no PII field": the output district/category **values**
   come from the declared vocabulary (`params.regions` / `params.categories`),
   never copied from a need's own (possibly injected) fields. The projection
   iterates the vocabulary grid and counts matches — a need whose district is
   `"Juan Perez, Calle 5"` contributes to no cell and can never surface.

2. **Query-level k-suppression.** A district×category cell with fewer than
   `params.kThreshold` open needs is never emitted (default k = 5). k is a
   declared parameter echoed in the payload, defended as a number at the gate —
   not an implicit constant.

Adversarial/fuzz tests are the regression net on top (400 randomized inputs +
targeted PII-injection cases), per D3's "tests on top", not "tests instead of".

## Cadence dropped, not coarsened (D2)

The feed is a single retrospective snapshot. It carries no posted→assigned
interval, no response-time, no per-event timing. `bucket` is a coarse day-grain
label, not a rate. Only `status === "open"` needs are counted; claimed/received/
cancelled are excluded by construction because their transitions would leak
operational tempo.

## Region/category are parameters, not VE hard-codes (D3)

`toPublicAggregateFeed()` is deployment-agnostic: the district and category
vocabularies are passed in. `defaultAggregateFeedParams()` supplies the current
Venezuela vocabulary (`DISTRICT_OPTIONS` + `NEED_CATEGORIES`), kept deliberately
separate from the pure grid so another deployment supplies its own.

## Versioning

`schemaVersion` and the full `params` block (kThreshold, bucket, regions,
categories) are emitted in the payload, so any future consumer can pin a version
and read the release parameters without out-of-band knowledge.

## Future consumers (none built here; all downstream of the 007 gate)

An embeddable widget, a WhatsApp OG-card renderer, and allied-org / newsroom
syndication are all conceivable consumers of this one contract. **None is built
in this cycle.** They are reserved by schema discipline, not captured by shipping
early. Each is downstream of the HOS-2026-007 public-feed gate.

## What this deliberately does NOT do (respecting the gate)

- It does **not** serve any unauthenticated caller. The endpoint is
  coordinator-gated.
- It does **not** satisfy the 007 gate. Per D2/D3, before this shape may serve
  real data publicly it needs: (1) the 007 re-review with human threat-model
  sign-off, (2) real auth (HOS-2026-001-08), and (3) a **written adversarial
  pattern-inference simulation on the real district data** showing the release
  resists snapshot-differencing, suppression-as-signal, and interval leakage.
  k-suppression stops *individual* re-identification; it does **not** by itself
  neutralize the aggregate targeting oracle ("which district is weakest"). That
  is the Strava-heatmap residual the simulation must measure — it is out of scope
  for this contract task and remains HOS-2026-013-06 (GATED).
- "Ver-como passed" against this endpoint is a smoke test, not proof (D4).
