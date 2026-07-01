# User Review: HOS-2026-010-R2 (defining sensitive operations)

*Reviewer: User Agent · Date: 2026-07-01 · Persona carried forward from `board/user.md` (Yolanda, Petare shelter volunteer). Method: walked the actual moment of each of the three starter candidates on the device and in the light this person actually has, then asked the only question that matters — protection, or insult?*

## My Recommendation

**Adopt a deliberately SHORT list, and make it shorter than the starter list.**

Concretely, from the volunteer's chair:

- **Candidate 1 (found-report where `condition = deceased`): DO NOT step-up.** A PIN prompt at the exact instant I'm recording that someone died is the single most misplaced piece of friction in this whole proposal. It reads as suspicion at the one moment I most need the system to just *believe me and get out of my way*. Keep it a plain, content-blind create call like every other report.
- **Candidate 2 (edit/retract an existing report): step-up IF that endpoint is ever built — and only the *retract/alter-after-the-fact* part, not fixing my own typo seconds later.** This is the one candidate that lands as obviously reasonable to me, because changing a record other people have already acted on is genuinely a different kind of act than creating one. But it does not exist today, so this is a *pre-commitment for a future endpoint*, not a thing to build now.
- **Candidate 3 (switching which volunteer is "active" on a shared device): YES, step-up — but reframe it.** This is the shared-device shift-change reality I raised in R1, and it's the one place a PIN re-entry is not an obstacle but the *whole point*: it's how Marisol proves the next four hours of reports are hers and not still filed under my name. The friction here isn't a tax on helping — it's the thing that makes attribution mean anything. But it has to be *one* PIN entry per hand-off, not per report.

So: **one real "yes" (Candidate 3, reframed), one conditional future "yes" (Candidate 2, retract-only), one firm "no" (Candidate 1).** The mechanism should be the device PIN, never a face re-scan — R1 already killed repeated face use and I do not want it resurrected through this side door. And whatever the final list is, the total number of times a normal volunteer gets stopped on a normal night must be countable on zero fingers. Step-up is for the *unusual* act, not the *consequential-sounding* one.

## User Scenario

I am still **Yolanda**, 44, the parish-refugio volunteer in **Petare**, same cracked-screen **Tecno Spark**, same rationed Movistar prepaid data, same one flickering fluorescent tube over the intake table. Since R1 I now have an *account*: a device-bound key and a **6-digit PIN** I set the first calm afternoon someone walked me through it. Day to day, that PIN is invisible — the app remembers my session, I open the found form, I type, I submit. Good. That's the deal I agreed to.

Tonight is worse than the last bus. A truck came from the border with **fourteen people**. Two didn't survive the trip — a man maybe sixty, and, I'm told, an infant. The bodies are in the back room. The families of the living are already crowding the door with photos on their phones. I have a **shared refugio phone** in my hand because my own died an hour ago, and at **1 a.m.** Marisol takes over from me — same phone, her account, not mine.

**What I need in the next fifteen minutes:** get fourteen people into the system — the twelve living so families find them tonight, and the two who died *recorded honestly and immediately*, because a family searching for that man needs to stop searching, and because if I don't log the infant now I will be too destroyed to do it later. Every one of these is a create call. None of them, from where I stand, is "sensitive" in the way a security engineer means it. They are *sacred*, which is not the same thing, and the system needs to know the difference.

## Walking Through Each Candidate

### Candidate 1 — Submitting a found-person report where `condition = deceased`

