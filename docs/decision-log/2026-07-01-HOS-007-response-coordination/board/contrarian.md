# Contrarian Review: HOS-2026-007

## My Recommendation
🟠 RESHAPE

## Fatal Flaws Found

### Flaw 1: Starting Phase 1 while Phase 0 is unshipped is how the mission dies
**Severity:** 🔴 CRITICAL

**What breaks:** The reunification MVP is ~64% and has open Board conditions still gated on humans (calibration, DPA, external channels). Opening a second epic splits the only build capacity there is. The classic failure of crisis-tech is a broad, half-finished platform that reunites no one.

**Why it's real:** AGENTS.md §7 says it outright — success is families reunited, not feature count. Every comparable that sprawled early (see Researcher) shipped a wide, shallow tool nobody trusted.

**Impact:** The one thing HOS was built to do slips; coordination arrives half-built too.

**Could we fix it?** YES — hard-gate the slice so it cannot reprioritize Phase 0, and keep it small enough to pause anytime. Option B, not A.

### Flaw 2: A needs/site board is a targeting map
**Severity:** 🔴 CRITICAL

**What breaks:** "Shelter with 40 beds and 12 unaccompanied minors, low water" published to anyone is precisely the intelligence an armed group, trafficker, or looter wants. In Venezuela-2026 that is not hypothetical.

**Why it's real:** D3 already flagged public name+city search as re-identification risk. A live map of where vulnerable people and scarce aid are concentrated is worse.

**Impact:** The system endangers the people it coordinates for.

**Could we fix it?** YES — coordinator-authenticated only, coarse district (never precise site) in any wider view, no public endpoint. This must be a condition, not a nicety.

### Flaw 3: "Fulfilled" will lie exactly like "sent" did
**Severity:** 🟠 HIGH

**What breaks:** A supply marked "delivered" that never arrived sends a shelter to plan around water that isn't coming. This is the D4 false-delivery harm, one layer up.

**Why it's real:** We just spent a whole PR fixing this at the notification layer. The same mistake is trivially easy to repeat in a supplies board.

**Could we fix it?** YES — status transitions (open → claimed → fulfilled) require a recorded human confirmation with an actor; never auto.

### Flaw 4: Bigger write surface, still one shared token
**Severity:** 🟠 HIGH

**What breaks:** Coordination multiplies who writes (many shelters, many orgs) while auth is still one shared coordinator token with self-declared org. Attribution is theater at exactly the moment multi-org accountability starts to matter.

**Could we fix it?** PARTIAL now — seed real org/actor entities (D2/D3 already asked for this) and keep the surface coordinator-gated until HOS-2026-001-08 lands. Do NOT add volunteer dispatch under the shared token.

## Assumptions We're Betting On

| Assumption | Confidence | Risk If Wrong |
|-----------|-----------|---|
| A thin slice won't slow Phase 0 | 45% | Both epics stall; mission slips |
| Coordination data is "less sensitive" than PII | 35% | Site+needs board becomes a targeting tool |
| Shelters/orgs will keep capacity current | 40% | Stale board is worse than no board (false confidence) |

## Edge Cases We Haven't Addressed
1. Stale capacity → responder drives to a full shelter. Needs a freshness/expiry signal.
2. Duplicate needs (same need posted 20 times) → board noise; needs dedup/merge.
3. Two orgs claim the same need → double-effort or nobody follows through.

## Questions for the Proposer
1. What prevents this from reprioritizing the Phase 0 finish line — concretely?
2. Who sees the needs board, and at what location granularity?
3. How does a need get marked fulfilled, and who is accountable if it wasn't?

## What Would Change My Mind?
A slice that is (a) coordinator-only, (b) coarse-location, (c) human-confirmed state only, (d) provably pausable without touching the matcher. Then my confidence rises from 0.6 to 0.85.

## Confidence Score
**0.8** — high on the risks; the residual is whether even a thin slice is worth the focus cost now.

## Final Note
Coordination is real and promised — but the fastest way to never deliver it is to start it wide before the mission ships. Thin, gated, coordinator-only, honest-state, or not yet.
