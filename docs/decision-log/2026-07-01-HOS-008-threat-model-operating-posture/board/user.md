# User Review: HOS-2026-008

## My Recommendation
🟡 RESHAPE

## User Scenario
I am **María**, 44, in Táchira. My son crossed toward the border three weeks ago and I have not heard from him. I have a cheap Android and mobile data I ration by the day. I am also afraid of something I can barely say out loud: that the *government* might use anything I type to find where he was last seen, or to notice that I am the one looking. A neighbor's nephew — a volunteer who helped people register — was picked up after using an app. So when I open HOS, I am doing two contradictory things at once: desperately trying to be found by the right people, and terrified of being found by the wrong ones.

There is a second me in this review: **Wilmer**, a volunteer who registers "found" people at a shelter. He has heard the Operación Tun Tun stories. He wants to help but does not want a permanent record that says *he* was the one who logged these families.

What I need in the next 10 minutes: to search for my son, or leave his information, *without* that same act exposing him — or me, or Wilmer — to the people we are hiding from.

## Does This Solve It?
- **Pain addressed:** PARTIAL.
- **Would I use it:** MAYBE — and here is the honest, uncomfortable part: **most of this decision is invisible to me.** Whether my son's medical notes are encrypted in a database, whether there's a retention TTL on an event log — I will never see those and they won't change what I do. They *should* exist (they protect Wilmer and me from a breach I'll never witness), but they are not what earns my trust in the moment.

  The **one thing in this decision I can actually feel** is the public search. Right now, today, anyone — including someone from the government — can type my son's name and his city into HOS and be told he exists in the system and whether he's been "found" (`apps/web/app/api/search/route.ts`, unauthenticated). That I understand instantly, and it is the thing that would stop me from entering his real name. If this posture decision closes or narrows that — so someone must already know his case number, not just his name, to confirm he's here — *that* is the change that would make me type his real information instead of a nickname.

## Friction Points
1. **The invisible controls don't reach me.** → Pair every backend control with the *one visible promise* a frightened user can act on: "Only someone who already has your case number can confirm this person is in the system." State it in plain Spanish on the search screen. Otherwise María coarsens her own data (fake name, no city) and the system loses the exact information it needs to reunite her son.
2. **Full lockdown (Option C) would break me.** If the safe version is Tor-only or heavy, my rationed data and old phone can't reach it. A posture that protects me by making the app unreachable has protected me out of using it. → Reachability must be offline-first and light, never Tor-first. The proposal gets this right; hold the line against Option C.
3. **Wilmer needs to know he isn't the permanent named record.** The event log currently ties `coordinator:<org>` and free-text notes to each family action forever (`familyReach.ts:96-104`). Wilmer won't log honestly if that's a permanent "Wilmer helped these families" ledger waiting to be seized. → The retention/minimization of that log isn't just abstract data hygiene — it's what keeps volunteers willing to act.

## Missing Piece
**The refugee-facing minimal view is named but not designed for the person who needs it.** The proposal says a beneficiary should see "status, nearby services, how to reach a center." Good — but two gaps:
1. There is no plan for **how María learns the site was blocked and where to go instead.** A "reachability plan" that lives in infrastructure is invisible to the person it's for. I need a concrete, human-usable fallback: "If this app stops working, send a WhatsApp to THIS number and we'll tell you the new address." Without that out-of-band step, the resilience plan protects the server, not me.
2. The minimal view must show **my** status without making me browsable to others. The same screen that reassures me ("your report is active, a coordinator is reviewing") must not be the screen that lets a stranger confirm my son exists. Those are the same feature pointed at two different people — design it as *my* view of *my* case (needs the identity/role work), not a public lookup.

## Confidence Score
**0.7** — Why not higher: I'm confident about what a frightened family and an at-risk volunteer feel, but I can't judge whether the invisible controls are technically sufficient — only that the *visible* one (the search oracle) is the trust lever, and the reachability fallback is the missing human-facing half.