**The actual moment:** I've just typed what I know about the man who died. I've had to pick "Fallecida" from the dropdown — the app already has that word ready (`form.condition.deceased` → "Fallecida", I've seen it). My hands are not steady. I hit *Guardar*. And the phone stops me: **"Vuelve a ingresar tu PIN para confirmar."** Re-enter your PIN to confirm.

**How it lands: like an accusation.** In that half-second my gut reaction is not "ah, a thoughtful safeguard." It's *"why are you interrogating me about this one?"* The system has, at the worst possible moment, singled out the death as the thing it doesn't trust me about. It feels like the app flinched. I'm already carrying that this man died in a truck; I do not need the software to treat my recording of it as a suspicious act requiring extra proof of intent.

And here's the practical trap the proposal itself half-sees: **deceased is a dropdown value, not a separate action.** For the app to prompt me here, it has to *inspect what I typed and react to it*. From my side that means the form is *reading my answers and deciding some of them are alarming.* That's a creepy feeling even when I can't name why — the same category of "the computer is judging the content" that this project's own principle ("AI recommends, people decide") is supposed to keep me safe from. I'd rather the form be **content-blind**: it takes deceased exactly as calmly as it takes "alive," because a volunteer needs the machine to be the *steady* one in the room.

Is there a real harm this is trying to catch? A wrongly-entered "deceased" is genuinely awful — a family told their son is dead when he isn't. I feel the weight of that. **But a PIN re-entry does nothing about it.** I *know* my PIN; typing it four more digits does not make me more sure the man is dead. It catches nothing except my momentum. If the fear is a wrong entry, the fix is a plain **review-before-send summary** — "Estás por registrar: Fallecida. ¿Confirmar?" — a content-blind "does this look right" that I'd actually *welcome*, because it protects me from *my own* shaking-hands mistake without implying I need to re-prove I'm me. That's a confirmation of the *fact*, not a re-authentication of the *person*. Completely different feeling. **Verdict: no step-up. A gentle plain-language confirm is fine and even kind; a PIN wall is an insult here.**

### Candidate 2 — Editing or retracting a previously-submitted report (if such an endpoint is ever built)

**The actual moment (imagined, since it doesn't exist yet):** It's three days later. I'm home, calmer. I get word that the man we recorded as deceased was misidentified — it was someone else; *he's alive and at another shelter.* I open the record to *retract* the death. The phone asks me to re-enter my PIN.

**How it lands: completely reasonable. Barely register it.** This is the one candidate where the step-up feels like it *belongs*, and the reason is precise: **I am reaching back in time to change something other people have already acted on.** A coordinator may have already told a family that man died. Un-saying that is a heavier act than saying it the first time, and taking one extra second to confirm it's really me doing it — from home, days later, maybe on a different network — feels *proportionate*. It matches my own instinct that this is a big deal. It doesn't feel like suspicion; it feels like the system treating a serious correction seriously.

**Two hard conditions from my chair, or this one also turns into an insult:**
1. **Fixing my own fresh typo is NOT this.** If I misspell the man's name and catch it *ten seconds after submitting, still standing at the intake table*, and the app makes me re-PIN to fix one letter — that's back to bureaucracy. The line is: *amending a record while it's still obviously "mine" and "just now"* = no step-up; *retracting or altering a record after it's had time to be acted upon* = step-up. If you can't cleanly draw that line in the endpoint, err toward **retract/withdraw requires step-up, in-place typo-fix within a short window after my own submission does not.**
2. **It must not exist as a trap for the field.** Retract-with-step-up is a *calm-afternoon-from-home* feature. Nobody should hit it mid-bus. As long as creating is friction-free and only *editing-after-the-fact* is gated, the exhausted-me at 1 a.m. never touches it. That's the right split.

**Verdict: step-up is appropriate for retract/alter-after-the-fact — but this is a pre-commitment for an endpoint that does not exist, not work to do now. Do not build the endpoint just to have something to protect.**

### Candidate 3 — Switching which volunteer is "active" on a shared device (shift change)

**The actual moment:** It's 1 a.m. Marisol arrives. The refugio phone is still logged in as *me*. She taps something — "Cambiar de voluntaria" / switch volunteer — picks her name, and the phone asks *her* to enter *her* PIN.

**How it lands: this is not friction, this is the point.** I *want* this one. This is the exact shared-device, fast-hand-off reality I said in R1 was the normal case in a shelter, not the edge case — and here a PIN re-entry is doing honest work: it's the seam between *my* four hours and *hers.* Without it, one of two bad things happens: either the phone stays logged in as me and everything Marisol records all night is silently attributed to Yolanda (so when a coordinator has a question about a 3 a.m. report, they call me, asleep, instead of Marisol, who actually took it) — or switching is *frictionless* and anyone who picks up the shelter phone becomes "Marisol" with a tap, which makes the whole attributed-identity system worthless. Her typing her own PIN is how she *claims* the shift. It's the good kind of friction: it protects *me* (I'm not on the hook for hours I didn't work) and it protects the record (it actually means something).

**But the reframe is essential, and the proposal undersells it.** This is **not** "add a step-up on top of normal use." Identity-switching on a shared device *is not built yet at all* — R1 gave us device-key + PIN, which quietly assumes one human, one device, exactly the assumption I flagged as wrong for shelters. So Candidate 3 isn't "gate an existing action," it's **"the shared-device shift-change model is the missing feature, and the PIN re-entry is simply how you enter it."** Framed as a bolt-on step-up, it sounds like more bureaucracy. Framed correctly — *this is how a shared phone works at all in a place with shift changes* — it's the most important thing on this list.

**Two conditions from my chair:**
1. **One PIN per hand-off, never per report.** Marisol enters her PIN *once* when she takes the phone, and then for the next four hours she's just working — create, create, create, no prompts. The instant "switch active volunteer" starts meaning "re-PIN every few minutes because the session is paranoid about who's holding the phone," you've rebuilt the per-session face-login nightmare from the original decision with a keypad instead of a camera. The whole reason we killed face login was that re-proving yourself constantly on a shared device in an emergency is unlivable. Don't reintroduce it.
2. **There must be a dead-simple "whose phone is this right now?" indicator** — my name visible on screen while I work, so Marisol *sees* it's still me and knows to switch, and so I can glance down and confirm I'm not accidentally filing under her. The switch is only as good as the visibility of who's currently active.

**Verdict: yes — but bill it as building the shared-device model, with PIN-entry as the natural shift-change gate, not as an extra hoop on an existing flow.**

## Friction Points

1. **Content-conditional step-up (the deceased case) makes the form feel like it's judging my answers.** → Replace it with a **content-blind plain-language confirm summary** ("Estás por registrar: Fallecida — ¿confirmar?") that protects me from a mistyped field without re-authenticating *me*. Confirm the fact, don't re-verify the person. Never make the app flinch at the death I'm recording.

2. **A step-up at *submission* of anything punishes the wrong moment.** The whole day-to-day life of a volunteer is submitting. If any create-call can trigger a PIN wall, the friction lands squarely on the fourteen-people-off-a-truck moment — the exact moment R1's low-friction promise was *for.* → **Keep every single create call step-up-free, without exception.** Reserve step-up for acts that are *not* "record what's in front of me right now": switching operator, and reaching back to alter an existing record.

3. **"Sensitive" is being measured by emotional weight, but should be measured by reversibility-of-consequence-to-others.** Recording a death is heavy but it's *me honestly reporting a fact I witnessed* — low risk of the specific harm step-up prevents. *Retracting* that death days later, or *becoming a different volunteer* on a shared phone, changes what other people will do based on the record. → Draw the line at **"does this act change or reassign a record other people rely on?"** not **"does this act feel serious?"** The dropdown value "deceased" fails the first test; the retract and the operator-switch pass it.

4. **A face re-scan for step-up would quietly undo the thing that made me trust this system.** The proposal already leans toward PIN, good — but I want it on the record from the user's side: → **PIN only. If "sensitive operation" ever becomes an excuse to point the camera at my face again, even once more, you've reopened the registry/coercion wound the whole board process closed. Absolutely not.**

5. **Every step-up screen, like every screen, must be Spanish-first and un-missable.** → A PIN prompt that appears in English, or that I can't tell apart from an error, at 1 a.m. under a flickering tube, will read as "the app broke / I'm locked out" and I'll put the phone down. The app is `es`-first (`strings.ts`); the step-up copy must be too, and it must clearly say *what* it's confirming and that my work is safe.

## Missing Piece

**The panic/duress angle of step-up — which cuts BOTH ways, and nobody's holding both ends.**

R1 and the parent decision both flagged that a PIN can be extracted under pressure (device seizure, "Operación Tun Tun" reality). Step-up interacts with that in a way this proposal doesn't mention:

- **The bad way:** if step-up guards a *destructive* act like retract, then someone who seizes the phone and coerces my PIN can *erase* reports — make found people vanish from the record. So the retract endpoint (Candidate 2), the moment it exists, needs to be **reversible/soft-delete and coordinator-visible**, not a hard wipe. A "retract" that a coerced volunteer can be forced to perform must not silently delete a family's only trace of their person. Step-up is *not* a substitute for making the destructive action itself recoverable.

- **The overlooked-good way:** the shared-device switch (Candidate 3) is quietly *also* the safest place to put a **panic exit.** When Marisol switches in, or when I hand the phone off, that's the natural moment to also offer "cerrar sesión y borrar mi rastro local" — log out and clear my local footprint from this shared phone — so I'm not leaving my session (and, per R1, possibly a cached embedding) sitting on a device the next person, or a checkpoint, could pick up. The shift-change flow we're already building for attribution is the exact hook for the device-hygiene R1 left open. Nobody has connected those two, and they're the same screen.

The one-line version: **step-up should make it harder to do harm, not easier — and on a shared, seizable phone in this country, "confirm you're you before you destroy a record" and "let me safely stop being on this phone" are the same feature seen from two sides.** Build Candidate 3 and you're most of the way to solving a duress gap R1 explicitly left open — but only if you notice you're doing it.

## Confidence Score

**0.8** — high, because I've stood in this exact room (the shared phone, the shift change, the two who didn't make it are not hypotheticals), and because the three candidates sort *cleanly* from the user's chair once you stop asking "is this serious?" and start asking "would a PIN here protect me or accuse me?" The deceased-step-up is the clearest miss in the whole proposal and I'm confident about that; the operator-switch is the clearest win and I'm confident about that too.

Not higher for three honest reasons. **One:** the retract line (fresh typo vs. after-the-fact alteration) is a real judgment call and I'm trusting that it can be drawn cleanly in an endpoint that *doesn't exist yet* — if it can't, my "conditional yes" gets muddier. **Two:** I can't see the actual step-up *screens*, and this entire review turns on copy and placement — a well-worded Spanish confirm and a badly-worded English PIN wall are the difference between "protection" and "I put the phone down," and I said the same thing in R1 about the fallback lane. **Three:** the whole scope assumes the PIN itself is livable on this hardware in this moment — if entering 6 digits on a smeared cracked screen under a flickering tube is itself a 20-second fight, then *every* step-up, even the good ones, costs more than it looks like on paper, and the honest answer might be "even fewer than I said." Show me the three screens, in Spanish, with a create-call that never once asks for a PIN, and I'll move the two "yes" candidates to a green light.
