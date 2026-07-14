# HOS security posture — NIST CSF 2.0 index + FIPS 199 categorization

**Audience:** funders, partner agencies (ICRC / UNHCR / OCHA and their clusters), and any
future legal counsel evaluating HOS. This is the recognized artifact to point at when asked
"what is your security posture?"

**Status:** Living document. Delivered under decision HOS-2026-015 (board GREEN_LIGHT on
Option B, 2026-07-08). It re-labels security work HOS already reasoned to independently
(the HOS-2026-008 minimization/retention/oracle pile) in a vocabulary partners recognize.
It is deliberately **thin**: an index and a one-page categorization, not a compliance binder.

---

## The one limit that governs everything below (read first)

> **NIST/FIPS alignment is HOS's hygiene floor and shared vocabulary; it does NOT defend
> against legal compulsion of the host, which is addressed only by data minimization,
> non-retention, and key custody outside the compellable jurisdiction.**

HOS's apex threat is not an ordinary attacker. It is **lawful compulsion of the foreign host**
(Supabase / Vercel) — plus insider leak and network interception — with the state answered
**in scope as a latent adversary** (HOS-2026-008-D1, 2026-07-03). No control in this document,
and no cryptographic module, defeats a valid legal order served on the host. The controls that
actually hold there are the ones HOS-2026-008 already elevated as primary: **collect less,
retain no free-text who-helped-which-family ledger, and keep decryption keys outside the
compellable jurisdiction.** This framework is a complement to those controls, never a substitute
for them. Any artifact derived from this one must carry the sentence above verbatim; treating
"NIST-aligned" as "safe against the state" is the exact honesty failure the HOS-2026-008 judge
ruled against — "a protection we claim but do not deliver is the same failure as a delivery we
claim but do not make, applied to safety."

**The framework name never reaches a family.** What a frightened person is told stays true and
plain (see §9). "We are NIST-secure" is not something HOS says to the person with the most at
stake.

---

## 0. What HOS adopts, and what it declines

HOS adopts the parts of NIST/FIPS that earn their keep for a small NGO under a nation-state
threat model, and explicitly declines the parts that would be compliance theater:

**Adopted** — NIST CSF 2.0 as the governance index (§2); FIPS 199 categorization (§1); the NIST
Privacy Framework framing for minimization/retention (§2, PROTECT/IDENTIFY rows); NIST SP 800-63
identity-assurance targets (§4); and the **FIPS-approved-algorithm** suite (SP 800-131A) as a
coding standard (§5). SP 800-53 Rev 5 is used only as a **reference namer** for the ~20 controls
HOS actually implements (§3) — not as a certification target.

**Declined** (in the record, not just in intent):
- **FIPS 140-3 validated cryptographic module / "FIPS mode."** It buys effectively nothing
  against host compulsion and adds brittle operations. Revisited only on a specific
  funder/government **written** mandate, and then scoped as that partner's line item.
- **Full SP 800-53 / SP 800-171 control-set compliance and any formal audit regime**
  (SOC 2, FedRAMP). 800-171 (CUI) applies only if U.S.-government data ever enters scope.

The load-bearing distinction: **FIPS-approved *algorithms* (a near-free coding standard, adopted)
are not FIPS 140-3 *validated modules* (a procurement/ops burden, declined).**

---

## 1. FIPS 199 — security categorization (one page)

FIPS 199 rates the potential impact of a breach of each objective. It costs nothing and it
justifies why HOS spends on confidentiality first.

| Objective | Impact | Why (HOS-specific) |
|---|---|---|
| **Confidentiality** | **HIGH** | Disclosure can get a person detained, disappeared, or killed. Named precedent in HOS's own record: Rohingya biometric data-sharing; VenApp / *Operación Tun Tun* tied to a fatality in this population. A confidentiality breach here is a life-safety event, not a privacy inconvenience. |
| **Integrity** | **HIGH** | A wrong match sends a family to the wrong shelter or a morgue — HOS keeps every match advisory and human-verified for exactly this reason. A forged "need received" or false verification corrupts a life-safety decision. |
| **Availability** | **MODERATE** | Crisis reachability matters, but HOS chose offline-first plus an out-of-band "we moved, contact this number" fallback over high-availability infrastructure. Degradation is survivable; it is not itself life-ending. |

