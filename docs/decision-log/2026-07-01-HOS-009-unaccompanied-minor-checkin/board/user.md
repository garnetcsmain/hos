# User Review: HOS-2026-009

## My Recommendation
🟡 RESHAPE — I represent the volunteer and the coordinator who would actually run this, and the honest answer is: they will not reliably do manual check-ins during a real shift as designed, and the child at highest risk is the one they'll silently drop. Reshape toward near-zero friction and honest wording, or it dies in the field the way the WhatsApp fallback did in HOS-2026-007.

## User Scenario

**I am Yolanda, a volunteer on the night shift at a shelter in the Caracas–La Guaira corridor.** Cheap shared Android, patchy data, one charger for the room. It's 9pm curfew count. There are 60+ people in my area, maybe 8 of them unaccompanied kids, and three of them I've never seen before because they arrived this afternoon. A mother is crying at the door because she can't find her son. Someone needs the bathroom key. My shift partner just left and wasn't replaced.

**What I need in the next 10 minutes:** to know every kid who's supposed to be here is here, and to raise my hand fast if one isn't — without taking my eyes off the room to tap through a form 8 times.

**And I am Carla, the area coordinator.** I'm accountable if a child goes missing on my watch. I have a phone full of alerts already. I need the one alert that means "go look now" to not be buried under forty that mean "Yolanda got busy."

## Does This Solve It?

- **Pain addressed:** PARTIAL. The *intent* — notice a missing kid faster — is exactly what Yolanda and Carla need. The *mechanism* — a human remembering to record a check-in event per child at defined moments during the worst part of the shift — is the part that breaks on contact with the shift.
- **Ease of use:** LOW as described. "Recorded by a named responsible adult at defined moments" is a data model, not a workflow. If checking in a child is more than **one tap per child, offline, on a shared phone**, Yolanda will do it for the calm kids and skip the chaotic moment — which is precisely when a kid actually slips out.
- **Would I use it:** MAYBE (Yolanda), YES-if-quiet (Carla). Yolanda uses it only if it's faster than a paper roll-call clipboard, which is a genuinely high bar — the clipboard works with no battery, no login, and no data. Carla uses it only if the alert precision is high enough that she doesn't learn to swipe them all away.

## Friction Points

1. **Per-child, per-moment manual entry during the busiest moment → skipped exactly when it matters.** What would work: a **single roll-call screen** — the list of my assigned kids, big tap-targets, tap each present one (or tap the *absent* one, whichever is fewer taps), one "done" that timestamps the whole batch. Offline-first, syncs later. One interaction for the whole count, not N.

2. **The alert that cries wolf.** If Carla gets an alert every time a volunteer is 10 minutes late on a count, she stops reading them by night two. What would work: alert only on **consecutive** missed windows, with a one-tap "seen it, kid's here" so Yolanda can clear a false alarm from her phone before it ever reaches Carla, and so Carla's alerts are pre-filtered to the ones a volunteer *couldn't* clear.

3. **Login/identity friction on a shared device.** If check-in requires Yolanda to be logged in as herself on a phone three people share, she won't — she'll use whoever's session is open, and the attribution the whole system depends on becomes fiction. What would work: a fast per-person unlock at handoff (this is the shared-device identity-switch requirement HOS-2026-010-R2 already named) — but if that's not built yet, be **honest that attribution is shelter-level, not person-level**, and don't render it as if a specific named adult vouched.

4. **A present check-in reads as "safe" to a scared coordinator.** If Carla sees a green "checked in" next to a kid, under stress she reads *safe*. It doesn't mean safe — it means someone tapped a button. What would work: the honest HOS-2026-007 wording, applied hard — "**visto a las 21:04**" (seen at 9:04), never "seguro" (safe). And a missed check-in must say "**revisar**" (needs a look), never "desaparecido" (missing), so nobody screams "missing child" at a kid who's asleep in the wrong cot.

5. **The self-check-in for a phone-capable minor is the wrong user.** A frightened 14-year-old on a dying phone with no data is not going to open an app and confirm a district boundary. This is over-designed for my reality. Cut it from v1; the volunteer roll-call is the real mechanism.

## Missing Piece

- **A check-OUT / resolution path.** Kids leave for good reasons constantly — reunited with a parent, moved to another shelter, aged out. If the only states are "checked in" and "missed," then every kid who legitimately leaves becomes a permanent nagging alert, and Yolanda learns to ignore alerts *because most of them are just kids who left properly*. There must be a one-tap "left — reunited / transferred / other" that closes the record honestly. This is missing from the proposal and it's the thing that will actually determine whether the alert stays trustworthy.

- **The kid who is hiding from their "responsible adult."** Some unaccompanied minors are unaccompanied because they *ran from* an abusive adult. A presence system that lets that adult (or someone asking on their behalf) learn the child is at Site X re-exposes them. Yolanda needs to be able to flag a child as protected-location without that being a special visible badge that itself signals "this kid is hiding." The proposal's coordinator-only rule helps but doesn't address the intake question of *who is allowed to ask "is this child here."*

- **What Yolanda does when the alert fires and the kid really is gone.** The proposal stops at "soft alert to the coordinator." Carla needs the very next step to exist — not an automated police call (rightly out of scope), but a written "here's what you do now" so the alert leads somewhere. Without it the feature notices a missing child and then... nothing. The onboarding doc (docs/onboarding/coordinador.md already has a protection section) should carry this.

## Confidence Score
**0.8** — why not higher: I'm confident about the friction (this is the same manual-entry-under-load failure the HOS-2026-007 User review already caught with the WhatsApp fallback, and it's the most reliable prediction I can make). Less confident about the exact tap-count threshold where volunteers give up — that needs a real pilot with real volunteers, not my simulation of one. And I can't speak for an actual displaced child's experience of being tracked; a child-protection worker should pressure-test the "kid hiding from their guardian" case harder than I can.
