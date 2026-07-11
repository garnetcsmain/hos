# Principals Review: HOS-2026-009

## My Recommendation
🟡 RESHAPE — Option A is logically consistent with HOS's principles in its *intent*, but two elements as written violate stated principles (the stored reference photo violates data minimization; shipping ahead of the HOS-2026-008 minimization floor violates the ordering the proposal itself declares). Fix those two and it is a GREEN. Option B is a clean 🔴 KILL on principle, not just on risk.

## Principles Alignment

- **AI recommends, people decide**: ALIGNED. Option A contains no automated action against a person. The absence alert is a "needs a look" signal to a human coordinator; escalation beyond the coordinator is explicitly a human decision (`scope.out`). This is the principle honored correctly. (Option B's automated geofence alerting would strain it — a system inferring "child left the zone" and acting is closer to automated life-affecting action.)

- **Information before interfaces**: ALIGNED. The proposal is a data/event model (record + check-in event + absence rule) reusing the existing repository and event store, not a new interface surface. Correct priority.

- **Trust & honesty layer**: ALIGNED *only if* the honesty framing is enforced in the UI, not just intended. The proposal states the alert must read as "needs a look, not a confirmed incident" (risk #1) — this is the direct descendant of the HOS-2026-007 ruling that a stale signal must read as stale. It is ALIGNED as written but it is a *conditional* alignment: if a coordinator UI ever renders a present check-in as "child is safe" or an absent one as "child is missing," the principle flips to VIOLATED. Make the honest wording a binding acceptance criterion.

- **Data minimization / least-PII**: **VIOLATED** as written, in one specific field. The core record (system ID + nickname + age band + assigned site) is genuinely minimal and defensible. But `scope.in` includes "an optional reference photo." A photo is the highest-PII, highest-reidentification field the record could carry, and the proposal's own worst-case-breach description (`success_criteria` #4, `user_impact`) does not even list it — meaning the document simultaneously stores the photo and reasons as if it hadn't. That is the non-sequitur (see Logic Check #2). Minimization says collect the minimum that achieves the purpose; the stated purpose is *fast detection of absence*, which a photo does not serve — detection runs on the check-in event, not the photo. The photo serves a *different* purpose (human identity confirmation) that has not been shown to require storage rather than in-person verification. Drop it or gate it separately, and this row returns to ALIGNED.

- **Auditability**: ALIGNED. Check-ins are the same event-sourced, attributed, append-only pattern used for coordination transitions. Every presence assertion is attributable to its author. This is a strength — though note (see Logic Check #3) that attribution is not the same as *trustworthiness* of the attributed actor.

- **Crisis-grade & reversible**: PARTIAL / NEUTRAL. The record is reversible (a resolved/checked-out state, a corrected mis-mark). But "crisis-grade" cuts against the design: the mechanism's reliability degrades exactly when load is highest (chaotic shift → missed check-ins → noise), which is a User/Contrarian concern more than a principles one. Neutral on principle; flagged as a real-world reliability question for those reviewers.

## Logic Check

1. **Claim:** "Option A is the safe alternative to Option B because it removes biometrics and continuous location." — **Holds, partially.** It removes the two worst mechanisms. But "safe" is relative, not absolute: it still concentrates a named, enumerable-unless-prevented list of the most vulnerable individuals in the response. The claim should be stated as "materially less dangerous," not "safe." The proposal mostly does this honestly; the word "safe" should not creep into downstream copy.

2. **Claim (implicit):** "The reference photo is low-cost because it's only for human viewing." — **Does not hold.** The "for human viewing only, no algorithmic matching" qualifier constrains *our* use, not an adversary's. Once stored, the photo is a photo; a breach or compulsion does not honor the intended-use label. The proposal reasons about breach impact as if the photo weren't there while keeping it in scope. Non-sequitur. Resolve by removing the photo from stored scope.

3. **Claim:** "A named responsible adult checks the child in" establishes accountability. — **Holds for *attribution*, not for *trust*.** Answering the proposal's own Principals question directly: the current org/actor model gives us *who asserted the check-in* (attribution — real, append-only, good). It does NOT give us *whether that person is a legitimate guardian* (vetting — absent). These are different guarantees. The proposal needs a **minimum answer** before shipping, but the minimum answer is NOT "build a vetting system" (we can't). The minimum answer is a **separation-of-duties invariant**: the record that vouches for a child's presence must not be authorable *solely* by the self-declared guardian; an assigned site actor must be able to author or co-sign it. That is buildable today with the existing attribution model and closes the logical gap between "attributed" and "trustworthy" as far as it can be closed pre-real-auth. Without it, the system's presence record can be wholly authored by the one person it most needs to be independent of.

4. **Claim:** "No new external dependency; reuses existing layers." — **Holds.** Verified against the architecture: repository layer, append-only event store, coordinator gate all exist. This is genuinely a data-model + rule addition, not new infrastructure. Good.

## Simplest Solution

Occam's razor strongly favors a **stripped Option A**:

- Minor record = system ID + nickname + age band + assigned site. **No stored photo.**
- Check-in = existing event pattern, authored by an assigned site actor (guardian may be present but is not the sole author — the separation-of-duties invariant).
- Absence rule = a pure function over the last check-in timestamp and a per-site window; alert on N consecutive missed windows to the area coordinator; honest "needs a look" wording; one-tap acknowledge.
- Coordinator-only; no list/export/aggregate endpoint.

What is lost by simplifying (dropping the photo, the self-check-in geofence): a marginal identity-confirmation convenience and an optional phone-based self-check-in. Both are additive later behind their own gates. Neither is on the critical path to the stated purpose (fast absence detection). The self-check-in "district boundary check at the instant of confirmation, then discarded" is *cleverly* minimal and I do not object to it on principle — but it is the kind of location-adjacent feature that HOS-2026-008/010/012 have repeatedly reshaped, and it is not needed for the MVP, so Occam says defer it, don't build it in v1.

## Technical Debt Created

- **Owned and acceptable:** reuses existing layers, so no new infra debt. Good.
- **Unowned unless conditioned:** if the photo ships, HOS acquires its first image-storage-of-a-vulnerable-person obligation (retention, access, deletion, breach exposure) with no image-handling posture defined. That is real debt the proposal does not cost. Dropping the photo avoids it entirely.
- **Sequencing debt:** the proposal's own note says the record fields "should be re-checked against whatever field-level-protection posture HOS-2026-008 produces before implementation." HOS-2026-008's minimization posture *has now landed* (docs/security/HOS-2026-008-data-minimization-and-posture.md + docs/DATA_MINIMIZATION.md). So this is no longer a future dependency — it is a **check that can and must be run now**: every field of the minor record must be bucketed against that ledger before any code. Not doing so would repeat the exact violation HOS-008 was built to prevent.

## Confidence Score
**0.83** — why not higher: the separation-of-duties invariant (Logic Check #3) is my proposed minimum answer to a hard problem (guardian trust) that no amount of first-principles reasoning fully solves under a self-declared-identity auth layer; a child-protection specialist may have a stronger standard. And the crisis-grade reliability question (does anyone actually check in under load) is an empirical one I can't resolve from principles — it belongs to the User persona.

## What I Don't Know
- Whether child-protection standards require a stored reference photo for identity confirmation (Researcher should check — if they do, the minimization tradeoff changes and needs an explicit, gated decision rather than an "optional" field).
- Whether the existing coordinator gate is a sufficient access boundary for *this* dataset specifically, or whether the most-sensitive-list-in-the-system deserves a stricter gate than the coordination board gets. Leaning toward "stricter," but that depends on the HOS-2026-011 capability model landing.
- The real missed-check-in base rate — decisive for whether the absence signal is usable at all, and it's not a principles question.
