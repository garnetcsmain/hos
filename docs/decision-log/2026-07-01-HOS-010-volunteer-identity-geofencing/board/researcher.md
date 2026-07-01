# Researcher Review: HOS-2026-010

*Volunteer/reporter identity verification (face enrollment + login) and submission geofencing*
Reviewer: Researcher Agent · Date: 2026-07-01 · Method: web research (14 sources) + read-only codebase survey

## My Recommendation

**RESHAPE** — toward the `non-biometric-alternative` (device-bound key + PIN) plus *advisory, never-blocking* geolocation, and toward corroboration-based trust rather than identity-based trust. I do **not** support building a centralized volunteer face+identity registry in the Venezuela 2026 context on the evidence below. The face-enrollment path is not merely risky at the margins; its single biggest failure mode (a captured registry of who-has-been-helping) is **exactly the artifact the Venezuelan state is currently, actively trying to assemble by other means** (VenApp, Operación Tun Tun). Building it ourselves and centralizing it is building the adversary's target list for them.

Two things also force a caveat before any option is costed:
- **The stated technical prerequisite does not exist on this branch.** The proposal (and the "VERIFIED CODEBASE FACTS" I was handed) both assert `apps/web/app/lib/geotag.ts` is a "real, working" VE-CCS zone-grid to reuse. It is not present in this worktree — there is no `geotag.ts`, no `tagLocation`, no `VE-CCS` / zone-grid symbol anywhere under `apps/web` (grep, 2026-07-01). Whoever costed "2–3 weeks geolocation-only, reuses existing geotag.ts" was costing against code that isn't here. The zone-grid must be *built*, not *reused*. This doesn't kill the geolocation idea, but it invalidates the timeline and should be corrected in the record.
- I confirmed the *other* codebase facts: `apps/web/app/api/found/route.ts` POST is fully anonymous (rate-limit only, no `auth`/`session`/`getUser`), matching the "zero auth today" claim.

---

## Comparable Systems

