# HOS Security & Privacy Posture — CSF 2.0 index + FIPS 199 categorization

> **Ratified outward-facing security artifact.** Authored under decision
> **HOS-2026-015** (board GREEN_LIGHT on Option B, 2026-07-08 —
> `docs/decision-log/2026-07-06-HOS-015-nist-fips-security-framework/judge_decision.yaml`).
> This is the standing index a funder, partner NGO, or reviewer can read to
> understand how HOS is secured. It re-labels security work HOS already reasoned
> to independently (the HOS-2026-008 minimization pile) in a vocabulary external
> parties recognize; it does not open a new security program.

**Status:** ratified reference. Last reconciled against the code on 2026-07-13.
**Governing decisions:** HOS-2026-015 (this framework), HOS-2026-008 (operating
threat model), `AGENTS.md` §3–4.
**Scope note (D1 — keep it thin):** CSF is an *index*, FIPS 199 is *one page*, the
crypto rule is *a paragraph in `AGENTS.md` §3*, and SP 800-53 is a *reference
namer* for the controls HOS actually implements. This document is deliberately
**not** a compliance binder and not a control-by-control self-assessment. Every
hour spent past "legible" is the mission-displacement risk the board rejected.

---

## 0. The binding honesty statement (read this first — it governs everything below)

> **NIST/FIPS alignment is HOS's hygiene floor and shared vocabulary; it does NOT
> defend against legal compulsion of the host, which is addressed only by data
> minimization, non-retention, and key custody outside the compellable
> jurisdiction.**

This sentence is a **template-level gate** (HOS-2026-015-D2, the hinge of the whole
decision). It is repeated at the foot of every outward-facing table in this
document, and no artifact HOS shows externally — the CSF index, the FIPS 199
categorization, the SP 800-53 reference list — may omit it. The reason is the
whole point of the framework decision: **a named framework is a louder claim than
ad-hoc security, and HOS's apex threat — lawful compulsion of the foreign-hosted
Supabase/Vercel platform — is untouched by anything in this packet.** The controls
that actually hold there belong to HOS-2026-008 (collect less, don't retain a
free-text who-helped-whom ledger, keep decryption keys outside the compellable
jurisdiction), not to NIST.

**The framework name stays out of user-facing copy entirely** (HOS-2026-015-D2). A
frightened family is never told "we are NIST-secure" — a phrase that could lie to
the person with the most at stake. What a family is told is true and plain:
minimization, a closed public-search oracle, coordinator sign-in. The vocabulary
in this document is for engineers, funders, and partner agencies — not for the
people in the records.

---

## 1. FIPS 199 — security categorization (one page)

FIPS 199 asks one cheap, clarifying question: rate the **potential impact** (Low /
Moderate / High) of a breach of **Confidentiality, Integrity, Availability**. It
costs nothing and it *justifies* why HOS spends on confidentiality first.

| Objective | Impact | Why (HOS-specific) |
|---|---|---|
| **Confidentiality** | **HIGH** | Disclosure can get a person detained, disappeared, or killed. Named precedent in HOS's own log: Rohingya biometric sharing; VenApp / *Operación Tun Tun* tied to a fatality in this population (HOS-008, HOS-012). A confidentiality breach is a life-safety event, not a privacy inconvenience. |
| **Integrity** | **HIGH** | A wrong match sends a family to a morgue or the wrong shelter — HOS-001 keeps every match advisory + human-verified for exactly this reason. A forged "need received" or false verification corrupts a life-safety decision. |
| **Availability** | **MODERATE** | Crisis reachability matters, but HOS-008-D5 chose offline-first + an out-of-band "we moved, contact this number" fallback over high-availability infrastructure. Degradation is survivable; it is not itself life-ending. |

**System categorization = HIGH** (the high-water mark). The operational consequence
HOS actually acts on: **confidentiality and integrity controls outrank availability
spend** — precisely the posture HOS-008 already adopted. FIPS 199 gives that posture
a name partners recognize.

> *NIST/FIPS alignment is HOS's hygiene floor and shared vocabulary; it does NOT
> defend against legal compulsion of the host (addressed only by minimization,
> non-retention, and off-host key custody).*

---

## 2. NIST CSF 2.0 — the index over existing decisions

CSF 2.0 has six Functions. HOS adopts them as an **organizing vocabulary**, not a
1,000-control checklist. Each row states the outcome, what HOS has today (with
evidence), and the gap.

