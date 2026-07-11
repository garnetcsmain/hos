# Contrarian Review: HOS-2026-009

## My Recommendation
🟡 PROCEED WITH CONDITIONS (Option A only) — and I want the conditions treated as load-bearing, not decoration. Option B is a 🔴 KILL this cycle and I will fight anyone who tries to smuggle it back in as an "extension."

## Fatal Flaws Found

### Flaw 1: The non-biometric dataset is still the single most dangerous list HOS would ever hold
**Severity:** 🔴 CRITICAL

**What breaks:** The proposal frames Option A as the safe option because it drops the face template and the GPS trail. True — but read what remains in scope (proposal `scope.in`): a name/nickname, an age band, an assigned site, and *an optional reference photo*. That is, per record: *this specific vulnerable child is at this specific place, and here is what they look like.* A trafficker does not need a face-embedding vector to use that; they need a name, an age, a place, and a photo. Option A hands over three of the four and calls the fourth optional.

**Why it's real:** The proposal's own `user_impact` says the worst-case breach is "a name and an assigned site." That undersells it by exactly the reference photo the same document puts in scope. "A photo for human viewing" is still a photo in the database; the adversary does not respect the "for human viewing only" label. Under the HOS-2026-008 latent-state-adversary posture the human already ratified (state in scope, host is compellable), this table is subpoenable from Supabase like every other. A named roster of unaccompanied minors and where they sleep is the Operación Tun Tun targeting problem the board named in HOS-2026-012, pointed at children.

**Impact:** If breached or compelled, the feature inverts: the safeguarding tool becomes the targeting tool. This is the exact failure mode HOS-2026-006 cited (Rohingya biometric sharing) minus the biometrics but plus the concentration — one query returns *all* the unaccompanied minors in the response, which no other HOS table does.