- **KoboToolbox / ODK Collect (the sector-standard field-data tools):** collect GPS per-submission (lat/lng/altitude/**accuracy**) and can capture location silently as background metadata. Crucially, on the **device-spoofing** question that this proposal's geofencing rests on, the maintainers are explicit: enumerators *have been caught* installing "Fake GPS" apps, there is **no built-in defense against mock locations in the native Collect app**, and in the *browser/Enketo* path — the exact path HOS would use as a web app — **"there is no way to detect a mock location in a browser, so there is no way to address this in Enketo."** → Outcome: the most mature humanitarian field-data ecosystem in the world has *not solved* web-based location integrity; they treat GPS as a data-quality signal, not an anti-fraud control. (KoboToolbox community forum; ODK forum)
- **Ushahidi (crisis mapping, Kenya 2008 → Haiti 2010):** accepted **anonymous** SMS/web reports at volume and solved trust by **corroboration, not identity** — anonymous reports were cross-checked against other reports from the same area and against media; credible-but-unverified items were published *labelled* as unverified. The documented "Garissa" case: a false report of violence was neutralized within hours by contradicting reports from others nearby. Haiti: ~40,000 reports → ~4,000 distinct verified events. → Outcome: the canonical crisis-reporting system deliberately chose *not* to verify submitter identity, and it worked. This is direct evidence that HOS's actual goal ("trust a field report") is reachable **without** authenticating the reporter. (InfoQ; PrepareCenter Haiti study; Ushahidi)
- **Public-sector biometric payroll audits (Nigeria, Ghana, Kenya, 2022–2024):** the *closest* real precedent for biometrics-of-your-own-workforce (not beneficiaries). Fingerprint enrollment removed ~43,000 "ghost workers" in Nigeria (~$75M saved); Ghana's biometric audit flagged ~148,000 payroll-fraud incidents; Katsina State removed 3,488. → Outcome: it *does* stop ghost-worker fraud — **but** every one of these is (a) a *government* enrolling its *own paid civil servants* under a *non-hostile* relationship, (b) fingerprint, not face, and (c) about payroll integrity, not field-report freshness. None involve *unpaid volunteers in an authoritarian state where participation itself is dangerous.* The precedent supports "biometrics can deter workforce fraud"; it does **not** support "safe to do in Venezuela with volunteers." (Biometric Update; M2SYS; ID Tech Wire)
- **ICRC (sector data-protection authority):** the ICRC Biometrics Policy + *Handbook on Data Protection in Humanitarian Action* (3rd ed. 2024 has a dedicated biometrics chapter) hold two positions that bear directly here: (1) biometric data is sensitive because "if retained, it creates a **permanently identifiable record**" the subject may not want to exist forever, especially "if there is a risk that data may be leaked or subject to unauthorised access"; (2) **consent is often *not* a legally valid basis** in emergencies, because it can't be "freely given" when participation depends on it, and can't be genuinely "informed" for biometrics. → This directly answers the board's Researcher question and undercuts the proposal's "explicit consent" success-criterion: in the sector's own leading framework, consent-in-a-crisis is *not* the get-out it's being treated as. (ICRC Humanitarian Law & Policy blog; ICRC Handbook)
- **UNHCR / Rohingya (2018–2021):** biometrics collected without a clean DPIA/consent; data on 830,000+ (incl. biometric) reached the Myanmar government via Bangladesh; refugees who refused enrollment lost aid access. **Afghanistan 2021:** US-left-behind biometric databases (iris/fingerprint) fell into Taliban hands. → Outcome: the two most-cited humanitarian biometric disasters are both **"the registry was captured by the hostile actor the subjects were fleeing."** That is the *exact* threat model for HOS-010. (Engine Room/Oxfam review; New Humanitarian; Geographical)

---

## Ground-Truth Data

- **Best-case face/RIdV false-negative (lockout) rate:** In a 2024 large-scale equity study of 5 commercial remote-identity-verification systems across **3,991 subjects**, the *best* performer had a **false-negative rate of 10.5% ± 4.5%**, and even it was only "equitable" — not zero-lockout. Two of five systems showed **significantly higher false rejections for Black/African American subjects and darker skin tones (Monk 7–10).** (arXiv 2409.12318) → Read against the proposal: a ~10% best-case lockout rate, concentrated in darker-skinned users, applied to a majority mestizo/Afro-descendant Venezuelan volunteer corps on bad cameras, during an active crisis, is a **structural** false-lockout problem, not an edge case. NIST FRVT corroborates the direction (older algorithms 10–100× worse on darker/East-Asian faces; newest algorithms much narrower — so *if* face were used, only a top-tier NIST-ranked model is defensible).
- **Liveness FRR on Android (vendor-favorable figure):** one study reported **0.43% FRR on Android / 0.32% iOS**, but this is under *good* conditions; the same literature warns "low-quality environments" (poor cameras, lighting, connectivity in developing-market devices) **increase both FRR and FAR**, and that many Android devices still fail simple spoofs. The honest range for *this* population is closer to the 10.5% RIdV figure than the 0.43% lab figure. (Facia.ai; Biometric Update)
- **Browser Geolocation accuracy (the geofencing substrate):** GPS 3–5 m *in the open*, but cold-start ≥30 s and blocked indoors/urban; **Wi-Fi ~20 m**; **cell-tower hundreds of metres to several km** in sparse-coverage areas. Shelters are indoors; low-end phones often fall back to cell/Wi-Fi. → A proximity threshold tight enough to be meaningful will **falsely reject legitimate indoor submitters**; a threshold loose enough to avoid that (km-scale) is **trivially satisfiable from the wrong place.** Combined with the browser-mock-location finding, web geofencing is a **soft deterrent, not a control.** (Google Geolocation API docs; StoreLocatorWidgets)
- **AWS Rekognition economics (verified against proposal):** Face Liveness ~$0.015/check (first 500k/mo), Compare/IndexFaces ~$0.001/image, storage ~$0.00001/face/mo — proposal figures are accurate. **Not available in `sa-east-1` (São Paulo); nearest region us-east-1** → biometric templates of Venezuelan volunteers physically leave the continent and land under US jurisdiction. Confirmed. (aws.amazon.com/rekognition/pricing)
- **Venezuela targeting baseline:** 592 attacks on human-rights defenders in H1-2024 (+92% YoY); 321 in H1-2025; X + Signal blocked since Aug 2024; 90% of HRDs cut their posting to avoid reprisal. (RFK Human Rights; vesinfiltro; Freedom House)

---

## Assumption Tests

| Assumption (from proposal) | Verdict | Evidence |
|---|---|---|
| A working VE-CCS zone-grid (`geotag.ts`) already exists and can be reused | **CONTRADICTED** | No `geotag.ts` / `tagLocation` / VE-CCS symbol anywhere under `apps/web` on this branch (grep, 2026-07-01). Must be built; timeline is understated. |
| Web-app geolocation can validate that a submission is *from* the claimed place | **CONTRADICTED (as a control)** | KoboToolbox/ODK: no way to detect mock location in a browser; native app also unprotected. Browser geo accuracy (cell/Wi-Fi, indoors) too coarse to threshold tightly without false lockouts. Deterrent only. |
| SMS/OTP is the wrong fit for this population, so *face* is the better path | **UNKNOWN → PARTIALLY CONTRADICTED** | The SMS critique (cost/delivery/literacy on low-end phones) is fair. But "therefore face" doesn't follow: face has a ~10% best-case lockout rate skewed against darker skin (arXiv 2409.12318) — a *worse* fit for low-literacy, low-end-device, high-stakes field use than a device-bound key + PIN, which has no camera/lighting/liveness dependency. |
| Explicit consent + retention/deletion policy makes biometric enrollment acceptable | **CONTRADICTED (per sector standard)** | ICRC: consent is often *not* a valid legal basis in emergencies (not freely given when participation depends on it; not genuinely informed for biometrics). "Consent-in-a-crisis" is named in the proposal's *own* risk list — the evidence says it's disqualifying, not mitigable by policy text. |
| A volunteer *identity* registry is needed to trust a field report | **CONTRADICTED** | Ushahidi trusted anonymous reports at scale via corroboration (cross-source, volume), not submitter identity. HOS's goal (trust the report) is reachable without a face DB. |
| Biometrics-of-own-workforce is a benign, precedented pattern | **PARTIALLY SUPPORTED, context-fatal** | Precedent exists (Nigeria/Ghana/Kenya payroll) — but only for *paid civil servants*, *fingerprint*, *non-hostile state relationship*. Under a hostile state with unpaid volunteers, the governing precedent is UNHCR-Rohingya / Afghanistan-2021: **registry captured by the adversary.** |
| A captured registry is a serious-but-abstract risk | **CONTRADICTED (it is concrete and current)** | Venezuela is *already* running the campaign this registry would feed: VenApp solicits neighbor-informants; **Operación Tun Tun** marks dissident homes with an "X," knocks on doors for arbitrary detention, and **doxxes names/photos/addresses — explicitly including polling-station witnesses** (ordinary civic participants, the closest analogue to "crisis-response volunteers"). A ready-made volunteer face+identity+location DB is a *direct input* to exactly this apparatus. (Global Voices Advox; DFRLab; CSIS) |
| Coordinator-only geofencing exemption is low-risk | **SUPPORTED (minor)** | Coordinators already have Supabase Auth (confirmed); exempting command-post work is reasonable. Not a concern. |

---

## Unknown Unknowns (where the proposal — and I — are guessing)

- **Real Venezuelan-volunteer device/lighting distribution.** I have *category* data (low-end Android, poor cameras, indoor shelters) and the general ~10% RIdV lockout figure, but **no HOS-specific field measurement.** Nobody has run a liveness check on 50 actual HOS volunteer phones in an actual shelter. Every accuracy number here is imported from other populations. Before *any* face path, that pilot is mandatory — and my bet is it comes back worse than the 10.5% lab figure.
- **The registry's blast radius if HOS itself is compromised.** Threat modeling assumes an *external* attacker. But the higher-probability path in Venezuela is *legal compulsion / device seizure of a coordinator* or infra subpoena — the ICRC "unauthorised access" scenario made concrete. I can't quantify that probability; I can only say the consequence is catastrophic and irreversible (biometrics can't be rotated), and the proposal's own risk list already concedes both halves.
- **Whether "device-bound key + PIN" is actually *implementable* against low-end Android browsers.** The non-biometric option leans on device secure storage / WebAuthn-style keypairs; on old Android WebViews / budget browsers, platform authenticator support and key persistence across app-data-clears is genuinely spotty. I flag this as the thing to *prototype first* — the non-biometric lane's real-world reliability on this hardware is the actual open question, not the face lane (whose verdict is clearer).
- **Duress unlock.** No option here — face *or* device+PIN — protects a volunteer physically compelled to authenticate. Face is worse (can't refuse a camera the way you can refuse to say a passphrase), but neither is safe against Operación Tun Tun-style coercion. Any design needs a **duress/panic path and aggressive data-minimization** so a seized account yields as little as possible.

---

## Confidence Score

**0.72**

Why this high: the load-bearing findings are triangulated across independent, authoritative sources — the mock-location gap (Kobo *and* ODK maintainers), the equity/lockout numbers (n≈4,000 study + NIST), the sector consent stance (ICRC), the captured-registry precedent (UNHCR + Afghanistan), and the *current, specific* Venezuelan targeting apparatus (Global Voices, DFRLab, CSIS, Freedom House). The recommendation direction (do not centralize a volunteer biometric registry here; prefer corroboration + device-key + advisory geo) is robust.

Why not higher: (1) the single most decision-relevant number — the *actual* false-lockout rate on *HOS's actual volunteers' devices* — is unmeasured; I'm extrapolating. (2) The reliability of the non-biometric alternative on real low-end Android is itself unproven and could weaken the recommended path. (3) I could not fully render one primary PDF (arXiv 2409.12318) — I have its abstract-level and summary figures, not the full per-decile tables. None of these change the direction, but they cap my certainty on the *magnitudes*.

---

## Sources

**Field-data tools & submission integrity**
- [Collecting GPS data with KoboToolbox](https://support.kobotoolbox.org/collect_gps.html)
- [KoboToolbox community: "Fake Location detection" (mock-GPS, and "no way to detect mock location in a browser / Enketo")](https://community.kobotoolbox.org/t/fake-location-detection/11522)
- [ODK forum: restricting fake-location apps in Collect](https://forum.getodk.org/t/restricting-fake-location-application-while-collecting-gps-points-with-collect-android-app/29231)
- [Ushahidi and the Power of Crowdsourcing (InfoQ) — corroboration-based verification of anonymous reports](https://www.infoq.com/articles/ushahidi-crowdsourcing-africa/)
- [Crowdsourcing Crisis Information in Disaster-Affected Haiti (PrepareCenter)](https://preparecenter.org/sites/default/files/crowdsourcing_crisis_information_in_disaster-affected_haiti.pdf)

**Biometrics of workforce / staff precedent & sector standards**
- [Kenya, Nigeria turn to biometrics to halt public-sector payroll fraud (Biometric Update)](https://www.biometricupdate.com/202402/kenya-nigerian-state-turn-to-biometrics-to-halt-public-sector-payroll-fraud)
- [Nigerian biometric audit removes 3,488 ghost workers (ID Tech Wire)](https://idtechwire.com/nigerian-biometric-audit-removes-3488-ghost-workers-projects-%E2%82%A65-7-billion-savings/)
- [Facilitating innovation, ensuring protection: the ICRC Biometrics Policy (ICRC Law & Policy)](https://blogs.icrc.org/law-and-policy/2019/10/18/innovation-protection-icrc-biometrics-policy/)
- [ICRC Handbook on Data Protection in Humanitarian Action](https://www.icrc.org/en/data-protection-humanitarian-action-handbook)
- [Biometrics in the Humanitarian Sector (Engine Room / Oxfam review)](https://www.theengineroom.org/wp-content/uploads/2018/03/Engine-Room-Oxfam-Biometrics-Review.pdf)
- [Head to Head: Biometrics and Aid (The New Humanitarian)](https://www.thenewhumanitarian.org/opinion/2019/07/17/head-head-biometrics-and-aid)
- [Fears mount over NGOs gathering biometric data (Geographical)](https://geographical.co.uk/culture/fears-mount-over-ngos-gathering-biometric-data)

**Face liveness / verification accuracy & demographic equity**
- [A large-scale study of performance and equity of commercial remote identity verification technologies across demographics (arXiv 2409.12318)](https://arxiv.org/abs/2409.12318)
- [Biometric Liveness Detection Accuracy in Low-Quality Conditions (Facia.ai)](https://facia.ai/blog/biometric-liveness-detection-accuracy-for-secure-verification-in-low-quality-conditions/)
- [Many smartphones don't detect face biometrics spoofs (Biometric Update)](https://www.biometricupdate.com/202604/many-smartphones-dont-detect-face-biometrics-spoofs-or-properly-warn-consumers)

**Browser geolocation accuracy**
- [Google Geolocation API — request/response accuracy (Wi-Fi/cell)](https://developers.google.com/maps/documentation/geolocation/requests-geolocation)
- [Everything about HTML5 Geolocation Accuracy (StoreLocatorWidgets)](https://www.storelocatorwidgets.com/blogpost/20453/Everything_you_ever_wanted_to_know_about_HTML5_Geolocation_Accuracy)

**Venezuela digital-rights / surveillance / targeting context**
- [VenApp, the Chavista app co-opted for harassment (Global Voices Advox)](https://advox.globalvoices.org/2024/09/11/venapp-the-chavista-app-co-opted-for-harassment-in-venezuela/)
- [How the Venezuelan regime weaponized apps to persecute dissidents (DFRLab)](https://dfrlab.org/2024/09/23/venezuela-weaponizes-apps/)
- [A Question of Staying Power: Maduro Regime's Repression (CSIS) — Operación Tun Tun, home-marking, doxxing of polling witnesses](https://www.csis.org/analysis/question-staying-power-maduro-regimes-repression-sustainable)
- [Defending Human Rights Amid Repression: Escalating Risks in Venezuela (RFK Human Rights)](https://rfkhumanrights.org/our-voices/defending-human-rights-amid-repression-in-venezuela/)
- [2025 Censorship Report (VE Sin Filtro)](https://vesinfiltro.org/noticias/2025-censorship-report/)
- [Venezuela: Freedom on the Net 2024 (Freedom House)](https://freedomhouse.org/country/venezuela/freedom-net/2024)
- [World Report 2025: Venezuela (Human Rights Watch)](https://www.hrw.org/world-report/2025/country-chapters/venezuela)

**AWS Rekognition pricing/regions**
- [Amazon Rekognition pricing](https://aws.amazon.com/rekognition/pricing/)