| CSF 2.0 Function | HOS today (evidence) | Gap / next |
|---|---|---|
| **GOVERN** (GV) | **Strong.** The `docs/decision-log/` board→judge process *is* a governance program; HOS-008 is a documented risk-acceptance; `AGENTS.md` §3–4 are the standing policy; `docs/DATA_MINIMIZATION.md` is the data-classification policy. | Maintained. This document is the CSF index over those decisions. |
| **IDENTIFY** (ID) | **Strong.** Threat model enumerated (HOS-008); field-by-field PII classification written and living (`docs/DATA_MINIMIZATION.md`, HOS-008-D2). | Re-check every new epic's fields against the ledger before build (already a board condition on HOS-009/011). |
| **PROTECT** (PR) | **Partial → improving.** Fail-closed coordinator gate (`http/auth.ts`), constant-time token compare, rate limiting, PII redaction before external AI (`ai/redact.ts`), append-only audit, **Postgres TLS now peer-authenticated** (HOS-015-01, shipped 2026-07-09), **approved-algorithm rule enforced** (HOS-015-02, `npm run check:crypto`). | Per-user identity + coordinator MFA (HOS-015-04, blocked on Supabase Auth env); org-scoped authorization / RLS (HOS-011, blocked on Postgres + a human policy answer); field-level encryption + key custody (HOS-008-D2, escalated). |
| **DETECT** (DE) | **Weakest function — stated plainly, not implied covered.** The append-only `events` table gives *forensic reconstruction after the fact*; there is **no active detection today** — no anomalous-access alerting, no error/uptime monitoring (Sentry not wired, `EXTERNAL_DEPENDENCIES.md` #13). | Access-anomaly + error monitoring, carried as a real action **BLOCKED on a Sentry DSN** (HOS-015-D6). Not tagged implemented anywhere in this index. |
| **RESPOND** (RS) | **Partial.** `docs/incident-responses/` exists; governance has a "Critical / data breach" expedited path (24h + human). | One concrete IR runbook (who revokes tokens, rotates keys, notifies affected people) — HOS-2026-015-05, ship-now docs, **pending** (not yet written). |
| **RECOVER** (RC) | **Partial.** Postgres managed backups (HOS-001-07); the post-decision-review ritual captures learning. | Confirm a backup restore is tested; set a recovery-time expectation consistent with the "Moderate availability" categorization. |

**Shape:** HOS is strong on **Govern/Identify** (its whole culture) and weakest on
**Detect** — the opposite of the typical startup, and a genuinely healthy shape for
a life-safety system. The cheap win is to *name* the existing structure so it is
legible externally; the marginal investment belongs in **Detect** (gated on a
Sentry DSN).

> *NIST/FIPS alignment is HOS's hygiene floor and shared vocabulary; it does NOT
> defend against legal compulsion of the host (addressed only by minimization,
> non-retention, and off-host key custody).*

---

## 3. NIST Privacy Framework — because HOS's "security" is mostly privacy

The NIST Privacy Framework mirrors CSF for **data-processing risk**, and its top
control family is **data minimization / purpose limitation** — exactly what
HOS-008-D2/D3 already made the *primary* control. Adopting it is near-pure
re-labeling of decisions HOS reasoned to independently. The following ship-now
work is **confirmed complete** under the Privacy Framework / CSF outcomes it
satisfies:

| Privacy Framework / CSF outcome | HOS delivery (shipped) | Evidence |
|---|---|---|
| **CT.DM-P / ID.AM — data minimization, field classification** | Canonical field-by-field 4-tier ledger (public-safe / coordinator-only / purge-after-use / do-not-collect). | `docs/DATA_MINIMIZATION.md` (HOS-008-D2, 2026-07-05) |
| **CT.DM-P — data lifecycle / retention** | Free-text re-contact PII no longer persisted in `events.payload` (records `noteProvided:boolean`); retention TTL + query-access policy documented. | HOS-2026-008-02 (PR #31); `.../ship-now-d3-audit-log-retention.md` |
| **PR.AC — least-exposure public boundary** | Public search reduced to a **case-number-only** lookup (no name/city existence oracle); plain-language promise in both search UIs. | HOS-2026-008-03 (PR #33, merged 2026-07-07) |
| **PR.DS — dignity / sensitive-attribute suppression** | Public projection withholds the deceased condition (surfaced as undisclosed) so no family reads a bare "Fallecida" before a coordinator reaches them. | HOS-2026-001-12 (`toPublicFound`, 2026-07-07) |

The 4-tier classification the schema and code are held to:

1. **PUBLIC-SAFE** — the `givenName + city + status` projection (the public API shape).
2. **COORDINATOR-ONLY** — `full_name`, `reporter_contact`, `found_location`, `last_seen_location`, sensitive notes, `photo_url`.
3. **PURGE-AFTER-USE** — re-contact details once a family is reached (not persisted in the durable log).
4. **DO-NOT-COLLECT** — anything not justified by a concrete reunification need.

> *NIST/FIPS alignment is HOS's hygiene floor and shared vocabulary; it does NOT
> defend against legal compulsion of the host (addressed only by minimization,
> non-retention, and off-host key custody).*

---

## 4. NIST SP 800-63 — digital identity targets (honest, not overstated)

800-63 splits identity into three orthogonal assurance axes: **IAL** (identity
proofing), **AAL** (authentication strength), **FAL** (federation assurance).

| Principal | Target | Today (evidence) | Honest status |
|---|---|---|---|
| **Coordinator** (sees full PII) | IAL1–2 / **AAL2** (MFA) | Supabase email+password = AAL1; or a **shared** `HOS_COORDINATOR_TOKEN` = no per-person identity (`http/auth.ts`). | **AAL2 is NOT claimed.** It requires BOTH (a) Supabase MFA/TOTP enabled (HOS-015-04, blocked on Supabase Auth env) AND (b) per-person attribution — retiring the shared token to break-glass (HOS-2026-001-08). Reporting AAL2 before both hold would overstate assurance in the exact audit log an investigation relies on. |
| **Field volunteer** (HOS-010, device-key + PIN) | AAL2, **IAL0 (pseudonymous) by design** | Designed (GREEN_LIGHT HOS-010-D2), not built. | Correct posture: high authentication assurance, deliberately low identity proofing — you do NOT want strong real-identity proofing of volunteers against a state adversary. Two 800-63B requirements carried onto the HOS-010 build: PIN throttling/lockout + a non-exportable device key (passkey/platform authenticator). |
| **Refugee / family** (public) | IAL0 / AAL0 (no account) — by design | Public intake + public search, no login. | Correct to keep account-free; the identity-adjacent leak (the public-search existence oracle) is **closed** (§3, HOS-008-03). |
| **Federation (Supabase JWT)** | Server-controlled claims only | Supabase JWT. | HOS-011-D3 trap named: carry the org/tenant claim in **`raw_app_meta_data` (server-set)**, never `user_metadata` (user-editable) — verify before any RLS policy is written against the claim. |

> *NIST/FIPS alignment is HOS's hygiene floor and shared vocabulary; it does NOT
> defend against legal compulsion of the host (addressed only by minimization,
> non-retention, and off-host key custody).*

---

## 5. Cryptographic hygiene — SP 800-131A (shipped)

HOS adopts the FIPS-approved **algorithms** (a coding standard, near-zero cost) and
explicitly **declines** FIPS 140-3 **validated-module** operation ("FIPS mode"),
which is a procurement/ops burden that buys ~nothing against host compulsion (§7).

The approved-algorithm rule is live in `AGENTS.md` §3 and **enforced**:

- **Approved only:** AES-256-GCM (symmetric), SHA-256/384/512 (hash), HMAC-SHA-256
  (MAC), HKDF / PBKDF2 (KDF), Ed25519 / ECDSA-P256 (signatures),
  `randomUUID` / `getRandomValues` (randomness).
- **Banned:** MD5, SHA-1, 3DES/DES, RC4, AES-ECB, the deprecated key-less
  `createCipher` / `createDecipher`, and `Math.random` for any security purpose.
- **Enforcement:** `npm run check:crypto` (`tools/checks/approved-crypto.mjs`) fails
  the build on any banned primitive across first-party source. The
  `Math.random`-for-security half is honestly review-only (a grep cannot tell a
  security use from a decorative one) — the gap is stated, not hidden.
- **Current state:** the only crypto in the tree is `randomUUID` (`domain/ids.ts`)
  and `timingSafeEqual` (token compare) — both approved. The rule locks in a
  zero-violation state (HOS-2026-015-02).

Transport security is **peer-authenticated** as of HOS-2026-015-01 (2026-07-09):
`db/backends/postgres.ts` verifies the server certificate on every hosted SSL mode
(`rejectUnauthorized:true` on the hosted default and `HOS_PG_SSL=require`);
encryption-without-verification requires a human-typed `HOS_PG_SSL=no-verify`, and
`ssl:false` remains only for verified localhost. The one genuinely-open hole the
board packet surfaced (a MITM-able hosted TLS path) is **closed** with an 8-test
regression guard.

**Field-level encryption** of PII columns remains **escalated** (HOS-008-D2):
encryption only counts as a *state-adversary* control if the key lives **outside
the host's compellable jurisdiction**. With a co-located key it defends the
stolen-dump path only and MUST be labeled as such. AES-256-GCM is the approved
algorithm *when* the human key-custody decision is made — it is not a code task
this epic authorizes.

> *NIST/FIPS alignment is HOS's hygiene floor and shared vocabulary; it does NOT
> defend against legal compulsion of the host (addressed only by minimization,
> non-retention, and off-host key custody).*

---

## 6. Outward cross-map — ISO 27001 / 27701 + the ICRC data-protection canon (D5)

NIST/FIPS is the better **engineering** vocabulary (800-63 identity, the algorithm
suite) and HOS keeps it internal. But humanitarian partners predominantly evaluate
against **ISO/IEC 27001 (+27701)** and the **sector's data-protection canon**, which
are GDPR-lineage, not US-federal (HOS-2026-015-D5). The **governing data-protection
frame for HOS is the ICRC *Handbook on Data Protection in Humanitarian Action***;
the cross-map below is authored now, while the document is fresh, rather than
retrofitted.

| HOS control / decision | NIST/FIPS (internal) | ISO 27001 / 27701 | ICRC / sector DP canon |
|---|---|---|---|
| Data minimization + field classification | Privacy Fw CT.DM-P; FIPS 199 | A.5.34 / 27701 privacy-by-design | ICRC Handbook ch. "Data minimization" & purpose limitation; UNHCR DP Policy; OCHA/IASC data-responsibility |
| Closed public-search oracle; least-exposure projections | PR.AC; 800-63 IAL0 boundary | A.5.15 access control; A.8.12 data leakage prevention | ICRC "do no harm" / re-identification risk |
| Append-only audit; attribution | PR.PS / DE (forensic) | A.8.15 logging | ICRC accountability / data-processing records |
| Coordinator authn (MFA target) | 800-63 AAL2; PR.AA | A.5.17 authentication; A.8.5 secure authentication | ICRC access-on-a-need-to-know |
| Approved algorithms; peer-authenticated TLS | SP 800-131A; FIPS 197/180-4 | A.8.24 use of cryptography | ICRC data-security safeguards |
| Retention TTL; non-retention of re-contact PII | Privacy Fw CT.DM-P; SP 800-88 | A.5.33 / A.8.10 information deletion | ICRC retention limitation |
| **Host legal-compulsion residual risk** | *(no NIST control defeats it)* | *(no ISO control defeats it)* | ICRC data-sovereignty / jurisdiction; UNHCR DP transfer rules — the frame that actually names this risk |

**Open input (not a build blocker, D5):** whether the near-term target funder/partner
is US-based (NIST is the right passport) or EU/UN-based (ISO 27001 / ICRC is)
determines which face of this cross-map leads outward. Do not publish a NIST-only
passport if the doors are ISO-shaped.

> *NIST/FIPS alignment is HOS's hygiene floor and shared vocabulary; it does NOT
> defend against legal compulsion of the host (addressed only by minimization,
> non-retention, and off-host key custody).*

---

## 7. SP 800-53 — reference namer only (NOT a compliance target)

Per HOS-2026-015-D1, SP 800-53 is used to **name** the ~20 controls HOS actually
implements, so a reviewer can find them by their standard identifiers. It is **not**
a certification target and HOS does **not** claim an 800-53 baseline.

| 800-53 control | HOS implementation |
|---|---|
| **AC-3 / AC-4** access + information-flow enforcement | Fail-closed coordinator gate; least-exposure public projections; org-scoped RLS *designed, blocked* (HOS-011) |
| **AU-2 / AU-9** audit events + protection | Append-only immutable `events` store |
| **IA-2 / IA-5** identification + authenticator mgmt | Supabase auth; coordinator MFA *targeted, blocked*; approved-algorithm rule |
| **SC-8 / SC-12 / SC-13** transmission + crypto | Peer-authenticated Postgres TLS (HOS-015-01); SP 800-131A algorithm rule (HOS-015-02) |
| **SI-4** system monitoring | **Not implemented** — Detect is the weakest function; blocked on a Sentry DSN |
| **MP-6** media sanitization | Retention TTL + non-retention of re-contact PII (HOS-008-D3) |
| **IR-\*** incident response | Expedited breach path in governance; drilled runbook *pending* (HOS-015-05) |

**Declined in the record** (compliance theater for HOS's threat model, revisitable
only on a specific funder/government written mandate, then as that partner's line
item): **FIPS 140-3 validated-module / "FIPS mode"** and **full SP 800-53 / 800-171
compliance certification**.

> *NIST/FIPS alignment is HOS's hygiene floor and shared vocabulary; it does NOT
> defend against legal compulsion of the host (addressed only by minimization,
> non-retention, and off-host key custody).*

---

## 8. Ship-now pile — status (HOS-2026-015)

| Item | Tag | Status |
|---|---|---|
| Fix Postgres TLS peer-authentication defect + regression test | D3 (lead code action) | **Done** — HOS-015-01, 2026-07-09 |
| SP 800-131A approved-algorithm rule + enforcing lint | D4 | **Done** — HOS-015-02, 2026-07-10 |
| This CSF 2.0 index + FIPS 199 artifact, honesty statement in-template, ISO/ICRC cross-map | D2 + D5 | **This document** (HOS-015-03) |
| Enable Supabase coordinator MFA/TOTP (AAL2 authn half) | D4 | **Blocked** — Supabase Auth env keys; AAL2 not claimed until attribution half (HOS-001-08) also lands |
| Incident-response runbook (revoke / rotate / notify) | D6 | **Pending** — HOS-015-05, ship-now docs |
| Access-anomaly + error monitoring (Detect) | D6 | **Blocked** — Sentry DSN (`EXTERNAL_DEPENDENCIES.md` #13) |
| Field-level encryption WITH key custody | — | **Escalated** — HOS-008-D2 human + counsel decision |
| Org-scoped RLS + case-table `org_id` | — | **Blocked** — Postgres landing (BLK-001) + HOS-011-D4 human decision |

**Epic completion gate:** HOS-2026-015 must NOT be marked complete while the
inherited **HOS-008-D2** (key custody / jurisdiction) and **HOS-011-D4** (case/PII
org-partitioning) human decisions remain open.

---

## 9. Standards index (for anyone verifying this mapping)

- **NIST CSF 2.0** — Cybersecurity Framework (Govern / Identify / Protect / Detect / Respond / Recover).
- **NIST Privacy Framework 1.0** — data-processing risk; minimization-first.
- **NIST SP 800-63-4** — Digital Identity (IAL / AAL / FAL); **-63B** authenticators (PIN throttling, non-exportable keys).
- **NIST SP 800-131A** — approved-algorithm transitions (the practical crypto rule).
- **NIST SP 800-53 Rev 5 / FIPS 200** — control catalog + minimum requirements (used as a *reference namer*, not a target).
- **NIST SP 800-88** — media sanitization / disposal (retention & deletion how-to).
- **FIPS 199 / 200** — security categorization / minimum requirements.
- **FIPS 140-3** — cryptographic *module validation* (declined unless mandated).
- **FIPS 197 (AES) · 180-4 (SHA-2) · 198-1 (HMAC) · 186-5 (ECDSA/EdDSA)** — approved algorithms.
- **ISO/IEC 27001 (+27701)** — information-security (+privacy) management, the standard humanitarian partners most often evaluate against.
- **ICRC Handbook on Data Protection in Humanitarian Action** — the governing data-protection frame for HOS; **UNHCR** Data Protection Policy and **OCHA/IASC** data-responsibility guidelines alongside.

---

## 10. Provenance

- **Decision:** `docs/decision-log/2026-07-06-HOS-015-nist-fips-security-framework/judge_decision.yaml` (GREEN_LIGHT, Option B, 2026-07-08).
- **Board-intake analysis (supersedes-into this doc):** the DRAFT crosswalk `.../nist-fips-crosswalk.md` was the pre-decision analysis; this ratified artifact reflects the **current** code state (TLS defect and crypto rule both shipped after the crosswalk was written).
- **Companion controls (the ones that actually hold against the apex threat):** `docs/security/HOS-2026-008-data-minimization-and-posture.md`, `docs/DATA_MINIMIZATION.md`.
- **Standing policy:** `AGENTS.md` §3 (Security — hard rules), §4 (Data privacy).

> This artifact is a security *index and categorization*, not a certification. It
> takes its authority from the HOS-2026-015 board decision and is maintained as the
> code and the open human decisions it references evolve.