**Could we fix it?** PARTIAL, and only with conditions:
- The reference photo must be **out of scope for v1**, not "optional." Human visual confirmation can be done by the responsible adult who is physically present; storing the photo buys a marginal identification convenience at the cost of the single worst field in the record. If a photo is ever added it needs its own gate.
- The record must be **non-enumerable by construction**: no "list all minors" endpoint, no export, no aggregate count surface (the proposal says this in `scope.out` — it must be enforced in code and tested, not just promised).
- It must inherit the HOS-2026-008 minimization floor as a hard precondition, not a "should" (proposal risk #2 already flags this; make it binding).

### Flaw 2: The trust anchor is a stranger, and the proposal knows it
**Severity:** 🔴 CRITICAL (for how it's *presented*), 🟡 MEDIUM (for whether Option A can still ship)

**What breaks:** The whole mechanism rests on "a named responsible adult checks the child in." HOS has no vetting of that adult — the shared/interim auth layer means the "named responsible adult" is self-declared, exactly like every other actor today. The proposal admits this (risk #3, `constraints`). So the system's authoritative record of who is responsible for a child is an unverified self-assertion.

**Why it's real:** The most common trafficking pattern for unaccompanied minors is not a stranger snatching a child from a shelter — it is an adult who presents *as* the child's guardian/relative and walks them out the front door with everyone's blessing. If that adult is the "responsible adult of record," the check-in system will show the child as **present and accounted for** right up until they are gone, and then show a clean, on-time check-in history authored by the trafficker. The feature does not just fail to catch this case — it can *launder* it, producing an audit trail that says "supervised" over an abduction.

**Impact:** A coordinator reading a tidy check-in log could be *more* reassured about the highest-risk case, not less. That is worse than no feature, because it manufactures false confidence precisely where vigilance is most needed.

**Could we fix it?** The honest fix is framing + a separation-of-duties rule, not a vetting system we can't build:
- The check-in must be performable — and ideally *co-signed* — by someone structurally independent of the claimed guardian (an assigned site caseworker/volunteer), so the guardian is never the sole author of the record that vouches for them.
- Every coordinator-facing surface must state plainly: **"A present check-in means someone recorded this child as here. It does not mean the child is safe, and it does not verify who the responsible adult is."** This is the HOS-2026-007 honest-state rule ("stale must read as stale") applied to presence.

### Flaw 3: "No check-in" is a hopelessly noisy signal in exactly the conditions it's meant for
**Severity:** 🟠 HIGH

**What breaks:** The absence alert fires when no check-in event lands in a window. In a chaotic shelter during an emergency — the design environment — the dominant reason for a missed check-in is *the adult was busy*, not *the child is gone*. The User review will quantify the adoption problem; my point is the base-rate one: if 95% of missed check-ins are the adult forgetting, coordinators learn within a day that the alert means nothing and start ignoring all of them, including the one real one. This is the smoke detector that cries wolf until someone pulls the battery.

**Why it's real:** This is the textbook alarm-fatigue failure mode (well documented in clinical monitoring and industrial alarms). The proposal's honesty framing ("needs a look," not "confirmed incident") is correct but does not fix alarm fatigue — it just means the useless alerts are honestly labeled useless.

**Could we fix it?** Partially: the window must be coordinator-configurable per site (proposal already says this), the alert should escalate on *consecutive* missed windows rather than one, and there must be a one-tap "seen, adult confirms child present" acknowledgement so the signal-to-noise can actually be tuned in the field. But be honest in the record that this is a genuinely hard signal-design problem, not a solved one.

### Flaw 4: Scope creep to Option B is the predictable next request, and inaction now invites it
**Severity:** 🟠 HIGH

**What breaks:** The proposal itself names this (risk #4). I want it on the record as a near-certainty, not a risk: the first time a child *does* go missing and Option A didn't prevent it, the reaction in the room will be "see, we should have had the face-ID and GPS." The emotional logic of "we failed a child, add more surveillance" is nearly irresistible and is exactly how biometric child databases get built after a tragedy.

**Could we fix it?** Only with a governance pre-commitment: the Judge must record that Option B is **declined this cycle and any future move toward biometric or continuous-location tracking is a NEW strategic decision requiring a child-protection specialist and legal counsel** — not an extension of this approval, not a coordinator toggle, not a "phase 2." Put it in the verdict so the future-us who is grieving and angry has a written speed bump.

## Assumptions We're Betting On

| Assumption | Confidence | Risk If Wrong |
|-----------|-----------|---|
| "The responsible adult is who they say they are" | 30% | Feature launders an abduction with a clean check-in log |
| "Coordinators will keep trusting the absence alert" | 35% | Alarm fatigue; the one real alert is ignored |
| "A stored reference photo is low-marginal-risk" | 20% | It's the single worst field; makes a breach a visual targeting kit |
| "This won't creep toward Option B" | 40% | First tragedy triggers 'add biometrics' with no fresh gate |
| "Coordinator-only + no-export is enforced, not just intended" | 60% | An enumeration endpoint turns the record set into a population registry |

## Edge Cases We Haven't Addressed

1. Guardian-is-trafficker → clean check-in history authored by the abductor.
2. Child legitimately leaves (reunited, moved sites, aged out) → is that a resolved check-out or a permanent "missing" alert nagging the coordinator forever?
3. Shared device / one volunteer checks in 40 kids at roll call → one fat-fingered batch marks a present child absent, or an absent child present.
4. A child who does NOT want to be found (fleeing an abusive "responsible adult") → does presence tracking expose them to the person they're escaping? The re-identification-of-someone-in-hiding harm the User persona always guards.
5. Two sites, one child moved between them → double-counted, or dropped in the gap.
6. The photo is of a child who is later determined to be at risk *from* the person who uploaded it.

## Questions for the Proposer

1. Why is the reference photo in scope at all for v1, given your own worst-case-breach description omits it? What breaks if we ship without it?
2. When the responsible adult of record IS the threat, does your design do anything but produce a reassuring log? If not, say so in the coordinator UI.
3. What is the expected false-alert rate per site per day, and at what rate do coordinators stop reading the alerts?
4. What is the written, enforceable rule that stops this becoming Option B after the first bad outcome?

## What Would Change My Mind?

- Reference photo dropped from v1 scope (or gated separately) → I stop calling Flaw 1 critical.
- A separation-of-duties rule so the claimed guardian is never the sole check-in author → I downgrade Flaw 2.
- A written Judge-level pre-commitment that Option B is a fresh gated decision → I downgrade Flaw 4.

...then I'd raise my confidence in Option A from "conditionally acceptable" to "worth building."

## Confidence Score
**0.8** — I'm 80% confident in this analysis.

Why not higher? I'm reasoning about field trafficking dynamics from documented patterns, not from HOS's specific deployment context (which doesn't exist yet). And I can't quantify the false-alert base rate without a pilot — the User persona's field read matters more than mine there.

## Final Note
The good idea here — notice a missing child faster — is real and worth having. But Option A as *written* stores a photo it doesn't need, trusts an adult it can't verify, and produces a signal that will be ignored within a week unless it's tuned. Ship the stripped-down version, tell the truth about what a check-in does and doesn't mean, and nail Option B's coffin shut in the verdict so grief doesn't reopen it.
