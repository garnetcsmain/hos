# HOS-2026-008 — Data minimization and operating-posture ship-now specs

Status: SHIP-NOW documentation (specs, not builds)
Decision: `docs/decision-log/2026-07-01-HOS-008-threat-model-operating-posture/judge_decision.yaml` (RESHAPE toward Option B — assume adversarial state, minimize now)
Owner: Executive Orchestrator / CTO
Date: 2026-07-03

## Why this document exists

The HOS-2026-008 board (5-persona run, 2026-07-02) returned a RESHAPE with one
binding item escalated to the human (D1 — is the Venezuelan state in scope as an
adversary?) and a **ship-now pile that needs no credentials, no infrastructure,
and no political answer**. The judge named the *written field-by-field
data-minimization list* the **primary control** — ranked above field-level
encryption — because collecting less and retaining less are the only controls
that hold against a host that can be legally compelled, whereas an encryption key
co-located with its ciphertext on a foreign-hosted Supabase DB is a leak control
mislabeled as a state-adversary control.

This document delivers the four ship-now **specifications** from the judge
decision's `ships_now_no_external_dependency` list:

1. **D2** — the written field-by-field data-minimization classification (primary).
2. **D3** — the audit-log payload-minimization + retention-TTL + query-access plan.
3. **D4** — the tiered-visibility spec and the plan to close/coarsen the live
   public-search existence oracle.
4. **D5** — the censorship-resilient reachability plan.

These are documents by design. The **code** that follows from them is tracked
separately (see "Follow-on work and gating" at the end): the event-log change is
a design decision touching a forensic control, and the oracle *code* change is
soft-gated on a human interim-confirm per the judge decision's
`escalate_to_human`. Nothing here regresses Phase 0.

Every field below is cited to its source of truth:
`apps/web/app/lib/db/schema.ts`, `apps/web/app/lib/domain/types.ts`, and the
public projection at `apps/web/app/lib/domain/projections.ts`.

---

## D2 — Field-by-field data-minimization classification (PRIMARY control)

### Classification key

Each persisted field is classified into exactly one bucket, per the judge's D2
condition:

- **(a) do not collect** — the field should not be gathered at all; remove it or
  never write it.
- **(b) collect but do not persist beyond operational need** — transient or
  short-TTL; must not live indefinitely in a durable table.
- **(c) coordinator-only** — retained, but never projected past the coordinator
  gate; an unauthenticated or refugee/volunteer-tier caller must never see it.
- **(d) public-safe projection** — safe to expose in the least-PII public
  projection (`PublicMissing` / `PublicFound`).

