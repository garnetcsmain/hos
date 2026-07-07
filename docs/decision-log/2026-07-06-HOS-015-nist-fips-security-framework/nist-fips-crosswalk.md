# HOS ⇄ NIST / FIPS crosswalk (attachment to HOS-2026-015)

**Status:** DRAFT for board intake — 2026-07-06.
**Companion to:** `proposal.yaml` in this directory.
**Purpose:** Map recognized U.S. federal security & privacy standards (NIST CSF, NIST
SP 800-63, NIST Privacy Framework, FIPS 199/200/140-3 and the FIPS-approved algorithm
suite) onto (a) the decisions HOS has already made, (b) the code that exists today, and
(c) the gaps — so the board can decide **which parts of NIST/FIPS earn their keep for a
small NGO under a nation-state threat model, and which are compliance theater we should
explicitly decline.**

---

## 0. The one framing that governs everything below

Two honest statements, up front, because they change the whole recommendation:

**(A) NIST/FIPS is mostly a vocabulary + a hygiene bar, not the answer to our apex threat.**
HOS-2026-008 already established (and the human answered D1: **YES, state is in scope —
latent**) that our worst case is **lawful compulsion of the host** (Supabase/Vercel,
foreign-hosted) plus insider leak and network interception. **No NIST control and no FIPS
module defeats a valid legal order served on the host.** The controls that hold there are
the ones HOS-008 already elevated: *collect less, don't retain a free-text who-helped-whom
ledger, and keep decryption keys outside the compellable jurisdiction.* NIST/FIPS is
adopted here as **(1) a shared vocabulary** that funders, partner NGOs (ICRC/UNHCR/OCHA),
and any future legal counsel already speak, and **(2) a hygiene floor** that closes the
"ordinary attacker" and "stolen dump" paths. It is explicitly **not** positioned as the
state-compulsion answer. Claiming otherwise would repeat the exact honesty failure the
HOS-008 judge warned against ("a protection we claim but do not deliver is the same failure
as a delivery we claim but do not make, applied to safety").

**(B) FIPS-approved *algorithms* ≠ FIPS-140-3 *validated modules*. Do the first; defer the second.**
This is the most important distinction in this document and the one most often
cargo-culted:

| | What it is | Cost to HOS | Recommendation |
|---|---|---|---|
| **FIPS-approved algorithms** (FIPS 197 AES, 180-4 SHA-2, 198-1 HMAC, 186-5 ECDSA/EdDSA, SP 800-90A DRBG) + **SP 800-131A** transition rules (no MD5/SHA-1/3DES, RSA≥2048, AES≥128) | A *coding standard*: pick approved primitives from `node:crypto`. | **Near zero.** Our two crypto call-sites already comply. | **ADOPT now** as an AGENTS.md §3 rule. |
| **FIPS 140-3 validated cryptographic module** (CMVP-certified module, "FIPS mode" OpenSSL, operated per its Security Policy) | A *procurement + operations* burden: run a validated module, don't touch non-approved crypto, re-validate on upgrade. | **High, brittle, ongoing.** Buys ~nothing against host compulsion. | **DECLINE** unless a specific funder/government partner contractually requires it (then it becomes their line item, scoped separately). |

Everything below is written to that grain: adopt the cheap, high-legibility, mission-serving
parts; decline the expensive parts that don't move our threat model.

---

## 1. FIPS 199 — security categorization of HOS

FIPS 199 asks one cheap, clarifying question: rate the **potential impact** (Low / Moderate /
High) of a breach of **Confidentiality, Integrity, Availability**. It costs nothing and it
*justifies* why we spend on confidentiality first.

| Objective | Impact | Why (HOS-specific) |
|---|---|---|
| **Confidentiality** | **HIGH** | Disclosure can get a person detained, disappeared, or killed. Named precedent in our own log: Rohingya biometric sharing; VenApp / *Operación Tun Tun* tied to a fatality in this population (HOS-008, HOS-012). A confidentiality breach is a life-safety event, not a privacy inconvenience. |
| **Integrity** | **HIGH** | A wrong match sends a family to a morgue/shelter (HOS-001 keeps matches advisory + human-verified for exactly this reason). A forged "need received" / false verification corrupts life-safety decisions (HOS-011-D3 found *no write path checks row ownership today*). |
| **Availability** | **MODERATE** | Crisis reachability matters, but HOS-008-D5 chose an offline-first + out-of-band-fallback plan over high-availability infrastructure. Degradation is survivable if the "we moved, contact this number" fallback exists; it is not itself life-ending. |

**System categorization = HIGH** (the high-water mark). The operational consequence we
actually care about: **confidentiality and integrity controls outrank availability
spend** — which is precisely the posture HOS-008 already adopted. FIPS 199 gives that
posture a name partners recognize.

---

## 2. NIST Cybersecurity Framework 2.0 — the governance spine

CSF 2.0 has six Functions. This is the recommended **organizing vocabulary** for HOS
security work: it's an outcome map, not a control checklist, so it fits the board process
without importing 1,000 controls. Each row: the CSF outcome, what HOS already has, and the
gap.

| CSF 2.0 Function | What it means | HOS today (evidence) | Gap / next |
|---|---|---|---|
| **GOVERN** (GV) | Risk decisions are made, owned, documented. | **Strong.** The whole `docs/decision-log/` board→judge process *is* a GV program; HOS-008 is a documented risk-acceptance; AGENTS.md §3–4 are the policy. | Name it: adopt CSF as the index over existing decisions. Add a one-line data-classification policy (see §3, FIPS-199-driven). |
| **IDENTIFY** (ID) | Know your assets, data, and threats. | **Strong on threat** (HOS-008 threat model, adversary classes enumerated). **Partial on data inventory** (schema is known; a field-by-field PII classification was *ordered by HOS-008-D2 but not yet written*). | Produce the HOS-008-D2 field-classification list (this is the "Identify → Asset/Data" deliverable). |
| **PROTECT** (PR) | Access control, data security, awareness. | **Partial.** Fail-closed coordinator gate (`auth.ts`), constant-time compare, rate limiting, redaction before external AI (`redact.ts`), append-only audit. **Missing:** per-user identity/MFA, org-scoped authorization (HOS-011 decided, not built), field-level encryption + key custody (HOS-008 escalated), TLS cert validation (see §5). | The bulk of the actionable work. Maps to SP 800-63 (identity, §4) + SP 800-131A (crypto, §5). |
| **DETECT** (DE) | Notice bad things happening. | **Weak.** Append-only `events` gives *forensic* reconstruction after the fact; there is **no active detection** (no alerting on anomalous access, no Sentry wired — EXTERNAL_DEPENDENCIES #13 is ⬜). | Add access anomaly signals + error/uptime monitoring. Lowest-maturity function today — worth naming honestly. |
| **RESPOND** (RS) | Have a plan when it happens. | **Partial.** `docs/incident-responses/` exists; governance has a "Critical / data breach" expedited path (24h + human). | Write one concrete IR runbook (who revokes tokens, rotates keys, notifies affected people) — currently the process exists but no drilled runbook. |
| **RECOVER** (RC) | Restore + learn. | **Partial.** Postgres managed backups (HOS-001-07); post-decision-review ritual exists. | Confirm backup restore is tested; define recovery-time expectation consistent with the "Moderate availability" categorization. |

**Takeaway:** HOS is strong on **Govern/Identify** (its whole culture) and weakest on
**Detect**. That's the opposite of most startups (strong tooling, no governance) and it's a
genuinely healthy shape — the cheap win is to *name* the existing structure in CSF terms so
it's legible externally, and to invest the marginal dollar in **Detect**.

---

## 3. NIST Privacy Framework 1.0 — because our "security" is mostly privacy

The NIST Privacy Framework mirrors CSF for **data processing risk** and its top control
family is **data minimization / purpose limitation** — which is exactly what HOS-008-D2/D3
already made the *primary* control. Adopting it is almost pure re-labeling of decisions HOS
already reasoned to independently.

- **PR.DS-P / CT.DM-P (minimization):** HOS-008-D2 ordered a field-by-field classification —
  do-not-collect / purge-after-use / coordinator-only / public-safe. **Not yet written.** This
  is the single highest-leverage IDENTIFY+PROTECT deliverable and needs no external dependency.
- **CT.DM-P (data lifecycle / retention):** HOS-008-D3 — stop writing free-text contact PII
  into `events.payload`; set retention TTL + redaction for high-signal event types. Maps to
  **NIST SP 800-88** (media sanitization / disposal) for the *how*. Ship-now, no dependency.
- **Data-classification policy (FIPS-199-anchored):** adopt a 4-tier label used consistently in
  schema comments and code:
  1. **PUBLIC-SAFE** — `givenName + city + status` projection (already the public API shape).
  2. **COORDINATOR-ONLY** — `full_name`, `reporter_contact`, `found_location`, `last_seen_location`, `sensitive_notes`, `photo_url`.
  3. **PURGE-AFTER-USE** — re-contact details once a family is reached (don't persist in the durable log).
  4. **DO-NOT-COLLECT** — anything not justified by a concrete reunification need.

---

## 4. NIST SP 800-63(-4) — Digital Identity — the "secure identity" ask, made concrete

800-63 splits identity into three orthogonal assurance axes. This is the right tool for the
"secure identity" half of the request, and — importantly — it **validates HOS's existing
identity decisions** while sharpening two gaps.

- **IAL** = identity *proofing* (how sure are we who this really is)
- **AAL** = *authentication* strength (how sure the session is the same person)
- **FAL** = *federation* assurance (trusting an IdP's assertion)

| Principal | Recommended target | Today (evidence) | Gap → action |
|---|---|---|---|
| **Coordinator** (sees full PII) | **IAL1–2 / AAL2** — MFA required for HIGH-confidentiality data | Supabase email+password = **AAL1**; OR a **shared** `HOS_COORDINATOR_TOKEN` = no per-person identity at all (`auth.ts:41-46`). bcrypt handled by Supabase. | **Enable Supabase MFA (TOTP) for coordinators → AAL2.** Supported, cheap, high-value. Retire the shared token as anything but break-glass, and attribute every action to a person (Phase-1 identity work). |
| **Field volunteer** (HOS-010, device-key + PIN) | **AAL2, IAL0 (pseudonymous) — by design** | Designed (GREEN_LIGHT HOS-010-D2), **not built.** Possession factor (device key) + knowledge factor (PIN). | This is a **good 800-63 posture**: high *authentication* assurance, deliberately *low identity proofing* (you do NOT want strong real-identity proofing of volunteers against a state adversary). Two 800-63B specifics to bake in: **(1) throttle/rate-limit the PIN** (800-63B requires rate-limiting memorized secrets — a 6-digit PIN is only safe with lockout); **(2) make the device key non-exportable** (WebAuthn platform authenticator / passkey), which HOS-010's design already leans toward. |
| **Refugee / family** (public) | **IAL0 / AAL0 — by design (no account)** | Public intake + public search, no login. | Correct to keep account-free. But the **public search oracle** (HOS-008-D4, `search.ts`) lets an unauthenticated caller confirm a person exists by name — an *identity-adjacent* leak. Close/coarsen it: "my case" must be **case-number-scoped**, never an open lookup. Ship-now, no dependency. |
| **Federation (Supabase as IdP)** | **FAL-appropriate: server-controlled claims only** | Supabase JWT. | HOS-011-D3 already flagged the trap: carry the org/tenant claim in **`raw_app_meta_data` (server-set)**, never `user_metadata` (user-editable), or a user rewrites their own org and reads another tenant. This is a federation-assurance (FAL) control — verify before any RLS policy is written against the claim. |

**Two concrete "secure identity" wins fall out of this table and need no new decision:**
**coordinator MFA (AAL2)** and **PIN throttling + non-exportable device key** in the HOS-010
build. Both are directly what the user asked for.

---

## 5. FIPS-approved algorithms + SP 800-131A — the crypto hygiene bar

Full audit is in the board packet; the short version, against real code:

| Call site | Primitive | FIPS-approved? | Verdict |
|---|---|---|---|
| `domain/ids.ts:5,8` | `crypto.randomUUID()` (CSPRNG, SP 800-90A DRBG under the hood) | Yes | ✅ Keep. |
| `http/auth.ts:15,44` | `crypto.timingSafeEqual()` constant-time compare | N/A (not a crypto transform, correct usage) | ✅ Keep. |
| PII fields (`schema.ts`) | *none* — `full_name`, `reporter_contact`, `found_location`, `sensitive_notes` stored **plaintext** | — | ⚠️ **No field-level encryption.** Escalated in HOS-008-D2 (needs key-custody design — see below). |
| `db/backends/postgres.ts:24,28` | TLS with **`rejectUnauthorized: false`** on *every* hosted path, including `HOS_PG_SSL=require` | Encryption present, **peer authentication disabled** | ❌ **Fix.** TLS without cert validation is MITM-able. Ship a pinned Supabase CA: `ssl: { ca: <supabase-root>, rejectUnauthorized: true }`. Near-free; maps to SC-8/SC-12/SC-13. |
| Coordinator token | stored in browser `localStorage` (`client/api.ts`) | — | ⚠️ XSS-exposed bearer secret. Prefer `httpOnly; Secure; SameSite` cookie when real auth lands; interim: strict CSP. |

**Adopt as AGENTS.md §3 crypto standard (SP 800-131A, near-zero cost):**
- Approved only: **AES-256-GCM** (authenticated encryption), **SHA-256/512**, **HMAC-SHA-256**,
  **HKDF/PBKDF2** for KDF, **Ed25519/ECDSA-P256** for signatures, **`crypto.randomUUID` /
  `crypto.getRandomValues`** for randomness.
- Banned: **MD5, SHA-1, 3DES, RC4, AES-ECB, `Math.random()` for anything security-bearing.**
  (Audit found **zero** current violations — this locks in the good state.)

**On field-level encryption (HOS-008-D2, still escalated):** encryption only counts as a
*state-adversary* control if the **key lives outside the host's compellable jurisdiction**
(client-held, or a KMS in a different legal domain than the Supabase project). With a
co-located key it defends the *stolen-dump* path only and **must be labeled as such.** This
is a human key-custody decision, not a code task — carried into the proposal as an escalation,
not a build item. AES-256-GCM is the approved algorithm *when* that decision is made.

---

## 6. What to adopt, defer, and decline (resource-honest)

**ADOPT NOW (cheap, high legibility, mission-serving):**
1. **CSF 2.0** as the security index over existing decisions (GOVERN/IDENTIFY already strong).
2. **FIPS 199 categorization** = C:High, I:High, A:Moderate → justifies confidentiality-first.
3. **NIST Privacy Framework** framing for the HOS-008-D2/D3 minimization + retention work (already ship-now).
4. **SP 800-63 identity targets:** coordinator **AAL2 (MFA)**; volunteer AAL2/IAL0 with PIN-throttle + non-exportable key; families IAL0 with the search-oracle closed.
5. **SP 800-131A approved-algorithm rule** in AGENTS.md §3; **fix the TLS cert validation.**

**DEFER (real, but blocked or later-gated — don't pretend they're in flight):**
- Field-level encryption **with** a real key-custody/jurisdiction decision (HOS-008-D2, human + ideally counsel).
- Org-scoped authorization + Postgres RLS (HOS-011, blocked on Postgres landing + case-table `org_id` policy — HOS-011-D4 human decision).
- **Detect** maturity: access-anomaly alerting + Sentry (EXTERNAL_DEPENDENCIES #13).

**DECLINE unless contractually required (compliance theater for our threat model):**
- **FIPS 140-3 validated cryptographic module / "FIPS mode."** Buys ~nothing against host
  compulsion; adds brittle ops. Revisit only if a specific funder/government partner
  mandates it in writing — then scope it as *their* requirement.
- **Full NIST SP 800-53 / 800-171 control-set compliance.** Use 800-53 as a *reference* to
  *name* the ~20 controls we actually implement (AC-3, AC-4, AU-2/AU-9, IA-2/IA-5, SC-8/SC-12/SC-13,
  SI-4, MP-6), not as a certification target. 800-171 only matters if U.S.-gov CUI enters scope.

---

## 7. Prioritized actions (mapped to the existing HOS-008 ship-now pile)

Deliberately, **most of the ADOPT-NOW work is already in the HOS-008 ship-now pile** — this
proposal *re-labels and completes it in a recognized framework*, it does not open a new front.

| # | Action | CSF / FIPS / 800-63 tag | Cost | Dependency |
|---|---|---|---|---|
| 1 | Write the HOS-008-D2 field-by-field PII classification (4-tier) | ID.AM / Privacy CT.DM-P; FIPS-199-anchored | Low | none (ship-now) |
| 2 | Stop persisting free-text contact PII in `events.payload`; set retention TTL | PR.DS / CT.DM-P; SP 800-88 | Low–Med | none (ship-now) |
| 3 | Close/coarsen the public search existence oracle (case-number-scoped) | PR.AC; 800-63 IAL0 boundary | Low | none (ship-now) |
| 4 | Fix Postgres TLS to validate the pinned Supabase CA | PR.DS-2; SC-8/SC-13; FIPS-approved TLS | Low | Supabase root cert |
| 5 | Enable coordinator MFA (Supabase TOTP) → AAL2; per-person attribution | PR.AA; 800-63 AAL2; IA-2 | Low–Med | Supabase Auth on |
| 6 | Add SP 800-131A approved-algorithm rule to AGENTS.md §3 | GV / PR.DS; FIPS 197/180-4/198-1 | Low | none |
| 7 | Bake PIN-throttle + non-exportable device key into the HOS-010 build | 800-63B AAL2 | (in HOS-010) | HOS-010 build |
| 8 | Add access-anomaly alerting + error monitoring (Sentry) | DE.CM / DE.AE; SI-4 | Med | Sentry key (#13) |
| 9 | One concrete incident-response runbook (revoke/rotate/notify) | RS.MA; IR-* | Low | none |
| — | Field-level encryption **with key custody** | PR.DS-1; FIPS 197 AES-256-GCM | Med | **human decision** (escalated) |
| — | Org-scoped RLS + case-table `org_id` | PR.AC-4; AC-4 | High | Postgres + HOS-011-D4 human decision |

Items 1–4 are free and already blessed by HOS-008. Items 5–6 and 9 are cheap net-new. Items
8 and the two escalations are the genuine investments — flagged as such, not smuggled in.

---

## 8. Standards index (for anyone verifying this mapping)

- **NIST CSF 2.0** — Cybersecurity Framework (Govern/Identify/Protect/Detect/Respond/Recover).
- **NIST Privacy Framework 1.0** — data-processing risk; minimization-first.
- **NIST SP 800-63-4** — Digital Identity Guidelines (IAL/AAL/FAL); **-63B** for authenticators (PIN throttling, non-exportable keys).
- **NIST SP 800-53 Rev 5 / FIPS 200** — control catalog + minimum requirements (used as a *reference namer*, not a target).
- **NIST SP 800-171** — CUI in nonfederal systems (out of scope unless U.S.-gov data enters).
- **NIST SP 800-207** — Zero Trust Architecture (the human's "zero-trust" is closer to data-minimization + key-custody than to 800-207 network ZTA; named to avoid conflation).
- **NIST SP 800-88** — media sanitization / disposal (retention & deletion how-to).
- **NIST SP 800-131A** — approved-algorithm transitions (the practical crypto rule).
- **FIPS 199 / 200** — security categorization / minimum requirements.
- **FIPS 140-3** — cryptographic *module validation* (declined unless mandated).
- **FIPS 197 (AES) · 180-4 (SHA-2) · 198-1 (HMAC) · 186-5 (ECDSA/EdDSA)** — approved algorithms.

> This crosswalk is a proposal attachment, not a ratified control set. It takes effect only
> if HOS-2026-015 passes board review and the escalations in `proposal.yaml` are answered by
> the human principal.
