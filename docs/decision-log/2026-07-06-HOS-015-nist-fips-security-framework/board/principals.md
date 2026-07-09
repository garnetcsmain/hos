# Principals Review: HOS-2026-015

## My Recommendation
🟡 RESHAPE (narrow) — approve Option B, with the honesty guardrail made binding and one
categorization tension named. This is close to a GREEN LIGHT; the reshape is small because
the proposal has already done most of the principles work itself.

## Principles Alignment
- **AI recommends, people decide:** NEUTRAL — this decision is about security/identity
  vocabulary; it neither adds nor removes automated life-affecting action. No conflict.
- **Information before interfaces:** ALIGNED — the proposal is explicitly "vocabulary + hygiene
  floor, not a compliance program," i.e. correct security substance over the *appearance* of
  compliance (declining 140-3 validation and 800-53 certification is this principle applied to
  security theater). It resists polish-for-its-own-sake.
- **Trust & honesty layer:** ALIGNED **only if** success_criterion #5 is enforced. The proposal's
  central risk (risk #2, "false assurance") is a direct honesty-principle hazard: labeling the
  system "NIST/FIPS-aligned" could assert a protection against host compulsion that the design
  does not deliver. The proposal names this and proposes the complement-not-substitute statement
  as the mitigation. That mitigation is *necessary and sufficient* — but it must be a binding
  output, not intent, or the principle is VIOLATED in practice. (See Reshape condition 1.)
- **Data minimization / least-PII:** ALIGNED — adopting the NIST Privacy Framework framing over
  the HOS-008-D2/D3 minimization+retention work re-affirms the existing primary control. It does
  not weaken it; it names it. FIPS 199 C:HIGH is the same posture in recognized terms.
- **Auditability:** ALIGNED — CSF GOVERN maps onto the existing decision-log/board process; the
  append-only event store maps to AU-2/AU-9. Nothing here erodes attribution.
- **Crisis-grade & reversible:** ALIGNED, with one caveat below (FIPS 199 Availability=MODERATE
  must not become a license to under-invest in reachability the mission depends on).

## Logic Check
1. **Claim:** "Most of the adopt-now work is already the HOS-008 ship-now pile; this proposal
   re-labels and completes it." — **Holds.** Verified against the code and the HOS-008 judge
   decision: D2 field-classification, D3 event-log retention, D4 oracle-narrowing are all
   already-blessed HOS-008 items. This is a re-framing, not a new front. Good — it means the
   marginal cost is genuinely the vocabulary + three small net-new items, not a program.
2. **Claim:** "FIPS-approved algorithms ≠ FIPS-140-3 validated modules; do the first, defer the
   second." — **Holds, and is the load-bearing distinction.** This is drawn correctly and is the
   difference between a coding standard (near-free) and a procurement/ops burden (high). Declining
   140-3 for our threat model is sound: a validated module does not defeat a legal order on the host.
3. **Claim:** "Coordinator MFA is a low-cost adopt-now win." — **Partially holds / over-stated.**
   Enabling Supabase TOTP is cheap; but "every coordinator action attributed to a person" (the
   actual point of AAL2) is gated on retiring the shared `HOS_COORDINATOR_TOKEN` (auth.ts:22-46),
   which is HOS-001-08 work, still in progress. The claim conflates "turn MFA on" with "achieve
   AAL2 with attribution." Non-sequitur to report the latter done when only the former shipped.
   (Concurs with Contrarian Flaw 2.)
4. **Claim:** "Adopt 800-53 as a reference namer, not a certification target." — **Holds and is
   the Occam-correct move** (see below). Importing the full catalog would be the error; naming
   ~20 implemented controls is not.

## Simplest Solution
Occam's razor *approves* the shape of this proposal and warns against exactly one over-reach.
The simplest thing that achieves the stated end — external legibility + a hygiene floor + the
two concrete identity wins — is: **adopt CSF 2.0 as an index, FIPS 199 as a one-page
categorization, the Privacy-Framework framing over already-decided minimization, the 800-63
identity targets, and one AGENTS.md crypto rule; use 800-53 purely as a reference vocabulary.**
The proposal is already scoped to precisely this. The razor's warning: do **not** let the
800-53 "reference list" drift into a control-by-control self-assessment, and do **not** author
new standalone policy documents where a paragraph in an existing one (AGENTS.md §3, the
decision-log) suffices. Vocabulary should be *thin*. What is lost by staying thin: a glossier
compliance binder — which the proposal correctly identifies as the thing NOT worth its cost.

## Technical Debt Created
- **Low, and mostly acknowledged.** The genuine new debt is the AGENTS.md crypto rule *without a
  CI check* — a written rule with no enforcement is latent debt (it silently rots the first time
  someone violates it and no gate catches it). The proposal should either add a lightweight lint/CI
  check or explicitly log that enforcement is review-only for now.
- **One unnamed tension: FIPS 199 Availability = MODERATE vs. Crisis-grade.** The categorization is
  defensible (HOS-008-D5 chose offline-first + out-of-band fallback over HA infra). But "Moderate
  availability" written into a security artifact must not later be cited to justify under-investing
  in the reachability the mission depends on. The two are consistent *today*; name the boundary so a
  future reader doesn't weaponize the label against crisis-grade reach.
- **Sequencing honesty (shared with Contrarian):** RLS and field encryption are correctly in
  `scope.out` as blocked/escalated. Keep them there in the task registration too, or the framework
  will *imply* coverage (Detect, org-isolation) that is not in flight — paperwork masquerading as
  protection.

## Confidence Score
**0.83** — the internal logic is sound, the honesty hazard is self-identified with the right
mitigation, and the code claims I could check (crypto call-sites, TLS defect, shared token) all
verified. Not higher because the honesty guardrail's *enforceability* is the whole game and lives
outside this document, and because the availability-vs-crisis-grade tension, while minor, is real.

## What I Don't Know
- Whether the complement-not-substitute statement will actually be embedded in outward-facing
  artifacts (the difference between ALIGNED and VIOLATED on the honesty principle).
- Whether a lightweight CI enforcement of the crypto rule is feasible in this toolchain, or whether
  it stays review-only (affects the debt assessment).
