# Contrarian Review: HOS-2026-014

## My Recommendation
🟠 RESHAPE — with two sub-decisions I'd hard-condition and one interim slice I would not ship as written.

- **D3 accountability loop** (attributed updates + per-category rhythm + honest freshness badge + "sitios vencidos" triage list) → 🟢 PROCEED for the *freshness-signalling* parts. The triage list and the honest decaying badge are the genuinely good, honest idea in this proposal. Keep them.
- **D4 steward safety** → 🟠 RESHAPE. "Coordinator-visible only" names the right control but misses two leak surfaces (the audit trail and the confirmation *cadence*), and the companion HOS-2026-013 opens a third ("Ver como"). See Flaw 4.
- **D2 claim flow / remote path** → 🟠 RESHAPE. The out-of-band verification collapses to rubber-stamp under exactly the load the proposal is built to relieve, and it verifies the *phone*, not the *claimant* (Flaw 1). The remote path is also in structural tension with the honesty constraint the proposal itself set (Flaw 3).
- **D3 automatic lapse** → 🟠 RESHAPE. Lapse-then-reclaim is a mechanism an adversary can farm, and it punishes the offline field steward the system exists to serve (Flaw 5).
- **D5 interim honor-system slice** → 🔴 do not ship as written. Shipping the *reassurance* of stewardship (a named "responsable," "confirmado hace 2h") without the *substance* (verified accountable identity) manufactures confidence exactly where the state adversary makes it most dangerous (Flaw 2). The interim can ship the honest triage list; it must not ship a named responsible party rendered as if verified.

## Fatal Flaws Found

### Flaw 1: The fake-remote-steward attack — walked end to end — is stopped only by a step that verifies the phone, not the person, and that collapses to rubber-stamp under load
**Severity:** 🔴 CRITICAL

**What breaks:** Walk it as the proposal specifies (D2):

1. **Self-request.** Adversary opens the site card for a real, operating shelter and taps "Ser responsable de este sitio." No physical presence required — remote is first-class by design.
2. **Out-of-band verification.** The coordinator verifies affiliation by "calling the site's publicly listed phone (many imported sites carry one)." Here is the seam: **that phone number is in the imported public dataset.** The adversary knew, before requesting, exactly which number the coordinator would call. The verification therefore establishes only that *someone who answers that public number* will vouch — it does **not** bind the *remote claimant* to the site. The adversary is one of: (a) the person who answers a general org line and rubber-stamps a helpful-sounding request, (b) an accomplice positioned on or near that number, or (c) a caller who never needs to be verified at all because the coordinator, under a queue of 150 sites, accepts "the org vouches" or "an existing steward confirms" — both of which are further honor-system assertions the adversary can also supply.
3. **Grant.** Coordinator issues the `site:<id>` capability bundle (update capacity/status/hours/notes). The adversary is now the site of record's steward.
4. **Poisoned updates.** Two payloads:
   - **Mark a real, operating shelter "cerrado"** → families are diverted *away* from real aid. Denial of aid, at scale, invisibly.
   - **Mark a site "operativo" with capacity** → honeypot. Displaced people are funnelled to one address the adversary designates. Under Operación Tun Tun logic (HOS-2026-012, a named fatal precedent in this population), a "refugio" that concentrates vulnerable people at a known address is a targeting funnel, not a data error.

