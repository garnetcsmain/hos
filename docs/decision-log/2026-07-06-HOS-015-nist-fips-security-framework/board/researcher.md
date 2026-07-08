# Researcher Review: HOS-2026-015

## My Recommendation
🟡 RESHAPE — adopt Option B, but correct one factual assumption that materially changes the
"partnership legibility" argument: **humanitarian partners predominantly speak ISO 27001 and
the ICRC data-protection canon, not NIST/FIPS.** Adopt NIST/FIPS as an internal hygiene +
engineering vocabulary (where it is genuinely strong and cheap), and cross-map the
outward-facing posture to ISO 27001 / the ICRC Handbook for the legibility claim. The
FIPS-approved-algorithm vs FIPS-140-3-module distinction, by contrast, is drawn correctly and
should stand as written.

## Comparable Systems
- **ICRC (Restoring Family Links / general data protection):** governs by the **ICRC Handbook on
  Data Protection in Humanitarian Action** (ICRC + Brussels Privacy Hub, 2nd ed. 2020) and
  internal ICRC Rules on Personal Data Protection, which are **GDPR-aligned**, not NIST-aligned.
  The operative concepts are *purpose limitation, data minimization, "do no harm," and lawful
  basis* — a privacy/DP frame, not a US-federal cybersecurity-controls frame. (source: ICRC
  Handbook, publicly available.)
- **UNHCR:** operates under its own **Policy on the Protection of Personal Data of Persons of
  Concern (2015, updated guidance since)** and the broader UN data-protection principles (UN
  Principles on Personal Data Protection and Privacy, 2018). GDPR-lineage, DP-principle based.
- **OCHA / the humanitarian "cluster" system:** the **OCHA Data Responsibility Guidelines** and
  the IASC **Operational Guidance on Data Responsibility in Humanitarian Action** are the shared
  reference for inter-agency data sharing — again a *data-responsibility* frame, not NIST CSF.
- **Primero / RapidFTR (the closest functional comparables — child protection + family tracing,
  UNICEF-backed):** Primero is deployed by UN agencies and NGOs and is evaluated primarily on
  **data-protection posture and hosting/sovereignty**, with security commonly expressed via
  **ISO 27001** for the hosting/organizational layer. I have not verified a specific Primero
  FISMA/NIST authorization; my confidence that its *primary* legibility frame is ISO 27001 + DP
  guidance rather than NIST is moderate-high.
- **General enterprise/NGO due-diligence baseline:** the near-universal "do you have a recognized
  security posture?" checkbox in non-US procurement is **ISO/IEC 27001 (+27701 for privacy)** and
  increasingly **SOC 2** for US-centric SaaS vendors. NIST CSF is widely respected as a *framework*
  but is most often a *US critical-infrastructure / US-federal-adjacent* expectation.

## Ground-Truth Data
- **FIPS-approved algorithm vs FIPS 140-3 validated module distinction: CORRECT as written.**
  FIPS 140-3 (CMVP) validates a *cryptographic module* and its operation ("FIPS mode"); it is a
  procurement/ops burden that, per the proposal, "buys ~nothing against host compulsion." Using
  FIPS-*approved algorithms* (AES per FIPS 197, SHA-2 per FIPS 180-4, HMAC per FIPS 198-1,
  ECDSA/EdDSA per FIPS 186-5, DRBG per SP 800-90A) as a *coding standard* is near-free and correct.
  The proposal draws this line accurately; it is the single most-cargo-culted distinction in
  security compliance and they got it right. (confidence: high.)
- **NIST SP 800-63 as the identity vocabulary: appropriate and non-controversial.** IAL/AAL/FAL is
  a clean, widely-cited decomposition even outside the US; using it to name "coordinator AAL2,
  volunteer AAL2/IAL0, family IAL0" is sound and buys real clarity. (confidence: high.)
- **Code claims I could verify in-repo (I checked):** `ids.ts:5` uses `crypto.randomUUID()` (CSPRNG);
  `auth.ts:15` uses `timingSafeEqual`; these are the only crypto call-sites and both are
  FIPS-approved/appropriate — the "zero current violations" audit claim holds. The
  `postgres.ts` TLS defect is **real and slightly worse than stated**: `sslConfig()` returns
  `{ rejectUnauthorized: false }` for `HOS_PG_SSL=require` (line 24) *and* the hosted default
  (line 28), so peer authentication is disabled even when an operator explicitly requests
  `require`. (confidence: high — read directly.)

## Assumption Tests
| Assumption (from proposal) | Verdict | Evidence |
|---|---|---|
| "NIST/FIPS is a vocabulary funders, ICRC/UNHCR/OCHA, and legal counsel already speak" | **CONTRADICTED (partially)** | Humanitarian partners predominantly evaluate against ISO 27001 + ICRC/UNHCR/OCHA data-responsibility guidance (GDPR-lineage), not NIST/FIPS. NIST is more legible to *US-federal/critical-infra* and *US funders*. The legibility is real but pointed at the wrong audience unless cross-mapped. |
| "FIPS-approved algorithms, not FIPS 140-3 validation" is the right line | **SUPPORTED** | Correct and well-drawn (see Ground-Truth). |
| "Most adopt-now work is already the HOS-008 pile" | **SUPPORTED** | Cross-checked against HOS-008 judge_decision.yaml ship-now list; D2/D3/D4 match. |
| "Coordinator MFA is a cheap adopt-now win" | **UNKNOWN → lean SUPPORTED for MFA-toggle, CONTRADICTED for full AAL2** | Enabling Supabase TOTP is cheap; per-person attribution requires retiring the shared token (HOS-001-08). Concurs with Contrarian/Principals. |
| Declining 140-3 leaves no real gap for our threat model | **SUPPORTED** | 140-3 does not defeat host compulsion (our apex threat, HOS-008-D1=YES) nor most realistic attackers here; correct to decline absent a written mandate. |

## Unknown Unknowns
- Whether a *specific* target funder is US-based (would make NIST CSF the *right* passport) or
  EU/UN-based (would make ISO 27001 + ICRC Handbook the right one). This is the pivot the whole
  "legibility" upside turns on, and I can't resolve it without knowing the funder pipeline. The
  safe move is to **cross-map both** — NIST internally, ISO 27001 / ICRC outward — which is cheap
  while the document is being written and expensive to retrofit.
- Whether HOS's actual first partner cares about a *framework* at all vs. a concrete data-sharing
  agreement + hosting-sovereignty answer (which is a HOS-008-D2 key-custody question, not a NIST one).
- I did not independently verify Primero's exact certification status; my ISO-27001-primacy claim
  for the humanitarian sector is from the sector's published DP canon, not a per-tool audit.

## Confidence Score
**0.76** — high confidence on the FIPS-algorithm-vs-module correctness, the code claims (read
directly), and the direction of the ISO-vs-NIST legibility correction; lower confidence on its
*magnitude* (how much it actually costs HOS a door) because that depends on an unknown funder/partner
pipeline. The reshape is "also map to ISO/ICRC," not "abandon NIST" — NIST/FIPS is genuinely the
better *engineering* vocabulary (800-63 identity, the algorithm suite) even where ISO is the better
*procurement* passport.
