# Data Minimization — Field-by-Field Classification

> Canonical, field-level data-minimization classification for HOS.
> Delivers the HOS-2026-008 board SHIP-NOW item **D2** ("write the field-by-field
> data-minimization classification"), grounded in the real schema, not an
> invented one. It carries no external dependency and makes no user-facing
> behavior change: it is the reference every future feature must check its fields
> against before implementation.

**Status:** living reference. Last reconciled against the code on 2026-07-05.
**Authority:** `AGENTS.md` §4 (Data privacy & protection of vulnerable people)
and the HOS-2026-008 operating-threat-model board
(`docs/decision-log/2026-07-01-HOS-008-threat-model-operating-posture/`).

---

## Why this document exists

HOS holds information about people at their most vulnerable — families searching
for a loved one, survivors who may be hiding from an adversarial state, found
persons whose precise location could expose them. `AGENTS.md` §4 states the rule:

> **Data minimization & purpose limitation.** Collect the minimum needed to
> reunify a family. Don't add fields "because we might use them." Every PII field
> must justify its existence against the Phase 0 mission.

This document turns that principle into an auditable, per-field ledger:

1. **What we collect** — every field in the persisted data model.
2. **Why it exists** — the Phase 0 mission justification for keeping it.
3. **Who may see it** — the exposure tier (public / coordinator / never-exposed).
4. **What must change** — fields flagged for minimization, and the open decisions
   that gate deeper controls.

New features (HOS-2026-009 unaccompanied-minor check-in, HOS-2026-011 roles,
any field encryption) MUST re-check their fields against this table before
implementation, per those epics' own board conditions.

---

## Classification scheme

Each field is assigned a **sensitivity class** and an **exposure tier**.

**Sensitivity class** — how much harm disclosure could do to the person:

| Class | Meaning | Examples |
|-------|---------|----------|
| `S3-endangering` | Disclosure can physically endanger a person or enable targeting/re-identification of someone in hiding. | precise found location, reporter contact, medical/sensitive notes, photo |
| `S2-identifying` | Directly identifies a specific person, but is not by itself a targeting vector. | full name, exact age, exact last-seen address |
| `S1-contextual` | Narrows identity or reveals coarse status; low harm alone, but composes into re-identification in aggregate. | given name, city, coarse age band, sex, status |
| `S0-operational` | Not personal data about a vulnerable subject; system/provenance metadata. | timestamps, ids, model version, org name, event type |

**Exposure tier** — who may read the field through the system today:

| Tier | Meaning |
|------|---------|
| `PUBLIC` | Returned by an unauthenticated API (search, public projections). |
| `COORDINATOR` | Only via a coordinator-gated endpoint (token or Supabase sign-in). |
| `NEVER-EXPOSED` | Persisted for matching/audit only; never returned by any read API. |

**Minimization verdict** — `KEEP` (justified), `WATCH` (justified but a known
aggregation/retention risk), or `REVIEW` (candidate to drop, coarsen, or gate;
tracked in "Open minimization actions" below).

---

## Missing report (`MissingReport`, a family's "I can't reach my loved one")

Source: `apps/web/app/lib/domain/types.ts`.

| Field | Class | Tier | Justification (Phase 0) | Verdict |
|-------|-------|------|-------------------------|---------|
| `id` | S0-operational | PUBLIC | Case-number lookup; opaque UUID. | KEEP |
| `createdAt` / `updatedAt` | S0-operational | PUBLIC | Freshness; timeline reconstruction. | KEEP |
| `fullName` | S2-identifying | NEVER-EXPOSED | Primary matching key (name similarity). Public views project to `givenName` only. | KEEP |
| `givenName` | S1-contextual | PUBLIC | Lets a family recognize their own case without exposing the surname. | WATCH — half of the public name+city re-identification oracle (see D4 below). |
| `age` | S2-identifying | NEVER-EXPOSED | Matching factor; public sees only `ageBand`. | KEEP |
| `sex` | S1-contextual | PUBLIC | Matching factor; disambiguates common names. | KEEP |
| `lastSeenLocation` | S3-endangering | NEVER-EXPOSED | Matching factor (location). Precise; never public. | KEEP |
| `city` | S1-contextual | PUBLIC | Coarse locality for matching and family lookup. | WATCH — the other half of the re-identification oracle. |
| `lastSeenAt` | S1-contextual | NEVER-EXPOSED | Timeline factor. | KEEP |
| `description` | S2-identifying | NEVER-EXPOSED | Free text; matching + human review. Redacted of contact patterns before any external AI call (`ai/redact.ts`). | WATCH — free text can carry more than intended. |
| `sensitiveNotes` | S3-endangering | NEVER-EXPOSED | Medical/sensitive context for the reviewing coordinator. Typed as never-public. | KEEP |
| `reporterName` | S2-identifying | NEVER-EXPOSED | Provenance; coordinator callback. | KEEP |
| `reporterRelationship` | S1-contextual | NEVER-EXPOSED | Prioritization / dignity of contact. | KEEP |
| `reporterContact` | S3-endangering | NEVER-EXPOSED | The family-reach phone/email. Redacted for display (`redactContact`). Highest-value PII in the record. | KEEP |
| `consent` | S0-operational | NEVER-EXPOSED | Lawful-basis flag. | KEEP |
| `status` | S1-contextual | PUBLIC | Family sees case progressed; never flips to bare "Resuelto" (Board D4). | KEEP |
| `source` | S0-operational | NEVER-EXPOSED | Provenance (form, import). | KEEP |
| `photoUrl` | S3-endangering | COORDINATOR | Strong identifier / biometric-adjacent. Public projection exposes only `hasPhoto` boolean in events. | WATCH — photo storage/retention not yet designed; treat as biometric-grade. |

## Found report (`FoundReport`, a responder's sighting)

| Field | Class | Tier | Justification (Phase 0) | Verdict |
|-------|-------|------|-------------------------|---------|
| `id`, `createdAt`, `updatedAt`, `source` | S0-operational | PUBLIC / NEVER | Same as above. | KEEP |
| `fullName` | S2-identifying | NEVER-EXPOSED | Matching key; public sees `givenName`. | KEEP |
| `givenName` | S1-contextual | PUBLIC | "Sin identificar" when unknown. | WATCH — re-identification oracle. |
| `age` | S2-identifying | NEVER-EXPOSED | Public sees `ageBand`. | KEEP |
| `sex` | S1-contextual | PUBLIC | Matching factor. | KEEP |
| `foundLocation` | S3-endangering | NEVER-EXPOSED | Precise shelter/hospital — the single most dangerous field for a person hiding from an adversary. Typed and commented as access-controlled. | KEEP |
| `city` | S1-contextual | PUBLIC | Coarse locality. | WATCH — re-identification oracle. |
| `foundAt` | S1-contextual | NEVER-EXPOSED | Timeline factor. | KEEP |
| `condition` | S3-endangering | PUBLIC | alive/injured/hospitalized/deceased. Compassion path required (Board D4). Reveals health state — but a family looking up their person needs it. | WATCH — health status is public; acceptable only because a bare status is never the sole channel to a family. |
| `description` | S2-identifying | NEVER-EXPOSED | Free text; matching + review. | WATCH. |
| `reporterOrg` | S0-operational | COORDINATOR | Provenance of the signal (which org reported). | KEEP |
| `reporterName` | S2-identifying | NEVER-EXPOSED | Provenance; coordinator follow-up. | KEEP |
| `reporterContact` | S3-endangering | NEVER-EXPOSED | Responder callback PII. | KEEP |
| `status` | S1-contextual | PUBLIC | As above. | KEEP |
| `photoUrl` | S3-endangering | COORDINATOR | Biometric-grade; see above. | WATCH. |

## Match / verification / notification (`MatchCandidate`, `Verification`, `Notification`)

| Field | Class | Tier | Note | Verdict |
|-------|-------|------|------|---------|
| `MatchCandidate.*` (score, factors, model, ids) | S0-operational | COORDINATOR | Evidence chain + provenance; no new PII beyond the linked reports. | KEEP |
| `Verification.verifierOrg` / `verifierName` | S0/S2 | COORDINATOR | Who verified, for accountability (AGENTS.md §3 "who verified when"). | KEEP |
| `Verification.evidence` | S2-identifying | NEVER-EXPOSED | Free text justifying a decision. | WATCH. |
| `Notification.recipient` | S3-endangering | NEVER-EXPOSED | The actual contact address. Never public. | KEEP |
| `Notification.subject` / `body` | S2-identifying | NEVER-EXPOSED | Message content; may name the person. Delivery is "queued" not "sent" until a real receipt (Board D4). | WATCH. |

## Coordination (`Org`, `Site`, `Need`, `Offer`) — HOS-2026-007

People are deliberately OUT of scope in the coordination slice (see the module
header in `apps/web/app/lib/domain/coordination.ts`), so this data is
organizational, not personal — but two fields are location-sensitive.

| Field | Class | Tier | Note | Verdict |
|-------|-------|------|------|---------|
| `Org.name` / `Org.kind` | S0-operational | COORDINATOR | Accountable actor. | KEEP |
| `Site.district` | S1-contextual | COORDINATOR | Coarse by design (Board condition). | KEEP |
| `Site.lat` / `Site.lng` | S1-contextual | COORDINATOR | Set ONLY for aid points already published on a public map; null otherwise (Board condition). Not personal-subject location. | KEEP |
| `Need.*` / `Offer.*` (category, quantity, urgency, status, notes) | S0-operational | COORDINATOR | Logistics; no personal subject. `notes` is free text. | WATCH — `notes` must not accrete personal data as public intake opens (HOS-2026-007-08). |

---

## Event store payload (`events.payload`) — the audit ledger

Source: `apps/web/app/lib/repositories/events.ts` and its callers.

The append-only event store is a forensic control (AGENTS.md §3) and is
immutable by design. Because it is **append-only and never pruned**, whatever
lands in `payload` is a *permanent* record — so payload minimization matters
more here than anywhere else. A reconciliation of every current `appendEvent`
call site:

| Event | Payload today | Class | Verdict |
|-------|---------------|-------|---------|
| `missing.created` / `found.created` (`intake.ts`) | `{ city, condition?, hasPhoto }` | S1/S0 | KEEP — coarse, id-anchored, no free text. Good model to imitate. |
| `verification.*` (`verification.ts`) | `{ candidateId, decision, confidence, verificationId }` | S0 | KEEP — pure ids/enums. |
| `match.resolved` / `report.matched` (`verification.ts`) | `{ candidateId, foundId, missingId }` | S0 | KEEP — ids only. |
| `notification.queued` (`verification.ts`) | `{ channel, missingId }` | S0 | KEEP. |
| `family.reached` / callback events (`familyReach.ts`) | `{ missingId, note }` **and** `{ via, candidateId }` | **S2-identifying** | **REVIEW — the `note` is a free-text coordinator narrative about a real family contact, written permanently into an append-only store. This is the "who-helped-which-family free-text ledger" the HOS-2026-008 board named (D3). It is the one payload today that carries unbounded personal narrative.** |

**Rule going forward (payload minimization):** event payloads carry **ids,
enums, coarse locality, and booleans — never free-text personal narrative and
never contact details.** The `familyReach` `note` is the standing exception to
close.

---

## Public projection — the enforced minimum

Source: `apps/web/app/lib/domain/projections.ts`. This is the server-side control
(AGENTS.md §4: "Enforce this **server-side**, not just in the UI") that maps a
full record down to the public tier. It correctly drops `fullName`→`givenName`,
`age`→`ageBand`, and omits every S3 field. It is the right mechanism; the
residual risk is not what it exposes per record but that **name + city together
form a re-identification oracle in aggregate** (below).

---

## Open minimization actions (tracked, not resolved here)

This document classifies; it does not unilaterally change user-facing behavior.
The following are the flagged items and where each stands. Consistent with the
orchestrator constraint, the code/behavior changes among them are gated on the
noted sign-offs.

1. **Event-log payload minimization (SHIP-NOW candidate, D3).** Stop writing the
   free-text `note` into `family.reached` / callback event payloads; keep the
   narrative in the mutable message record (already stored), not the immutable
   ledger. Additive, low-risk, no external dependency — the cleanest next
   tactical step off this classification. *Not done in this doc-only change.*

2. **Event retention TTL + query-access policy (D3).** The event store is
   append-only and unpruned (AGENTS.md §4 "prune write-on-every-hit tables").
   Needs a retention-window design and a coordinator-only read policy. Design
   task, hard-blocked on Postgres (BLK-001) for enforced access.

3. **Public name+city search oracle (D4, LIVE).** `givenName`+`city`+`status`
   returned by bare-name query enables existence/re-identification of a person in
   hiding. **Re-scoping this user-facing search is a strategic/product change
   explicitly gated on a human threat-model sign-off** (HOS-2026-001-11 TODO) and
   entangled with the still-unanswered adversary-classification question
   (HOS-2026-008-D1, escalated to human 4 times). Not changed here.

4. **Photo handling (S3, biometric-grade).** `photoUrl` storage, access, and
   retention are undesigned. Treat photos as biometric-grade per HOS-2026-006's
   pending board review; do not build photo exposure until then.

5. **Field-level encryption (D2).** Only meaningful as a state-adversary control
   with a real key-custody/jurisdiction design (the board's finding: encryption
   with the key co-located with ciphertext on a foreign-hosted DB is not a
   state-adversary control). Blocked on a human (ideally legal) custody decision.

---

## How to use this document

- **Adding a field?** Add a row here first. State its class, tier, and Phase 0
  justification. If it is S3 or free text, expect to justify it against the
  mission before it ships.
- **Building HOS-2026-009 (minor check-in)?** Its minor-record fields must appear
  in this table and inherit the S3 defaults before any implementation, per that
  epic's own board condition.
- **Reviewing a PR?** A new PII field with no row here is a review blocker.