**Why it's real — which step actually stops it?** The proposal's stated defense is "no auto-grant + out-of-band verification + coordinator approval + full audit + instant revocation." Of those, **only out-of-band verification is preventive** — audit and revocation are *post-hoc*, and by then the poison has already been served to families. And the preventive step has a dilemma with no good setting:
- If verification is made **rigorous** (independently confirm the *claimant's* identity and their real tie to the site, not just reach the public number), it is expensive manual work per claim — and the entire pain this proposal exists to relieve is "150 anonymous stale cards" and "coordinators must re-verify everything themselves, which does not scale." A coordinator drowning in that wall is *motivated to grant*, because every grant retires a stale card. The incentive gradient points at approval.
- If verification is made **cheap** (one call to the public number), it is weak for the reason above and becomes ritual: it *feels* diligent, raises the coordinator's confidence, and provides little actual assurance. Security theater — confidence up, security flat.

There is no configuration in which the step is both *done under load* and *effective*. That is the definition of a control that collapses to rubber-stamp.

**Impact:** The one novel privilege this proposal creates — remote write authority over a site's operating status — is gated by a check the adversary can pass by design, and the honesty layer then *certifies the poison*: the board shows "confirmado por el responsable del sitio hace 2 h" and the freshness badge glows green over a lie. The system's trust signals actively vouch for the attack.

**Could we fix it?** PARTIALLY, and not by hardening the phone call:
- The out-of-band check must verify a **claimant-controlled** factor, not a **publicly-known** one. Calling the public number proves nothing about the caller in the queue. A defensible remote verification needs a challenge the real site controls and the adversary does not — e.g. the coordinator initiates the callout *to* the public number and delivers a one-time code that the claimant must then return (proving the claimant is the person who answered), or an existing *verified* steward co-signs (not merely "confirms"). "The org vouches" and "someone answers" are not that.
- **Status-*downgrade* writes (marking a real site closed) and honeypot-*upgrade* writes (marking a site newly operative) are the two high-harm actions.** These should not be a fresh remote steward's unilateral, immediately-published capability. A new/unverified-tier steward's "cerrado"/"operativo" should require a second confirmation (another steward or a coordinator) before it changes what families are routed toward — the separation-of-duties pattern the board reached for in HOS-2026-009.
- None of this is fixable in the interim honor-system slice, which has no verified identity to bind any of it to (Flaw 2).

### Flaw 2: The interim ships the reassurance of stewardship without the substance — a named "responsable" nobody has actually verified
**Severity:** 🔴 CRITICAL (for D5 as written)

**What breaks:** D5 proposes an interim slice *now*, behind the shared coordinator gate: steward as a named field on the site, attributed liveness actions, rhythm/lapse logic, triage view — "under the shared-token honesty caveat." The problem is what the interim *renders* versus what it *is*.

**Why it's real:** Under interim auth there is no real auth (HOS-2026-001-08 not landed) and no identity substrate (HOS-2026-010-D2 awaiting sign-off). So "attributed" means attributed *to the shared coordinator token* — a label anyone holding that token can write. But the entire value proposition the proposal sells to coordinators is "data is fresh because **someone specific is on the hook**." Under honor-system attribution, **no one is on the hook**: "Responsable: Juan" and "Juan confirmó hace 2 h" are strings, not accountable acts by a verified human. The interim thus produces the *appearance* of accountable ownership — a name, a rhythm, a fresh confirmation — over an *absence* of verified accountability. A coordinator reading "Responsable: Juan, confirmó hace 2h" will trust that site **more** than an honestly-anonymous stale card, and that increment of trust is unearned.

This is precisely the HOS-2026-009 pattern the board already flagged: a tidy attributed log that manufactures confidence exactly where vigilance is warranted. The MET_WITH_WATCH UI caveat the 007 re-review recorded is a *sentence*; it will not out-shout a green "confirmado por el responsable" badge sitting next to the site name. Honesty here is not "add a caveat to a reassuring signal"; it is "don't render a reassuring signal you can't back."

**Impact:** The interim's stated goal is to "start the stewardship culture" and "change coordinator behavior." It will — toward *trusting named-but-unverified sites more*, which is the exact behavior the enforced version's verification is supposed to earn. That is the "teaches habits the enforced version will break" risk the proposal itself raises in D5, and my answer to its open question is: **yes, this interim teaches the wrong habit**, because the wrong habit is "a name means accountability" and the interim can't make that true.

**Could we fix it?** YES, by shipping the honest half and withholding the dishonest half:
- **Ship now:** the "sitios vencidos" triage list, the honest decaying freshness badge, attributed *actions* in the audit (for later forensics). These raise the *right* signal — "this is stale, work it" — without over-claiming.
- **Withhold until verified identity exists:** rendering a *named responsible party* on the site as though it denotes accountability, and any public/coordinator "confirmado por el responsable" phrasing. Until 010/011 land, the honest interim label is "confirmado (identidad no verificada)" or simply the timestamp — not a responsible-person attribution.
- In short: the interim may ship *staleness honesty*; it may not ship *ownership reassurance*.

### Flaw 3: The remote path structurally produces confirmations-without-knowledge — which the proposal's own honesty constraint says is worse than a stale badge
**Severity:** 🟠 HIGH

**What breaks:** Constraint (3) states it plainly: "a steward pressing 'confirmar' without knowing is worse than a stale badge." But the headline feature — the first-class *remote* steward — is **by definition not physically present**. A diaspora steward abroad confirming "operativo / 40 camas disponibles" is not observing the site; they are relaying a WhatsApp message or a phone call from someone who claims to be there. The remote path therefore *structurally* manufactures the exact thing constraint (3) forbids: a confirmation asserted without direct knowledge, then rendered as "confirmado por el responsable hace 2 h."

**Why it's real:** The proposal treats field vs. remote as differing "only in verification path." That is false: they also differ in *epistemic access*. The field steward can see the beds; the remote steward can only relay a claim about the beds. Coarsening that difference to "same mechanism, two verification paths" hides that the remote confirmation is a second-hand assertion wearing a first-hand badge. Under HOS-2026-007's "stale must read as stale," a relayed confirmation should not read identically to an observed one.

**Impact:** The freshness signal — the one honest thing this proposal reliably delivers — is diluted at its source by the remote path, and diluted invisibly. A coordinator (or the 013 public board) can't tell "someone stood in the shelter and counted 40 beds" from "someone abroad was told 40 over WhatsApp."

**Could we fix it?** YES: the remote path must confirm **provenance, not presence** — a remote steward's update should assert "reportado al responsable" / "confirmado remotamente," visibly distinct from an on-site confirmation, so the honesty layer never renders a relay as an observation. This costs a badge variant and some copy; it preserves the single most valuable honest signal in the system.

### Flaw 4: Steward names (and worse, steward *patterns-of-life*) leak through surfaces D4 doesn't cover
**Severity:** 🟠 HIGH

**What breaks:** D4's control is "identity coordinator-visible only; public/volunteer surfaces show role-grain at most; lists never bulk-exportable." Correct as far as it names three surfaces. It misses others, and one of them leaks a targeting signal *even with the name perfectly suppressed*.

**Why it's real:**
1. **The audit trail.** D3 says every steward update is "attributed" and "the append-only audit already exists." Attribution is by *name*. Who can read that audit? The product has a contributor self-signup tier *below* coordinator. If per-site history / audit is visible to contributors (or to anyone below coordinator), attributed updates leak the steward's name to a non-coordinator surface — defeating D4 through the back door of the accountability mechanism D3 is proud of. The proposal never states who the audit is readable by.
2. **avisos / broadcasts.** The site-broadcast feature exists. If a steward posts an "aviso" and it carries their handle ("Aviso de Juan"), that is a public authorship leak D4 doesn't address. Aviso authorship grain is unspecified.
3. **HOS-2026-013 "Ver como."** The companion proposal's audience switcher renders the coordinator payload filtered down. If the steward name is in the coordinator payload and "Ver como" is a *client-side* filter (see my 013 Flaw 3), the name is already in the browser during any preview. Even server-side, this is one more surface that must be explicitly proven to strip steward identity.
4. **The cadence leak that survives perfect name suppression.** This is the one that matters most. Public surfaces are permitted to show "confirmado por el responsable del sitio hace 2 h." For a site with *one* steward, "the responsible person" is a single identifiable role, and the **confirmation cadence is a pattern-of-life on that person.** "Confirmado hace 2h" appearing every day around 08:00 tells a watcher that the site's keeper is at or near that address every morning at 8. No name is needed to target a role whose presence rhythm is published. This is the same cadence-oracle problem I raise in the 013 review, pointed at a single human the board already agreed is a targetable role (Tun Tun).

**Impact:** D4 is written as a *name*-suppression control, but the targetable asset is the *person's routine*, and the freshness feature publishes the routine by design. Suppressing the name while publishing "confirmed by the keeper 2h ago, daily at 8" is not the protection D4 believes it is.

**Could we fix it?** YES:
- State explicitly that the **audit trail is coordinator-only**, that **aviso authorship is role-grain** (never a steward handle), and that any 013 "Ver como" path is tested to strip steward identity.
- **Coarsen or suppress public confirmation timing.** Public surfaces should say "confirmado en las últimas 24 h" or a staleness *band*, not a precise "hace 2 h," so the confirmation cadence can't be assembled into a presence schedule. This directly couples to the 013 feed's timing-coarsening requirement — solve it once, for both.

### Flaw 5: Automatic lapse creates a claim/re-claim surface an adversary can farm, and it punishes the offline field steward the system exists to serve
**Severity:** 🟠 HIGH

**What breaks:** D3: sustained neglect (3 missed windows / 7 days silent) → stewardship **lapses automatically**, the site shows "sin responsable" and becomes **claimable again**. Two failure modes.

**Why it's real:**
1. **"Sin responsable" is a published list of ripe targets.** Lapse advertises exactly which sites are currently unowned and open to claim. An adversary watching the board doesn't need to attack a defended site; they wait for (or induce) a lapse and claim the freshly-open one through the rubber-stampable remote path (Flaw 1). Worse, the adversary can *farm* it: claim → go silent → lapse → re-claim, each cycle a fresh (weak) verification and a fresh poison window, at near-zero cost if verification is cheap. The lapse mechanism turns a defended site into a periodically-undefended one on a predictable schedule.
2. **Lapse punishes the connectivity-poor, i.e. the intended user.** The proposal's design environment is "a family member on a cheap Android with patchy data" and "low connectivity." A genuine *field* steward — the shelter volunteer physically present in Cagua on 3G — is precisely the person most likely to go 7 days without a successful sync, *not* because they neglected the site but because they had no signal. Auto-lapse reads offline-ness as neglect and frees their site. The better-connected claimant who then scoops it is disproportionately the *remote* actor — diaspora or adversary — with reliable connectivity. The lapse rule systematically transfers site control **from the present-but-offline field steward to the absent-but-online remote one.** That is backwards from where trust should concentrate under an adversarial-state posture.

**Impact:** A mechanism meant to fight silent staleness instead (a) publishes a target list, (b) creates a farmable poison-window cycle, and (c) biases ownership toward the well-connected remote actor and away from the on-the-ground field steward — the opposite of the proposal's own stated preference for people who "genuinely know" the site.

**Could we fix it?** YES:
- Lapse should degrade the *badge* (honest: "responsable inactivo / sin confirmar +7d") **before** it releases the *grant*. Show staleness honestly without immediately throwing the site open. Full release to "claimable" should require a coordinator action, not a silent timer — a human decides, per the standing principle.
- Distinguish "offline" from "neglectful" where possible (a queued-but-unsynced confirmation is not neglect). Don't let a signal outage cost a present steward their site.
- Rate-limit re-claims on the same site by the same actor, and surface claim/lapse churn to coordinators as a *suspicion* signal, not a routine event.

## Assumptions We're Betting On

| Assumption | Confidence | Risk If Wrong |
|-----------|-----------|---|
| "Calling the publicly-listed phone verifies the remote claimant" | 20% | It verifies the phone, not the person; the adversary knew the number in advance and can answer, accomplice, or supply an equally-honor-system 'vouch' |
| "Coordinators will actually do the out-of-band check under a 150-site queue" | 30% | Incentive points at granting (each grant retires a stale card); check collapses to rubber-stamp |
| "Interim honor-system attribution reads as unverified" | 30% | A green 'confirmado por el responsable' badge out-shouts the caveat sentence; coordinators trust named-but-unverified sites more |
| "Remote confirmation is as good as field confirmation" | 25% | Remote = second-hand relay rendered as first-hand observation — the exact thing constraint (3) forbids |
| "Name suppression protects the steward" | 40% | Published confirmation cadence ('confirmado hace 2h', daily) is a pattern-of-life that targets the role without needing the name |
| "Auto-lapse fights staleness safely" | 35% | Publishes a ripe-target list, enables a farmable poison-window cycle, and hands offline field stewards' sites to better-connected remote actors |

## Edge Cases We Haven't Addressed

1. **The public phone is a shared org line** → whoever answers rubber-stamps any plausible-sounding claim; verification passes with zero binding to the claimant.
2. **Adversary induces a lapse** (e.g. a real steward is briefly offline) then claims the "sin responsable" site within the gap → farmed poison window on a predictable schedule.
3. **Two legitimate shift stewards + one adversary** → multiple-stewards-per-site means one poisoned "cerrado" from the adversary competes with two honest "operativo"s; whose write wins, and does the board show the conflict or just the latest?
4. **The relay chain** → remote steward confirms based on a WhatsApp from a person at the site who is themselves mistaken or coerced; "confirmado por el responsable" now certifies a two-hop unverified claim.
5. **Offline field steward on 3G** → lapses from signal outage, not neglect; site handed to a better-connected remote claimant.
6. **Steward name in the audit + contributor tier can read site history** → D4 defeated through the accountability log D3 relies on.
7. **A steward declines public credit (D4 says this must cost nothing)** → but if declining is a per-steward flag, the *set of decliners* is itself a coordinator-visible list of people who fear exposure; make sure that flag isn't its own signal.
8. **Honeypot upgrade** → adversary marks a *nonexistent or adversary-controlled* address "operativo, con capacidad"; families are routed to it. Does anything require a second party to confirm a site newly going operative?

## Questions for the Proposer

1. Precisely which step in the fake-remote-steward chain stops the attack, and how does calling a *publicly-listed* number bind the *claimant* (not merely the number) to the site? If it can't, what's the claimant-controlled factor?
2. Under a 150-site stale queue, what stops the out-of-band check from collapsing to rubber-stamp, given the coordinator's incentive is to grant and clear the wall?
3. In the interim slice, what does a coordinator actually see next to a site — and will "Responsable: Juan, confirmó hace 2h" read as *verified* or as *honor-system*? Show me the exact copy, because a caveat sentence loses to a green badge.
4. Is the append-only steward audit readable by anyone below coordinator (contributor tier)? Is aviso authorship role-grain or handle-grain? Does HOS-2026-013 "Ver como" strip steward identity, and is that tested?
5. Does a public "confirmado hace 2h" for a single-steward site publish that steward's presence cadence? Why is precise confirmation timing public at all, versus a staleness band?
6. When stewardship lapses, does the site immediately become claimable by a silent timer, or does a human release it? How do you tell "offline" from "neglectful," and what stops claim/lapse/re-claim farming?
7. Does a *new* steward's "cerrado" (denial-of-aid) or "operativo" (honeypot) write change what families are routed toward *immediately and unilaterally*, or does a high-harm status change require a second party?

## What Would Change My Mind?

If you could show me:
- A remote verification that binds a **claimant-controlled** factor (callout-delivered one-time code returned by the claimant, or a *verified* steward co-sign) instead of reaching a public number → I downgrade Flaw 1.
- The interim shipping **staleness honesty only** (triage list + decaying badge + audited actions) and *withholding* any "responsable"/"confirmado por el responsable" rendering until 010/011 land → I clear Flaw 2 and my D5 red.
- A **separation-of-duties** rule so a fresh/unverified steward's "cerrado"/"operativo" needs a second confirmation before it reroutes families → I downgrade the honeypot/denial-of-aid edge.
- Remote confirmations rendered as **provenance-distinct** ("confirmado remotamente / reportado") from on-site ones → I clear Flaw 3.
- Public confirmation timing shown as a **staleness band**, not "hace 2h," plus audit made coordinator-only and aviso authorship role-grain → I downgrade Flaw 4.
- Lapse that **degrades the badge before releasing the grant**, with human-in-the-loop release and re-claim rate-limiting → I downgrade Flaw 5.

...then the honest core (triage + freshness + attributed forensics) goes GREEN, and the remote/claim/interim pieces become a real PROCEED-WITH-CONDITIONS instead of a rubber-stamp with a caveat.

## Confidence Score
**0.8** — I'm 80% confident in this analysis.

Why not higher? Whether the out-of-band check collapses to rubber-stamp is ultimately an empirical, human-behavior question the User persona and a pilot will answer better than I can — if coordinators turn out to verify rigorously at low volume, Flaw 1's severity drops. And the poison window's real-world blast radius depends on how many families actually route off the board in the interim (small early deployment = smaller harm). I'm most confident on Flaws 2, 3, and the cadence-leak in Flaw 4, which are design invariants, not behavioral bets.

## Final Note
The honest, useful half of this proposal — an honest decaying badge and a worked "sitios vencidos" triage list — needs no new privilege and no unverified name, and I'd ship it today. The risk is concentrated in the parts that grant *remote write authority over where families are sent*, verify it with a call to a number the adversary already knows, and then dress an unverified name in a green "confirmado por el responsable" badge that the system's own honesty layer will vouch for. Ship the staleness honesty now; withhold the ownership reassurance until there is a verified identity to pin it to, and never let "confirmed by the keeper, 2h ago, daily" become the schedule that gets the keeper found.
