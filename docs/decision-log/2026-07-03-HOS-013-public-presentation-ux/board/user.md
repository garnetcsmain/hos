# User Review: HOS-2026-013

## My Recommendation
🟡 RESHAPE — The four pieces do not serve one user; they serve three different ones, and the proposal leads with the piece the person in crisis needs least. For a frightened woman looking for water, the pulse board is decoration and the onboarding + saved view + map + shareable link is the whole product. Reshape so her front door is "¿Qué necesita?" → a map, never the animated board; make animation strictly opt-in on a static base; make the second onboarding tap land her on water; and harden demo-mode honesty before any synthetic motion touches a public crisis page. Then it's a GREEN.

## User Scenario

**I am Marisol Quintero, 41, in Catia.** The water hasn't come to the building in four days. I have a $60 Android (an entry Samsung), 1.5 GB of data left this month, 3G that drops in the stairwell, 18% battery, one shared charger. My reading is slow — I left school early. A neighbor sends me a WhatsApp: "mira esto, aquí dicen dónde hay agua" with a link. **What I need in the next 10 minutes:** the nearest water point that is actually open right now, and how to get there — before my battery dies and before I have to go stand in a line on a rumor.

**I am also Andrés, 34, in Doral, Miami.** Venezuelan, I send money home and to two orgs. I got the same link forwarded. **What I need:** to believe in 15 seconds that this thing is real and working, so I share it and maybe donate. I'm on fiber, on an iPhone, calm.

**And Gabriela, a reporter** doing a piece on the crisis response. She needs a credible, non-sensational, screenshot-able picture of scale that won't get a source killed.

## Does This Solve It?

- **Pain addressed:** PARTIAL. For Marisol: the pieces that solve her problem (D3 onboarding → D2 saved view → search → the map) exist in the proposal but sit *behind* the piece that doesn't (D1 pulse board). For Andrés and Gabriela: D1 is genuinely the right tool — it answers "is this alive and real," which is exactly their question and not Marisol's.
- **Ease of use:** LOW for Marisol as sequenced, HIGH for the donor. The animated "Brain Board" as a landing hero is a battery-and-data tax paid by the poorest device to impress the richest one.
- **Would I use it:** Marisol — MAYBE, and only the map. Andrés — YES. Gabriela — YES if the numbers read as honest, not hyped.

**Which of the four is the actual adoption driver?** For the crisis user it is **D3 (one-question onboarding) + D2 (saved/shareable view) + search + the existing map** — not D1. D1's adoption value accrues to the diaspora donor and the journalist, i.e. to funding and legitimacy, not to the person who needs water. That's a real and worthwhile job — just don't confuse it with serving Marisol, and don't make her pay its rendering cost.

## Friction Points

1. **The pulse board as front door → jank, drain, and no answer.** Continuous SMIL/count-up/rotating-spotlight animation on a $60 Android on 3G is a frozen, data-eating hero before she ever finds a button. Even with the promised SSR snapshot, if the landing *leads* with the board, her first experience is loading a thing she didn't want. → **Lead the public landing with "¿Qué necesita?" and a map.** Ship the pulse board on its own route (`/pulso`), linked as "ver la actividad del sistema," and default to the static snapshot; animate only as opt-in or only when the device/network clearly can afford it (`prefers-reduced-motion`, Save-Data header, connection API). Animation is a reward for capable devices, never a toll on weak ones.

2. **"Necesito ayuda" is one tap to nowhere.** The four-way question is good, but "help" is not a screen — water is. If tap one is "Necesito ayuda" and tap two is a generic help page, she still has to hunt. → **Second tap must be category** (agua / comida / refugio / salud, as big icons + one plain word each), landing directly on the **map centered on her district with only water points**, sorted nearest-open-first. That is the "two choices to a useful screen" the success criterion promises — make sure the second choice is the *category*, not a submenu.

3. **A 12-year-old reading bar is still above Marisol.** Low literacy is below 12yo *reading*; four text options are already four things to decode. → **Pictograms carry the meaning** (a water drop, a plate, a roof, a cross), text as support not gate. Consider a spoken label on tap. This is cheap and it's the difference between her using it and closing it.

4. **Demo mode on a public crisis page can manufacture false hope.** A labeled "demostración" board still shows pulses that read as "help is being assigned near me right now." A frightened, slow-reading user does not parse the label — she parses the motion. If a synthetic "Rescate asignado - Catia" animates, she may believe rescue is coming to her. → On the *public* landing, prefer a **static "así se ve cuando está activo" still** over live-looking synthetic motion; if motion is kept, the demo watermark must be unmissable and demo events must never mimic aid-is-arriving-to-you (no district-matched "asignado/recibido" in synthetic mode). Honesty here isn't a label, it's not simulating hope.

5. **Mi tablero is a second-visit feature sold as a first-visit one.** A first-time frightened user doesn't want to "compose a view." → Keep D2 invisible on first run; *offer* it after she's found water once ("¿guardar agua en Catia?"). Its real power is the **shareable URL** — that's how the *next* Marisol gets here (WhatsApp, from a neighbor), which is the actual distribution channel this proposal correctly names. Design that link/OG card as a first-class product, not a byproduct.

## Per-sub-decision
- **D1** — RESHAPE placement: right tool, wrong front door. Coordinator version and donor/journalist version: good. Not Marisol's entry, not on her battery by default.
- **D2** — GREEN, but foreground the *shareable link*, background the *composer*.
- **D3** — GREEN with conditions: second tap = category → map; pictograms for sub-12yo literacy.
- **D4 (Ver como)** — GREEN as a leak-audit / coordinator tool. Zero crisis-user value, and that's fine; don't gold-plate it.
- **D5 (console ergonomics)** — GREEN, uncontroversial, ship it.

## Missing Piece

- **"Is this water point actually open *right now*?"** Finding the pin is half the job; walking 40 minutes to a closed acopio on a dead rumor is the failure that hurts. This is where HOS-014 stewardship is load-bearing for *this* proposal — the map is only worth showing Marisol if the freshness on each pin is honest. If a pin can't say "confirmado hace 2 h" it must say "sin confirmar" loudly, so she weighs the trip. A confident pin that's wrong is worse than no pin.
- **The offline / dying-battery path.** Her most likely state is a dropped connection at 12%. She needs the last-loaded water map to survive going offline and to be one tap to save/screenshot before she leaves the stairwell signal. Nothing in the four pieces addresses "I found it, now my phone is about to die and I have to walk there."
- **Directions she can actually follow.** A pin on a Leaflet map is not directions for someone who navigates by landmarks, not streets. Even a plain-text "cerca de [landmark], sector X" line helps more than the map alone.

## Confidence Score
**0.82** — why not higher: I'm highly confident the pulse board is the wrong front door for the crisis user and the right one for donors/journalists — that split is the core finding and it's robust. I'm confident about the animation cost on low-end 3G. Less confident about the exact onboarding tap-flow without a moderated test with real low-literacy users (the success criterion rightly demands one — do it before public flip). And I can't judge the targeting-oracle math on the aggregate feed; that's the Contrarian's call, and my "lead with the map" reshape assumes the coordinator-gated map's precise site pins stay coordinator-side or are genuinely public source data as the proposal claims.
