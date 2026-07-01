# Interim Analysis: HOS-2026-010-R1 (addendum, incl. role-scoping)

**NOTE ON PROVENANCE:** this is NOT one of the independent, blind board-persona
reviews this project's governance process calls for. A tooling outage
(Agent-spawning and WebSearch both unavailable) prevented running the real
Contrarian/Principals/Researcher agents for this round. This is the Executive
Orchestrator applying the same three lenses directly, as a stopgap, so the
principal isn't blocked. **This should be superseded by the real 3-agent
independent review once tooling recovers**, and this file should not be cited
as equivalent to `board/contrarian.md`, `board/principals.md`, or
`board/researcher.md` (the original, genuinely independent reviews) or to a
future `board/r1-contrarian.md` etc. if/when those are actually run.

---

## Contrarian lens

**Does "on-device only" eliminate the risk that drove the original KILL?** Mostly,
on the dimension that mattered most: an attacker who fully compromises HOS's
backend gets zero biometric data, because none was ever sent. That is a real,
structural difference from the killed design, not a cosmetic one. But three
residual risks remain, and none are addressed yet:

1. **Shared-device exposure.** The User persona's original review documented
   shelter volunteers sharing one device across a shift. If face embeddings for
   multiple people accumulate in that one device's local storage, a single
   seized shared phone now exposes several people's biometric data at once —
   smaller than a corpus-wide registry, but not the "one device, one person"
   model the design implicitly assumes. Needs an explicit answer: does the
   device cache get wiped/rotated per shift, or do multiple people's
   embeddings coexist indefinitely on a shared device?
2. **OS-level backup sync.** If browser local storage is swept into a phone's
   Google Account or iCloud backup, the "never leaves the device" guarantee
   silently breaks — the data now exists in a cloud account that could itself
   be compromised or compelled, entirely outside HOS's control or knowledge.
   This needs a real technical mitigation (there are partial browser
   mechanisms to exclude storage from backup, but reliability varies by
   browser/OS version), not just a design intention.
3. **Embedding invertibility — genuinely unverified.** "Just numbers, not a
   photo" is a real privacy improvement over storing raw images, but I was not
   able to confirm (WebSearch is down this round) how reversible or
   fingerprint-like modern face embeddings actually are if a copy ever did
   leak. Flag this as an open technical question to verify before treating
   "it's just an embedding" as a complete safety argument, not a settled fact.

**New risk introduced by role-scoping: a spoofing vector, but a low-stakes one.**
If "remote/translator, exempt from geofencing" is a self-declared, unverified
role, a field volunteer could claim it specifically to dodge the location
check. This is real, but its blast radius is small IF (and only if) role-based
exemption is paired with **action-based scoping**: a "remote" role account
should be technically unable to submit a found-person/location-bearing report
in the first place, not merely exempted from a check on a report type it
shouldn't be filing anyway. If that pairing isn't built, the gaming vector is
wide open. Also, since geolocation was already advisory-only (never blocking),
successfully gaming it only removes a soft trust signal — it doesn't grant
access to anything a coordinator wasn't already free to distrust.

**Edge case:** a volunteer who is sometimes remote, sometimes in the field (a
bilingual helper who mostly translates but occasionally travels) doesn't fit a
single fixed account-level role well. Argues for scoping the check to the
*submission/action*, not a persistent account attribute — see Principals below.

**Confidence: 0.6** — lower than my other rounds this session, specifically
because two of the three residual risks (embedding invertibility, real-world
precedent for role-based trust models) need live research I couldn't do this
round.

## Principals lens

- **Data minimization: ALIGNED, and meaningfully stronger than the original
  server-side design** — this is close to genuine zero server-side biometric
  collection, not just reduced retention.
- **Trust & honesty: CONDITIONAL.** "Never transmitted" must be an *enforced,
  testable* invariant (a network-request audit, not a comment) — this is the
  same lesson the original review drew from this project's own D4 precedent
  (claiming a delivery that never happened). Separately: if a "remote role"
  report skips the location check, the UI must show that plainly ("no location
  claim — remote submission") rather than let it look equivalent to a report
  that passed a check. Silence here would repeat the same class of honesty gap.
- **Simplest solution — Occam's razor suggests a real simplification:** scope
  the geolocation check to the *action*, not the *account role*. Ask "does
  this specific submission assert a physical location?" rather than "is this
  account's role exempt?" A translation edit or a text-only contribution
  simply has no location field to check — nothing to exempt, because there
  was never a claim to verify. This sidesteps the entire "how do we verify a
  self-declared role" problem, because there's no role-trust question to
  answer at all; it also cleanly handles the sometimes-remote-sometimes-field
  volunteer edge case above, since the check follows the submission, not a
  fixed identity attribute.
- **Technical debt:** the account/role model doesn't exist yet (rides on
  HOS-2026-001-08, still in progress) — same dependency the original review
  already flagged for D2, not a new cost, but worth restating since role-
  scoping adds one more feature waiting on that same foundation.

**Confidence: 0.75**

## Researcher lens (hedged — no live search available this round)

From general knowledge, not fresh verification: crowdsourced crisis-response
efforts commonly do distinguish remote/digital contributors from field
contributors — the Digital Humanitarian Network / Standby Task Force pattern,
often paired with Ushahidi-style deployments, is built around remote
"micro-tasking" volunteers who are never expected to be physically anywhere in
particular. If accurate, this would directly support the principal's instinct
that remote-role exemption is realistic, not a corner case invented for this
conversation. **I could not confirm this with a live search this round and
would want to before treating it as settled** — recommend re-checking when
tooling recovers, alongside the embedding-invertibility question above.

**Confidence: 0.4** — deliberately low; this section is recalled knowledge,
not tested evidence, and should not be weighted as heavily as a normal
Researcher review until verified.

## Overall (interim)

**RESHAPE, proceed with conditions** — same direction as the original board,
not a reversal. Conditions to add on top of the ones already recorded:

1. Scope the geolocation check to the *submission/action* (does this specific
   report assert a location?), not to a persistent account-level "role" —
   simpler, and avoids needing to verify self-declared roles at all.
2. If role-based exemption is used anyway, pair it with action-scoping (a
   remote-role account cannot submit a location-bearing field report in the
   first place) so a false role claim has nothing to gain.
3. Define and test what happens to cached face embeddings on a shared device
   across a shift change, before shipping.
4. Confirm (technically, not just in policy) that local-storage data is
   excluded from OS-level cloud backup, or explicitly accept and document the
   residual exposure if it can't be fully prevented.
5. Verify face-embedding invertibility risk and the remote/field volunteer
   trust-model precedent with live research once tooling recovers — both are
   currently unverified assumptions in this interim analysis, not confirmed
   facts.