Guiding rule (Researcher, citing ICRC doctrine): minimization and
purpose-limitation rank **above** encryption. Every retained field must justify
itself against a concrete reunification need; every plaintext sensitive field
written from here forward is remediation debt (Expansionist "model it while
cheap").

### `missing_reports` (`schema.ts:14-34`)

| Field | Bucket | Justification / action |
|---|---|---|
| `id` | (d) | Case number; already public in `PublicMissing`. It is also the intended *legitimate* lookup key (see D4 — a case-number match is what the oracle should require instead of open name browsing). |
| `created_at` | (d) | `createdAt` is in the public projection; a coarse freshness signal, low re-identification value. |
| `updated_at` | (c) | Not projected; edit-time metadata is coordinator-only. |
| `full_name` | (c) | **Not** in the projection (only `givenName` is). BUT `searchPublic` matches the query against `full_name` (`search.ts:25`), which is the existence oracle. Retain coordinator-only; the D4 change removes bare-name matching against it. |
| `given_name` | (d) | In `PublicMissing`; the minimum a family needs to recognize their own case. |
| `age` | (c) → (d) coarse | Raw integer is coordinator-only; public sees only the coarse `ageBand` (`projections.ts:11-17`). Do not project raw age. |
| `sex` | (d) | Low-cardinality; in the projection. |
| `last_seen_location` | (c) | Precise free-text place. Coordinator-only; candidate to **coarsen to district** (same grain as coordination) to shrink the re-identification surface. |
| `city` | (d) | Coarse; in the projection. |
| `last_seen_at` | (c) | Coordinator-only; a precise timestamp narrows movement. |
| `description` | (c) | Free text; may carry identifying detail. Coordinator-only, never projected. |
| `sensitive_notes` | (c), highest sensitivity | Marked "never public" (`schema.ts:26`). Coordinator-only. **Primary candidate for field-level encryption as a SECONDARY control** — but only labeled a state-adversary control if key custody is separated (see caveat below). |
| `reporter_name` | (c) | Identifies the reporting relative. Coordinator-only. |
| `reporter_relationship` | (c) | Coordinator-only; low value alone, correlating with name it identifies the family. |
| `reporter_contact` | (c), highest sensitivity | Phone/email re-contact PII (`schema.ts:29`). Coordinator-only. Secondary encryption candidate; already redacted for display via `redactContact` (`projections.ts:67`). **Must never enter `events.payload`** (see D3). |
| `consent` | (c) | Governance flag; coordinator-only. |
| `status` | (d) | In the projection — but note it is precisely the oracle's payload (confirms presence + case state). Kept public for the family's own case view; the D4 change removes the *unauthenticated bare-name* path to it. |
| `source` | (c) | Provenance; coordinator-only. |
| `photo_url` | (c), highest sensitivity | Biometric-adjacent facial image. Coordinator-only, never projected. Strongest encryption candidate; also revisit **whether to collect at all** in Phase 0 given HOS-2026-006/010's face-data findings. |

### `found_reports` (`schema.ts:36-55`)

| Field | Bucket | Justification / action |
|---|---|---|
| `id`, `created_at`, `given_name`, `sex`, `city` | (d) | Same rationale as `missing_reports`; present in `PublicFound`. |
| `age` | (c) → (d) coarse | Raw coordinator-only; public sees `ageBand` only. |
| `full_name` | (c) | Same oracle caveat as above (`search.ts:29`). |
| `found_location` | (c), high sensitivity | Precise shelter/hospital place (`schema.ts:44`). **Locating where a found person physically is** is exactly the datum an adversary tracking a person in hiding wants. Coordinator-only; strong coarsen-to-district candidate. |
| `found_at` | (c) | Coordinator-only. |
| `condition` | (c) — **review for (d) removal** | `condition` is currently in `PublicFound` (`projections.ts:52-63`) and returned by public search. Exposing `deceased` on an unauthenticated surface is the same "a mother reads a bare status before anyone speaks to her" failure the family-reach obligation (`familyReach.ts`) exists to prevent. **Recommend removing `condition` from the public projection** and surfacing outcome only through the human-mediated family-reach path. Flagged for the D4 review. |
| `description` | (c) | Free text; coordinator-only. |
| `reporter_org` | (c) | Provenance; coordinator-only (may be a public-safe attribution later, but not by default). |
| `reporter_name` | (c) | Coordinator-only. |
| `reporter_contact` | (c), highest sensitivity | Re-contact PII (`schema.ts:51`); same handling as missing-side. Never into `events.payload`. |
| `status` | (d) | Same oracle caveat as missing-side status. |
| `source` | (c) | Provenance. |
| `photo_url` | (c), highest sensitivity | Same as missing-side photo. |

### `match_candidates` (`schema.ts:57-68`) and `verifications` (`schema.ts:70-79`)

| Field | Bucket | Justification |
|---|---|---|
| `match_candidates.*` (`score`, `factors`, `model`, ids) | (c) | The evidence chain links a missing person to a precise found location — coordinator-only in full. `factors` is a JSON evidence chain (`schema.ts:64`) that can restate PII; never project it. |
| `verifications.verifier_name`, `evidence`, `confidence` | (c) | Identifies the human verifier and their reasoning. Coordinator-only. |

### `notifications` (`schema.ts:81-91`)

| Field | Bucket | Justification |
|---|---|---|
| `recipient` | (c), high sensitivity | Re-contact PII (who is being contacted). Coordinator-only. |
| `subject`, `body` | (c) | May restate names/contact/outcome. Coordinator-only; the deceased-outcome text must never go to an automated channel (`familyReach.ts:56-64`). |
| `channel`, `status`, ids | (c) | Operational; coordinator-only. |

### Coordination tables — `orgs` / `sites` / `needs` / `offers` (`schema.ts:96-146`)

Coordination is already coarse-by-design (district rollup, no precise address for
needs) and its **public feed + dispatch remain CLOSED** pending human D3 sign-off
+ real auth (HOS-2026-007). Classification:

| Field | Bucket | Justification |
|---|---|---|
| `sites.name`, `district`, `category`, `beds_total/free`, `status` | (d) when the aid point is publicly listed | Publicly-advertised aid points (acopio/refugio/medico) are meant to be found. |
| `sites.lat` / `sites.lng` | (d) **only** for publicly-listed aid points | Schema is explicit: coords only for public aid points, else NULL — needs never get coords (`schema.ts:111-112`). Preserve this invariant. |
| `needs.district` | (d) coarse | District grain only; never a precise address. |
| `*.notes` | (c) | Free-text operational notes may carry a name or contact; coordinator-only until the public-feed gate opens with an explicit review. |
| `needs.claimed_by_org_id`, `org_id` | (c)/(d) | Org attribution; public-safe at org grain, not person grain. |

### `events` (audit log, `schema.ts:149-157`) — see D3

`actor`, `entity_id`, `occurred_at`, `type` are **attribution** and must be
retained. `payload` is the minimization target: today it can carry free-text
`note` (`familyReach.ts:103,134`) — re-contact PII in a permanent ledger. See D3.

### Encryption caveat (honesty principle)

Field-level encryption is a **secondary** control and may only be described as
protecting against the **named state adversary** if the decryption key custody is
separated from the ciphertext custody (client-held key, or a KMS in a different
control/jurisdiction domain than the Supabase host). In this build context the
key would otherwise live in the same Vercel env / Supabase project the app
already reads — in which case encryption defends against a *stolen dump or leak*,
**not** against host legal compulsion, and it must be labeled as exactly that.
The key-custody/jurisdiction decision is escalated to the human (and ideally
legal) per the judge decision; **do not label any field-encryption a
state-adversary control until that design is reviewed.**

---

## D3 — Audit-log payload minimization, retention TTL, query-access (plan)

The single highest-value, cheapest control that ships regardless of the D1
answer. The `events` table is the highest-value correlation asset: it ties
`actor` (e.g. `coordinator:<org>`) to a specific case and timestamp, and
`eventsForEntities` can join a whole family timeline (`events.ts:47-54`).
Encrypting report columns does nothing for this separate, by-design-permanent
table.

**Concrete finding.** `family.reached` and `family.reach_attempted` events write
`{ missingId, note: input.note }` into `events.payload` (`familyReach.ts:103,134`).
`note` is coordinator free-text about contacting the family and can contain a
phone number, an address, or personal detail — re-contact PII, written into an
append-only log that is never deleted.

### Plan

1. **Stop persisting free-text re-contact PII in `events.payload`.** Events must
   carry attribution (who did what, when, to which case) without embedding the
   raw contact note. Options, to be decided at implementation:
   - drop `note` from the durable payload entirely and keep only a boolean/length
     signal (`{ noteProvided: true }`), OR
   - store the operational note in a **mutable, retention-bounded** side record
     keyed to the notification (not the append-only log), so it can be redacted
     on schedule while the audit *fact* (attempt/reach happened) stays permanent.
   The append-only guarantee of the audit *fact* is preserved either way — only
   the sensitive payload becomes non-durable.
2. **Retention TTL + redaction plan** for the highest-signal event types
   (`family.reached`, `family.reach_attempted`, and any verification contact
   notes). Attribution persists; the sensitive payload is redacted after the
   defined operational window. Because `events` is append-only by contract
   (`events.ts:1-3`), redaction is implemented as a scheduled, audited
   payload-scrub of *those event types only*, not an ad-hoc delete — the design
   must record that the scrub itself happened.
3. **Query-access policy.** Decide and document explicitly who may query the
   event store. Today `missingTimeline` is behind `requireCoordinator`
   (`api/timeline/route.ts`) and `recentEvents` feeds the coordinator dashboard
   (`stats.ts`) — keep event-store reads coordinator-gated and record that as
   policy, not incidental behavior.

This is a design change to a forensic control, so it is implemented as its own
reviewed task (see follow-on work), not folded silently into an unrelated PR.

---

## D4 — Tiered visibility spec + closing the public-search oracle

Two things the proposal bundled must be separated by how blocked they are.

### D4a — Tiered-visibility spec (free; also acceptance criteria on HOS-2026-001-08)

Write the tiers as acceptance criteria on HOS-2026-001-08 (real auth/roles/org
isolation). **Enforcement is blocked** two deep — 001-08's org-isolation half is
hard-blocked on Postgres (BLK-001), and there is **no role primitive today** (the
gate is binary coordinator-vs-public, `auth.ts`). Stating this keeps the
dependency visible so the gate cannot silently re-open.

| Tier | Sees | Must never see |
|---|---|---|
| **Refugee / family** | MY view of MY case (identity-scoped): own status + nearby public services + how to reach a center. | Any other person's record; any ability to confirm a *third* person exists by name. |
| **Volunteer** | Scope of the current assignment only. | Full case files outside the assignment; contact PII beyond what the task needs. |
| **Coordinator** | Full case (all bucket-(c) fields), timeline, verification. | — |

Governing rule (User missing-piece): the refugee-facing minimal view must be *my
view of my case* (identity-scoped), **never** a public lookup that also lets a
stranger confirm my son exists. The same feature pointed at two people must not
collapse into one public surface. Enforcement mechanism will be the
capability-on-scoped-resource model specified in HOS-2026-011 (`self` scope),
once Postgres + the role substrate land.

### D4b — Close/coarsen the live public-search existence oracle (plan; code soft-gated)

**The exposure, confirmed in code.** `GET /api/search?q=<name>` is unauthenticated
(`api/search/route.ts` — only a rate limit, no `requireCoordinator`) and
`searchPublic` matches the query as a substring of `full_name + city + id`
(`search.ts:24-31`), returning `givenName + ageBand + sex + city + status`
(and, for found reports, `condition`). A stranger who types a name learns whether
that person is in the system, their city, and their case state — a working
existence/status oracle over people who may be in hiding. This is the D3
re-identification CRITICAL, now named a fourth time.

**Proposed change (to implement once the human confirms the interim hardening):**

- Narrow the public lookup so a **bare name+city cannot confirm presence/status**
  to an unauthenticated caller. Preferred: require a **case-number (`id`) match**
  rather than open name browsing — a family who has their own case number can
  still find their case; a stranger fishing by name cannot. (`id` is already a
  bucket-(d) field and the legitimate lookup key.)
- Remove `condition` from the public projection (see D2 `found_reports`).
- Pair it with the plain-language promise the User review asked for, shown on the
  search surface: **"Solo quien ya tiene tu número de caso puede confirmar que
  esta persona está aquí."** ("Only someone who already has your case number can
  confirm this person is here.") The protection must be legible to a frightened
  family, not just present in the backend.

**Why this is a plan, not a commit in this PR.** The judge decision's
`escalate_to_human` explicitly asks the human to *"confirm they want the
ship-now oracle-narrowing done as an interim hardening even before the full
posture is ratified,"* and the change alters the core family-facing search UX
(from name lookup to case-number lookup). Per the orchestrator's tactical-vs-
strategic boundary and the no-unattended-product-change principle, the code lands
in a follow-up PR once that one-line confirm is given. The design is fully
specified here so the confirm is cheap and the implementation is unambiguous.

---

## D5 — Censorship-resilient reachability (plan, not a build)

All reviewers converge: commit to a reachability **plan** now; do **not** build
heavy infrastructure ahead of Phase 0 (that is the Option C mission-displacement
trap). Tor-first/heavy infra is anti-crisis-grade for the patchy-, rationed-data
users HOS serves — "a posture that protects her by making the app unreachable on
her rationed data has protected her out of using it" (User).

### Adopted plan (documents/readiness, no build this cycle)

1. **Offline-first PWA caching** of the beneficiary-facing surface, so a family on
   intermittent connectivity retains their own case view and how-to-reach-a-center
   information when the network drops. (HOS already ships a PWA shell under
   `apps/web/public/icons`; formalize the cached-surface list.)
2. **Multi-domain readiness** — be prepared to serve the beneficiary surface from
   more than one domain if a primary is blocked. Readiness, not a second CDN.
3. **Out-of-band "we moved" fallback that a human can actually use:** a
   WhatsApp/SMS number that can announce a new address if the site is blocked —
   *"Si la aplicación deja de funcionar, contacta a ESTE número y te diremos la
   nueva dirección."* A resilience plan that lives only in infrastructure protects
   the server, not the family (User missing-piece).

**Explicitly not built this cycle:** Tor onion hosting, a second CDN, or any
heavier reachability infra. That is a separate, later-gated epic, taken only if
site-blocking is judged live **and** only without regressing the Phase 0 finish
line (the HOS-2026-007 mission gate).

---

## Follow-on work and gating

| Item | Type | Status / gate |
|---|---|---|
| This document (D2 classification + D3/D4/D5 specs) | Docs | **Ships now** — the primary control, no dependency, no political answer. |
| D3 event-log payload minimization + retention TTL | Code | Ready to schedule as its own reviewed task; touches a forensic control, so implemented deliberately (design in this doc). No human/political gate. |
| D4b close/coarsen the search oracle | Code | Design complete; **soft-gated on a one-line human confirm** that the interim hardening is wanted (per judge `escalate_to_human`). Changes core search UX. |
| D2 schema minimization (coarsen precise location, revisit `photo_url`/`condition`) | Code | Follow-on; "bake the boundary into the schema while data is small." |
| D2 field-level encryption WITH key custody | Code + design | **Blocked/escalated** — needs a human (ideally legal) key-custody/jurisdiction decision before it can count as a state-adversary control. |
| D4a enforced tiers | Code | **Blocked** on Postgres (BLK-001) + a role primitive that does not exist (HOS-2026-011). |
| D1 adversary classification | Human decision | **Escalated** — the one binding input a board of AI agents must not decide. |

### The escalation that still stands (D1)

The core question — *is the current or a successor Venezuelan government in scope
as an adversary whose access to HOS data would endanger the people in it?* — is a
political and safety judgment the board cannot and must not make. It has been
named unanswered by four separate reviews. The board's recommendation to the
human is to **answer YES explicitly, in writing**, so it stops recurring as a
non-answer that stalls downstream gates. The ship-now controls in this document
do not need that answer and proceed regardless; the encryption/key-custody design,
enforced tiers, and any reachability build remain gated on it.
