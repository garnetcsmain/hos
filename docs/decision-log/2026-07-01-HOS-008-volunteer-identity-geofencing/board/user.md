# User Review: HOS-2026-008

## My Recommendation
🟡 RESHAPE

(Specifically: **green-light the geolocation-only path as a soft signal, kill face-enrollment as a gate for v1.** The identity problem is real; face-as-login is the wrong tool for *this* person on *this* phone in *this* country.)

## User Scenario

I am **Yolanda**, 44, a shelter volunteer at a parish-run refugio in **Petare, Caracas**. I am not staff — I show up when I can, between my own family's crises. My phone is a **Tecno Spark**, one of the cheap Androids everyone here actually carries: cracked screen, front camera that smears in anything but direct sun, 2 GB RAM, Movistar prepaid data that I ration by the megabyte. The refugio's main room has one flickering fluorescent tube and no windows on the intake side. It is 8 p.m. A minibus just arrived from La Guaira with **eleven people**, three of them elderly, one a boy of maybe six who won't say his name. A mother is already outside asking if her son came on this bus.

**What I need in the next 10 minutes:** get these eleven people into the system — names, condition, where they are now — so that when a family searches, they find them *tonight*, not tomorrow. Every person I don't register in the next hour is a family that goes another night not knowing.

Today, per `apps/web/app/api/found/route.ts`, I open the found form, I type, I submit. No account, no login, nothing between me and helping. That is the baseline this proposal changes.

## Does This Solve It?

- **Pain addressed: PARTIAL.** The coordinators' pain (is this report real? is it fresh? is it from where it claims?) — yes, geofencing genuinely helps that, and I *want* my reports trusted. **My** pain — get eleven frightened people registered fast on a bad phone in bad light — is not addressed; the face-enrollment path actively *adds* to it. The two halves of this proposal do not weigh the same. Geofencing costs me a permission tap. Face-login costs me the thing I came to do.
- **Ease of use:** Geolocation-only: **7/10** — one browser permission prompt, familiar, done. Full face path: **3/10** — it introduces the first login screen volunteers have *ever* seen (the proposal's own `resources.prerequisites` confirms no volunteer account system exists), on the worst hardware, at the worst moment.
- **Would I use it: MAYBE** — leaning YES for geo, leaning NO for face. If enrolling my face is the price of registering that six-year-old, I will do it once, badly, in this fluorescent flicker — and then I will spend tomorrow night locked out because my one enrollment frame was garbage, and I'll go back to texting a coordinator the names off a scrap of paper. You will have *pushed me off the system you built for me.*

## Friction Points

1. **The first login screen volunteers ever see arrives mid-emergency.** → Enrollment must never sit on the critical path of an active report. Let me submit *first*, anonymously or on a shared device token, and enroll *later* when the bus has been unloaded. "Register once" must not mean "register before your first save," or the very first save — the one with the lost child — is the one that doesn't happen.

2. **My front camera + one fluorescent tube + a darker-skinned face = the failure the risks section already names.** The proposal cites NIST FRVT bias against darker-skinned faces, then points the camera at exactly those faces in exactly the worst light. → The **non-biometric fallback lane must be the default, not the exception.** Don't make me fail face-auth twice, get scared I'm locked out, *then* discover a PIN existed. Offer the PIN/keypair path up front, equal in prominence, no penalty, no "are you sure you don't want to try your face again?" nagging.

3. **The fallback is described but not designed for the panic moment.** "A non-biometric fallback lane" is one bullet. In the flickering room, what I need is a visible, un-missable **"No puedo — entrar de otra forma"** ("I can't — get in another way") button on the *same screen* as the camera, the instant it fails, in Spanish (the app is `es`-first per `lib/i18n/strings.ts` — every one of these screens must be too). If recovery is buried a menu away, it doesn't exist for someone whose hands are shaking.

4. **Geofencing assumes I'm where the system thinks I should be.** I got *assigned* to Petare. Tonight the bus came and we're processing intake in the parish hall two streets over because our room flooded. Am I now "out of zone"? The proposal says a geo-miss is "always a flag for human coordinator review, never an automatic penalty" — good, keep that iron-clad — but from *my* side I need to see, in plain language, **"Estás fuera de tu zona asignada — esto se marcará para revisión, pero tu reporte se guarda"** ("You're outside your assigned zone — this will be flagged for review, but your report is saved"). If the screen instead *blocks* me or just says "location error," I will assume I'm rejected and stop. The save must happen regardless; the flag is the coordinator's problem, not a wall in front of mine.

5. **"Log in with your face" every session, on rationed prepaid data, over a web app.** Liveness checks stream frames. That's data I'm counting in megabytes and a camera that takes ten seconds to focus. → If face must exist at all, cache a real session so I'm not re-scanning every time the PWA reloads on 2 GB of RAM, and make the whole flow work when the capture is a single still, not a video, for the phones that can't stream.

6. **The coordinator exemption is right — but watch the optics it creates.** Coordinators already authenticate via Supabase (per `bootGuard.ts`) and are exempt from geofencing here; that's defensible — they verify from a desk, they're not the spoofing surface. But the felt message to *me* is "the system trusts the people at desks and geo-cages the people in the field." If a coordinator can vouch for a volunteer, or bulk-register a shelter's regulars from their verified account, the exemption becomes a *tool that helps me* instead of a line that ranks me below them.

## Missing Piece

**The shared-device and the hand-off reality.** The persona this proposal targets — me — often works on the *refugio's* phone, not my own, and hands it to the next volunteer at shift change. "Register once, log in with your face" quietly assumes one human, one device, one face. On a shared device, face-login means Yolanda logs out and Marisol logs in *between every batch of arrivals* — enrollment friction multiplied by every shift change, all night. The proposal has a fallback for face *failure* but no model for **shared-device, multi-volunteer, fast hand-off** — which is the *normal* case in a shelter, not the edge case.

And the darker missing piece the risks section gestures at but doesn't resolve: **a permanent biometric roster of the volunteer network is a targeting list in an authoritarian-state context.** I am not a spy, I'm a parish volunteer — but if that face database is subpoenaed, seized, or breached, it maps every person quietly helping displaced Venezuelans, tied to their name, org, and *zone*. The consent/retention/deletion bullet exists; it must become the load-bearing wall of v1, not a v2 cleanup. Concretely: templates on my device where possible, aggressive auto-deletion, and a real "delete me and I keep volunteering anonymously" path — because the moment enrollment feels like registering myself with *someone who might come looking*, the people you most need in the field are the ones who walk away. **Protect the volunteer, not only the families.** The device-bound keypair + PIN option (`options.non-biometric-alternative`) gets you fresher, attributable data with none of this biometric-roster liability — it should be the v1 default, and face should have to *earn* its way in past that bar, not the reverse.

## Confidence Score

**0.82** — high, because I've stood in this room: the hardware, the light, the shared phone, and the prepaid data are not hypotheticals, and the proposal's own risk list already admits the failure modes I'm describing. Not higher because I can't see the fallback lane's actual screens or how loud the "I can't — another way" exit will be, and *that single design choice* is the whole difference between "I'll use it" and "you locked me out the first bad night." Show me a flow where the lost-child report saves before any face is scanned, with the PIN path equal-and-visible and every string in Spanish, and this moves to a green light on the geo half tomorrow.