**System categorization = HIGH** (high-water mark). Operational consequence: **confidentiality
and integrity controls outrank availability spend** — the posture HOS already holds.

---

## 2. NIST CSF 2.0 — the six-function index

CSF 2.0 is used as an **outcome map**, not a control checklist. HOS is strong on Govern/Identify
(its whole board→judge decision culture is a governance program) and **honestly weakest on
Detect** — stated plainly here rather than implied as covered.

| Function | HOS today | Status |
|---|---|---|
| **GOVERN (GV)** | The `docs/decision-log/` board→judge process is a documented risk-management program; HOS-2026-008 is a recorded risk-acceptance; AGENTS.md §§3–4 are the policy floor. | **Strong** |
| **IDENTIFY (ID)** | Threat model enumerated (HOS-2026-008); field-by-field PII classification published (`docs/DATA_MINIMIZATION.md`, HOS-2026-008-D2). | **Strong** |
| **PROTECT (PR)** | Fail-closed coordinator gate + boot guard; constant-time token compare; rate limiting; free-text PII redacted before any external AI call; append-only audit; public search reduced to a case-number-only lookup (no name/city oracle); deceased-condition withheld from public projections; **Postgres TLS now verifies the peer** (HOS-2026-015-01). Missing: per-user MFA, org-scoped authorization, field-level encryption. | **Partial — improving** |
| **DETECT (DE)** | Append-only `events` gives forensic reconstruction after the fact. There is **no active detection** — no anomalous-access alerting, no error/uptime monitoring wired. | **Weak (today's weakest function — see §8)** |
| **RESPOND (RS)** | `docs/incident-responses/` exists; governance defines an expedited breach path (24h + human). One concrete revoke/rotate/notify runbook is the remaining ship-now item (HOS-2026-015-05). | **Partial** |
| **RECOVER (RC)** | Managed backups planned with Postgres; a post-decision-review ritual exists. Restore-test and a stated recovery-time expectation (consistent with A:MODERATE) still to confirm. | **Partial** |

---

## 3. SP 800-53 Rev 5 — control reference (naming, not certifying)

The ~20 controls HOS actually implements, named so a partner can cross-reference. This is a
**reference list, not a self-assessment** — HOS does not claim an 800-53 baseline.

| Control | Name | HOS implementation |
|---|---|---|
| **AC-3 / AC-4** | Access enforcement / information flow | Fail-closed coordinator gate; public projections withhold surname, precise location, and sensitive condition. |
| **AU-2 / AU-9** | Audit events / protection of audit info | Append-only, immutable event store; free-text re-contact PII no longer written to `events.payload` (`noteProvided:boolean`). |
| **IA-2 / IA-5** | Identification & authentication / authenticators | Invite-only coordinator sign-in; constant-time token compare. MFA and per-person attribution are open items (§8). |
| **SC-8 / SC-12 / SC-13** | Transmission confidentiality / key establishment / cryptographic protection | TLS everywhere; Postgres transport now authenticates the peer (`rejectUnauthorized:true` on all hosted modes). Approved-algorithm suite per §5. |
| **SI-4** | System monitoring | **Not yet implemented** — the Detect gap (§8). Listed here as honest absence, not coverage. |
| **MP-6** | Media sanitization | Retention TTL + disposal policy for high-signal event types (SP 800-88 for the "how"). |

---

## 4. SP 800-63 — digital identity assurance

| Principal | Target | Today | Gap |
|---|---|---|---|
| **Coordinator** (sees full PII) | IAL1–2 / **AAL2** (MFA) | Supabase email+password = AAL1, or a shared break-glass token = no per-person identity | Enable Supabase TOTP (MFA); retire the shared token to break-glass; attribute every action to a person. **AAL2 is NOT reported as achieved until both hold** (sequenced with HOS-2026-001-08). |
| **Field volunteer** | **AAL2 / IAL0** (pseudonymous, by design) | Designed, not built (HOS-2026-010) | High authentication assurance, deliberately low identity proofing — you do not want strong real-identity proofing of volunteers against a state adversary. Bake in PIN throttling + a non-exportable device key (800-63B) when built. |
| **Refugee / family** | **IAL0 / AAL0** (no account, by design) | Public intake + case-number-scoped lookup | Correct to keep account-free; the public existence-oracle is closed (case-number-only). |
| **Federation** (Supabase as IdP) | Server-controlled claims only | Supabase JWT | Carry the org/tenant claim in server-set `raw_app_meta_data`, never user-editable `user_metadata` — verified before any RLS policy is written against it. |

---

## 5. SP 800-131A — approved-algorithm standard

Codified in `AGENTS.md §3` and enforced by `npm run check:crypto`
(`tools/checks/approved-crypto.mjs`), which fails the build on unambiguous banned primitives.

- **Approved:** AES-256-GCM · SHA-256/384/512 · HMAC-SHA-256 · HKDF / PBKDF2 · Ed25519 /
  ECDSA-P256 · `crypto.randomUUID` / `getRandomValues`.
- **Banned:** MD5 · SHA-1 · 3DES/DES · RC4 · AES-ECB · the key-less `createCipher`/`createDecipher`
  · `Math.random` for any security purpose.

Audit at adoption found **zero violations** — the only crypto sites in the tree are
`randomUUID` (id generation) and `timingSafeEqual` (token compare), both approved. The rule
locks in the good state. The `Math.random`-for-security half stays honestly review-only (a grep
cannot distinguish a security use from a decorative one); the gap is stated, not hidden.

**Field-level encryption** (AES-256-GCM is the approved algorithm) is **not yet implemented** and
is gated on a human key-custody/jurisdiction decision (HOS-2026-008-D2). Until that is answered,
encryption would defend only the stolen-dump path, not the state-compulsion path, and must be
labeled as such — never as a state-adversary control.

---

## 6. Outward cross-map — ISO 27001 and the ICRC data-protection canon

NIST/FIPS is the better **engineering** vocabulary (800-63 identity, the algorithm suite), and
HOS adopts it internally on that basis. But the humanitarian partners this artifact is meant to
open doors with predominantly evaluate against **ISO/IEC 27001 (+27701)** and the sector's
**data-protection canon**, which are GDPR-lineage rather than US-federal. This artifact therefore
carries both maps; NIST/FIPS internal, ISO/ICRC outward.

| HOS posture element | NIST/FIPS | ISO 27001 (Annex A / 2022) | ICRC / humanitarian DP canon |
|---|---|---|---|
| Documented risk decisions | CSF GOVERN | A.5 org controls; Clause 6 (risk) | ICRC Handbook ch. on accountability & DPIA |
| Data minimization / purpose limitation | Privacy Framework CT.DM-P | A.5.34; ISO 27701 | ICRC Handbook — data minimization; UNHCR DP policy; OCHA/IASC data-responsibility guidelines |
| Retention / disposal | SP 800-88; MP-6 | A.8.10 | ICRC Handbook — retention limits |
| Access control / tiered visibility | AC-3/AC-4 | A.5.15, A.8.3 | ICRC "need-to-know"; do-no-harm |
| Transport & crypto | SC-8/12/13; SP 800-131A | A.8.24 | ICRC — security of processing |
| Identity assurance | SP 800-63 | A.5.16, A.8.5 | ICRC — data-subject identification limits |
| Breach response | RS; IR-* | A.5.24–5.26 | ICRC — data-breach management |

**Governing frame where they conflict:** the ICRC *Handbook on Data Protection in Humanitarian
Action* and the humanitarian **do-no-harm** principle govern. NIST/FIPS provides the shared
words and the engineering floor; it does not override a humanitarian-protection judgment.

**Open input (not a blocker):** which passport to lead with depends on the near-term
funder/partner — US-based partners read NIST best; EU/UN-based partners read ISO 27001 / ICRC
best. HOS should not publish a NIST-only posture if the doors it is knocking on are ISO-shaped.

---

## 7. Already shipped (the HOS-2026-008 pile, re-labeled)

The substance of this posture is completed work, traceable to CSF / Privacy Framework outcomes:

- **Field-by-field PII classification** — `docs/DATA_MINIMIZATION.md` (ID.AM / Privacy CT.DM-P).
- **Event-log minimization + retention** — free-text re-contact PII no longer persisted in
  `events.payload`; retention TTL + query-access policy documented (PR.DS / CT.DM-P; SP 800-88).
- **Public search oracle closed** — case-number-only lookup; no name/city existence oracle
  (PR.AC; 800-63 IAL0 boundary).
- **Deceased-condition withheld** from public projections (PR.DS / do-no-harm).
- **Postgres TLS peer-authentication fixed** — `rejectUnauthorized:true` on all hosted modes,
  regression-tested (SC-8/12/13; HOS-2026-015-01).
- **Approved-algorithm standard + enforcing check** — AGENTS.md §3 + `npm run check:crypto`
  (SP 800-131A; HOS-2026-015-02).

---

## 8. Open items — honestly labeled

Named so no reader mistakes a plan for a delivered control:

- **Coordinator MFA (AAL2, authentication half)** — ship-now once Supabase Auth env keys are set
  (config). *Blocked on env keys.*
- **Per-person coordinator attribution** — retire the shared token to break-glass; sequenced with
  HOS-2026-001-08. **AAL2 not claimed complete until this and MFA both hold.**
- **Field-level encryption with real key custody** — algorithm settled (AES-256-GCM); *gated on
  the HOS-2026-008-D2 human key-custody/jurisdiction decision (ideally with counsel).*
- **Org-scoped Postgres RLS + case-table `org_id`** — *blocked on Postgres landing
  (HOS-2026-001-07) and the HOS-2026-011-D4 human policy decision* (is reunification case/PII data
  a shared cross-org pool or org-partitioned?).
- **Detect / monitoring (SI-4)** — access-anomaly + error/uptime alerting. **The weakest CSF
  function today.** *Blocked on a Sentry DSN (EXTERNAL_DEPENDENCIES #13).* Labeled blocked, not
  implemented.
- **Incident-response runbook** (revoke / rotate / notify) — ship-now docs, no dependency
  (HOS-2026-015-05).

This epic is **not complete** while the two inherited human decisions it depends on —
HOS-2026-008-D2 (key custody) and HOS-2026-011-D4 (case-table org-partitioning) — remain open.

---

## 9. What a family is told (plain language, no framework name)

The framework name stays out of everything a person using HOS sees. What a family or volunteer
is told is true and plain:

- Only someone who already has your case number can confirm the person is here — a name alone
  returns nothing.
- HOS keeps the least information it can, and does not keep a permanent record of who helped which
  family.
- Coordinators sign in individually; sensitive details are shown only to the people who need them
  to reunite you.

HOS never tells a family it is "secure against the state." It tells them what is true, and it does
the minimization and key-custody work — not a label — to make it so.

---

### Standards referenced

NIST CSF 2.0 · NIST Privacy Framework 1.0 · NIST SP 800-63-4 (identity; -63B authenticators) ·
NIST SP 800-131A (approved-algorithm transitions) · NIST SP 800-53 Rev 5 / FIPS 200 (reference
namer) · NIST SP 800-88 (media sanitization) · FIPS 199 (categorization) · FIPS 140-3 (module
validation — *declined unless mandated*) · FIPS 197 / 180-4 / 198-1 / 186-5 (approved algorithms) ·
ISO/IEC 27001 & 27701 · ICRC Handbook on Data Protection in Humanitarian Action · UNHCR Data
Protection Policy · OCHA/IASC data-responsibility guidelines.

> Companion internal analysis (code-level audit, adopt/defer/decline matrix):
> `docs/decision-log/2026-07-06-HOS-015-nist-fips-security-framework/nist-fips-crosswalk.md`.
> This posture takes effect under decision HOS-2026-015 (board GREEN_LIGHT on Option B).
