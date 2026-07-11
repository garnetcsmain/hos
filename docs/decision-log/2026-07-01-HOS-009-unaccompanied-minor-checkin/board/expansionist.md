# Expansionist Review: HOS-2026-009

## My Recommendation
🟡 RESHAPE FOR MORE UPSIDE — but with an unusual-for-me caveat: the biggest strategic move here is *restraint as a moat*. The upside is real (a child-safeguarding capability that agencies can trust precisely because it collects almost nothing), and I'll name the one middle technical step worth reserving for a later gate. But I explicitly do NOT want my upside used to argue toward Option B — the compounding advantage here is trust, and Option B burns it.

## Biggest Upside

**A safeguarding-by-minimization standard that partner agencies adopt because it's the one child dataset they can hold without becoming a liability.** — Scale: every shelter/agency in the response and, by reputation, the next response. Timeline: 12–24 months, gated behind trust being earned first.

The prize is not "HOS tracks kids." The prize is that HOS becomes the reference implementation of *how you notice a missing child fast without building the database that gets children trafficked.* Every serious child-protection actor (see Researcher: CPIMS+/Primero, the Rohingya cautionary case) is haunted by the same fear — that their protection data becomes targeting data. A design that demonstrably *cannot* become that (non-enumerable, no biometrics, no location trail, minimal record, coordinator-only) is not a smaller feature — it's a **more adoptable** one. Restraint is the differentiator.

## Domino Effects

1. **Unlocks:** a trusted, minimal per-child presence primitive → **Enables:** clean interoperability with the sector's actual case-management backbone (Primero/CPIMS+) via a referral pointer, not a data merge. HOS notices the absence; the established system holds the case. HOS becomes the fast-detection front-end to the sector's system of record, without duplicating or competing with it.
2. **Unlocks:** a proven "detect-an-absence, alert-a-human, escalate-only-by-human-decision" pattern → **Enables:** the same event-sourced absence primitive to serve *other* accountability needs already in the tree — a site steward who stops updating (HOS-2026-014 freshness), a supply point that goes dark, a volunteer who doesn't check in on a field task (HOS-2026-012). The "expected signal didn't arrive → soft alert" mechanism is a reusable spine, not a one-off.
3. **Unlocks:** a credible, minimization-first child-safeguarding story → **Enables:** the partnership legibility the HOS-2026-015 board just valued (the "passport"). "We handle the most sensitive population by collecting the least" is exactly what an ICRC/UNICEF-aligned partner needs to hear to onboard onto a shared instance.

## Moat Opportunity

**Trust as the durable, compounding advantage.** In this domain the moat is not features or network effects — it's being the actor whose child data cannot be turned against children. That reputation compounds: the first agency that trusts HOS with UASC detection because the design is provably minimal becomes the reference that convinces the next. It is hard to displace because a competitor who adds biometrics/location to "win on features" *loses* the exact trust that mattered. The restraint is the moat. (This is the same shape as HOS's honesty principle being a product advantage, not a constraint.)

## Adjacent Opportunities

- **The reusable "expected-signal-absent" alert primitive** (domino #2) is genuinely platform-level — build HOS-2026-009's absence rule as a general capability and three other epics inherit it.
- **Referral-pointer interoperability** with Primero/CPIMS+ positions HOS as complementary infrastructure to the sector standard rather than a competitor — the fastest path to adoption is being the thing that makes the incumbent better.

## The one middle technical step worth naming (answering the proposal's Expansionist question)

**A scanned QR wristband / card as the check-in mechanism** — non-biometric, sitting between Option A's fully manual entry and Option B's biometric ID.

- *Why it's worth reserving:* it directly attacks the User persona's fatal friction (per-child manual entry under load). A volunteer scans a code instead of finding-and-tapping each child; roll-call goes from N taps to N quick scans, offline. The QR encodes only the system-generated non-biometric ID — no PII on the band itself — so a dropped wristband reveals nothing.
- *Why it is NOT a v1 item and gets its own gate:* (1) a wristband on a child is a physical marker that can *itself* signal "this is an unaccompanied minor" to an observer — a real safeguarding concern that needs child-protection review; (2) it introduces a physical-supply dependency (printing/bands) HOS doesn't have; (3) it must be validated against real UASC precedent, which the Researcher flags as thin. So: **name it as a candidate for a later gate, do not build it now, and require child-protection sign-off before it's reconsidered.** It is the honest "middle step," not a smuggling route toward more collection.

## Resource Bottleneck

**Secure the interoperability posture now, while the design is fresh:** decide that HOS-2026-009's record is a *referral pointer* to the sector case-management system (Primero/CPIMS+), not a parallel system of record. If HOS instead quietly grows its own full child case file, it (a) becomes the enumerable registry everyone fears and (b) forecloses the partnership upside by competing with the incumbent. The cheap move today is to define the boundary: **HOS detects and points; it does not hold the case.** Reserve that line before feature pressure erases it.

## Confidence Score
**0.6** — why not higher: my entire upside is gated behind trust that has to be *earned in the field first*, and behind human/legal/child-protection sign-off the proposal rightly requires — so the timeline is soft and contingent. The interoperability-with-Primero domino assumes a partnership pipeline HOS doesn't yet have (the same unknown the Researcher and the HOS-2026-015 D5 reshape both flagged). And I'm the wrong persona to weigh the safeguarding downside of even a QR band — I'm deferring hard to Contrarian and a child-protection specialist on whether the middle step is safe at all.

## What I Don't Know
- Whether any real agency partnership is close enough to make the interoperability upside near-term or purely aspirational.
- Whether a QR wristband has ever been safely used for UASC, or whether the "visible marker of vulnerability" objection kills it outright (Researcher found no strong precedent).
- Whether the reusable-absence-primitive (domino #2) is worth generalizing now or is premature abstraction — Principals should check I'm not inventing a platform where a feature will do.
