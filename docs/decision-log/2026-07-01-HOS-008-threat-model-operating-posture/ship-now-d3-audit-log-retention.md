# HOS-2026-008-D3 — Audit-log payload minimization, retention, and query access

Status: SHIP-NOW deliverable, partially landed (payload minimization implemented).
Decision source: `judge_decision.yaml` (2026-07-02), decision D3.
Scope: no external dependency, no political answer required. Ships regardless of the
D1 (adversary-classification) escalation.

## Why this exists

The board's sharpest structural finding in HOS-2026-008 was that the highest-value
correlation asset in HOS is not the report tables but the append-only `events`
table (`schema.ts` events, `events.ts`). Every event carries `actor`,
`entity_id`, `occurred_at`, and a free-text `payload`. Family-reach and
verification events already tie `coordinator:<org>` to a specific family's case and
timestamp, and `eventsForEntities` exists to join a whole family timeline. That is
a permanent, by-design "which volunteer/coordinator helped which family" ledger.

Two stated HOS principles collide here:

- **Auditability** mandates the append-only log (who did what, when — a forensic
  and operational control, AGENTS.md section 3).
- **Data minimization** condemns keeping a permanent free-text record of
  re-contact detail about people who may be hiding (AGENTS.md section 4).

The resolution, per the Judge, is **not** to abandon either principle: keep
attribution, minimize the payload, bound retention. Encryption does nothing for
this table (it is a separate concern, and against a host that can be compelled a
co-located key protects nothing — see D2), so retention and non-collection are the
controls that actually hold.

## What landed now (payload minimization)

The durable event payload no longer carries the coordinator's free-text `note`.
Three write sites previously embedded free text a coordinator typed:

- `familyReach.ts` — `family.reached` and `family.reach_attempted` events.
- `coordination.ts` — `need.received` / `need.cancelled` events.

Each now records `noteProvided: boolean` (that a note was taken) instead of the
note content. Attribution is fully preserved: `actor`, `type`, `entity_id`,
`occurred_at`, and the case linkage (`missingId`) are unchanged, so the timeline
and forensic history are intact. What is gone is the re-contact PII — a phone
number, an address, "she is hiding at..." — that a permanent, potentially
compellable log must not hold.

A regression test (`familyReach.flow.test.ts`) asserts a note containing a phone
number never appears in the stored event payload.

This is the single cheapest, highest-leverage protection for the volunteers and
coordinators the system depends on: the honest reason a coordinator can now log a
reach attempt without creating a durable record that could be used against them or
the family later.

## Query-access policy (current state, documented)

Who may read the event store today:

- The per-case timeline (`/api/timeline`) is gated behind `requireCoordinator`
  (coordinator-only). Unauthenticated callers cannot read it.
- `recentEvents` / `eventsForEntities` are server-side only, reached through
  coordinator-gated routes. There is no public event-store surface.

This is the correct default (least privilege). It is recorded here so the access
boundary is explicit and a future change that widens it is a visible decision, not
an accident.

## Retention TTL (policy + why the mechanism is deferred)

Target: the highest-signal event types (`family.reached`,
`family.reach_attempted`, and any future verification contact events) retain their
**attribution** indefinitely (audit spine) but must not retain sensitive payload
indefinitely.

With payload minimization landed, those events no longer *write* re-contact PII in
the first place, so the immediate exposure is closed at the source. A scheduled
payload-redaction / prune pass over historical rows — redact stale payload past a
TTL while keeping the append-only attribution row — is the remaining piece. It is
deferred, not skipped, because:

- The production store is Postgres (BLK-001, awaiting a human `DATABASE_URL`); a
  retention job should run against the real backend, and a redaction-in-place
  design is cleaner to land with the Postgres adapter than to build twice.
- Deleting event rows outright would violate the append-only invariant
  (`events.ts`: "no update or delete"). Retention here means **payload redaction
  past a TTL**, preserving the attribution row — consistent with the Judge's
  "attribution may persist; the sensitive payload should not persist
  indefinitely."

Proposed TTL to ratify when the prune job is built: redact sensitive event
payloads to attribution-only after **180 days**, or immediately once the linked
case reaches a terminal `resolved` state and 30 days have passed — whichever is
sooner. These numbers are a starting proposal for the next gate, not yet binding.

## Next gate

Per `judge_decision.yaml`, the ship-now pile is re-reviewed after it lands. For
D3 specifically, confirm the event payload no longer carries durable re-contact
PII (done, test-locked) and that Phase 0 did not regress (clean build + tests).
The historical payload-redaction/prune job and its final TTL land with the
Postgres adapter (HOS-2026-001-07).
