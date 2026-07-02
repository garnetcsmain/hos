# Principals Review: HOS-2026-008

## My Recommendation
🟡 RESHAPE

Option B is internally consistent and matches this project's established pattern (thin honest step, model-early, defer-heavy-infra). The reshape is to (a) separate the parts that need no external input from the parts that are genuinely blocked, and (b) refuse to let a control be *called* protective when it isn't, because that would violate the honesty principle at the level of the safety story itself.

## Principles Alignment
- **AI recommends, people decide** — NEUTRAL. This is a data-governance decision, not an automated-action one. The proposal correctly routes the core adversary question to a human rather than deciding it (aligned in spirit).
- **Information before interfaces** — ALIGNED. Tiered visibility (right information to the right role) is a direct expression of this principle; a refugee sees status + nearby services, a coordinator sees the case.
- **Trust & honesty layer** — ALIGNED *only if reshaped*. Honesty must extend to the controls themselves: claiming "field-level encryption protects against the state" while the key is co-located with the ciphertext (see Contrarian F1; today there is no encryption at all — `apps/web/app/lib/http/auth.ts:15`, `ids.ts:5` are the only crypto uses) would be recording a protection that does not happen — the exact "never claim something that did not happen" failure, applied to security instead of delivery.
- **Data minimization / least-PII** — currently **VIOLATED in practice**, and this is the decision that fixes it. `sensitive_notes`, `reporter_contact`, and precise `found_location`/`last_seen_location` are stored plaintext (`apps/web/app/lib/db/schema.ts:26,29,44,51`), and the `events` table retains a permanent, free-text, actor-linked correlation trail with no retention policy (`schema.ts:145-154`, `familyReach.ts:96-104`). Option A leaves this VIOLATED. Option B moves it toward ALIGNED — but the strongest form of the principle is *don't collect/retain*, which beats *encrypt*.
- **Auditability** — **INTERNAL TENSION** (the sharpest finding). The append-only event store is *mandated* by this principle and is simultaneously the single richest correlation asset if leaked. The two principles (Auditability and Data-minimization) genuinely conflict here; the proposal is right to force a retention/exposure policy rather than pretend they don't. The resolution is not to abandon auditability but to minimize the *payload* (attribution without free-text contact detail) and set a retention TTL on the highest-signal event types.
- **Crisis-grade & reversible** — ALIGNED for Option B; **VIOLATED by Option C.** Tor-first / heavy-infra reachability degrades low-bandwidth access, which is anti-crisis-grade for the exact patchy-data users HOS serves. The reachability *plan* (offline-first, multiple domains, out-of-band fallback) is crisis-grade; building the bunker first is not.

## Logic Check
1. Claim: "Adopt minimization + field encryption now, plan reachability, defer heavy infra." — **Holds.** Internally consistent and matches the HOS-2026-007 precedent (approve the honest thin slice, defer the platform).
2. Claim: "Formalize tiered visibility as HOS-2026-001-08's acceptance criteria." — **Partially holds; contains an unstated dependency.** 001-08's org-isolation half is hard-blocked on Postgres (BLK-001), and there is *no role primitive today* — the gate is binary coordinator-vs-public (`auth.ts:66-79`). Writing the tiers as a spec is free and correct; *enforcing* them is blocked two deep. The condition must state that chain or it is unschedulable and the gate silently stays open — the very outcome this proposal exists to prevent.
3. Claim (implicit): "Field encryption is the state-adversary control." — **Non-sequitur as written.** Encryption defeats a stolen dump; it defeats host compulsion only if key custody is separated from ciphertext custody. Collecting-less is the control that holds against compulsion. Flag and correct.

## Simplest Solution
Occam's razor cleanly splits this decision into two piles, and the split is the reshape:

**Pile 1 — needs nothing external, ship now, no political answer required:**
- Set an audit-log retention + payload-minimization policy (stop writing free-text contact detail into `events.payload`; TTL the highest-signal types).
- Close/coarsen the live public search oracle (`api/search/route.ts` — today unauthenticated name→status).
- Write the data-minimization field list (which fields we stop collecting entirely, which we mask, which are coordinator-only).

**Pile 2 — genuinely blocked, escalate honestly, do not pretend it's in-flight:**
- The core adversary classification — a human political/safety judgment (correctly escalated).
- Field-level encryption with a real key-custody answer — needs a design decision the human must make.
- Enforced tiered visibility — needs Postgres (BLK-001) + a role primitive (neither exists).

What's lost by simplifying: nothing. Pile 1 is pure gain and unblocks the recurring gate; Pile 2 was already blocked whether or not we write it down.

## Technical Debt Created
Every plaintext sensitive field and every free-text event payload written *today* is debt that gets more expensive to remediate as PII accumulates — encrypting/minimizing later costs more than not-collecting now. The decision that reduces future debt most is the data-minimization field list (Pile 1), not the encryption commitment (Pile 2).

## Confidence Score
**0.8** — Why not higher: the Auditability-vs-Minimization tension is real and I've proposed a resolution (minimize payload, TTL, keep attribution) but haven't proven it satisfies every future audit need; and the encryption key-custody question is a design decision I can frame but not decide.

## What I Don't Know
Whether a compellable-jurisdiction analysis of the Supabase host changes which controls are load-bearing — that's a legal question outside first-principles reasoning.
