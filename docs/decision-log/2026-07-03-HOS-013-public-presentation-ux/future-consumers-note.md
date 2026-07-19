# HOS-2026-013-05 — Public aggregate feed contract: future-consumers note

Companion to `judge_decision.yaml` decision **HOS-2026-013-D3** (condition: "A
one-paragraph 'future consumers' note ... goes in the decision log"). Delivered
2026-07-19.

## What shipped

`apps/web/app/lib/domain/publicFeed.ts` — the single, versioned, PII-free
aggregate-feed **contract**, with an adversarial/fuzz test suite
(`publicFeed.test.ts`, 14 tests). This is **schema discipline only**: it adds
no build scope, wires **no HTTP route**, and **serves nothing publicly**. It
does not pre-empt or pre-announce the HOS-2026-007 public-feed gate.

The two-layer minimization the Judge required (D3) is built, not asserted:

1. **Typed allowlist DTO.** `PublicFeedCell` has exactly three fields —
   `district` (the coarse rollup key already public across coordination),
   `category` (enum), and `openNeeds` (integer). There is structurally nowhere
   to put a name, note, contact, precise coordinate, org/user id, or per-event
   timestamp. A denylist/redaction serializer fails open the moment a field is
   added; this output type cannot represent the sensitive field at all.
2. **Query-level k-suppression.** `buildPublicFeed` drops any `(district,
   category)` cell with fewer than `k` records (`k >= 5`, floor-clamped so a
   caller cannot silently lower it). This is a population property a serializer
   cannot provide, so it lives in the aggregation.

Cadence/interval is **dropped, not coarsened** (Judge D2): the payload carries
no per-event time and no posted->assigned interval — only a day-granularity
retrospective `asOf` date. Only `open` needs are aggregated, so operational
tempo (claim/receive transitions) never reaches the wire. `suppressedCells` is
a single global scalar; there is deliberately **no per-district suppression
flag** (that flag would itself be the "which district is thin right now" signal
the Contrarian named).

## Future consumers — none built here, all downstream of the 007 gate

The public pulse feed (HOS-2026-013-D2, held), the Ver-como preview
(HOS-2026-013-D4), the companion site-stewardship public "confirmado" surface
(HOS-2026-014-02), and any later embeddable widget / WhatsApp-OG-card renderer /
allied-org or newsroom syndication (Expansionist upside) are **all consumers of
this one contract**. They are reserved by schema discipline, not captured by
shipping early. Region, category set, and k-threshold are **declared
parameters** echoed in the payload (`schema_version` too), so a future
deployment outside Venezuela reuses the contract without a fork.

## What this contract does NOT clear

Serving this feed's data publicly still requires, per Judge HOS-2026-013-D2 and
the standing HOS-2026-007 gate, **all** of:

1. the HOS-2026-007 public-feed gate re-review passing with a human
   threat-model sign-off;
2. real auth (HOS-2026-001-08);
3. a **written adversarial pattern-inference simulation on the real district
   data** demonstrating the release resists snapshot-differencing,
   suppression-as-signal, and posted->assigned interval leakage — k>=5 stops
   individual re-identification but not the aggregate-pattern targeting oracle
   (the Strava-heatmap failure one level up), and that residual can only be
   measured by replay/attack at HOS's real district cardinality, not asserted
   from precedent.

A known, documented residual: `totals.openNeeds` is a whole-population grand
total, so `total - sum(emitted cells)` reveals the aggregate count hidden by
suppression. This is a single scalar with no per-district structure (not a
targeting map) and is inherent to any k-suppressed release that also publishes
an honest grand total (Judge D2 explicitly wants the honest total). The
pattern-inference simulation above is where count-banding / total-withholding is
decided if that residual is judged material — this contract keeps the honest
total by default and leaves banding as a future tightening.
