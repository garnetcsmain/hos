# Contrarian Review: HOS-2026-008

> Volunteer/reporter identity verification (face enrollment + login) and submission geofencing
> Reviewer: Contrarian Agent · Date: 2026-07-01 · Status: Board review in progress

## My Recommendation

**RESHAPE** — specifically, **KILL the face-biometric enrollment path entirely, and PROCEED WITH CONDITIONS on a geolocation-only + device-key subset.**

Let me be direct about why this is not a "PROCEED WITH CONDITIONS on the whole thing." The proposal is unusually self-aware — it names most of its own risks in the `risks:` block, which is admirable and rare. But naming a risk is not mitigating it, and this proposal repeatedly names a fatal risk and then proceeds to keep the feature that causes it "for completeness" or "if it proceeds." The single most important thing I can tell this Board is: **the proposal has already done the analysis that kills its own centerpiece, and then declined to draw the conclusion.** The `non-biometric-alternative` option in the proposal is not a fallback. It is the correct primary design, and the face-enrollment path is the thing that should be cut.

I am going to spend most of this review on why face enrollment must die, because that is where a well-meaning "yes, with conditions" causes irreversible harm to real people.

---

## Fatal Flaws Found

### Flaw 1: You are building a target list of the resistance and calling it a login feature

**Severity:** CRITICAL

**What breaks:** The system creates a centralized, biometrically-indexed registry of every person who has volunteered for an independent crisis-response effort in Venezuela in 2026. Name, org, role, assigned zone, and a face template that resolves to a specific human being, all in one place. The proposal itself says this "can read as opposition-adjacent activity under the current government." That is the whole ballgame.

**Why it's real:** This is not hypothetical, and I want to nail down that it is not hypothetical, because "PROCEED WITH CONDITIONS" votes get cast when a Board half-believes the worst case is paranoid. It is not paranoid. The verified external research already in front of this Board documents the **UNHCR Rohingya precedent (2018–2021): biometric data on 830,000+ refugees, collected without a proper impact assessment, ultimately reached the Myanmar government** — the exact government those people were fleeing. That happened to a UN agency with a professional data-protection function, lawyers, a formal DPIA process it was supposed to follow, and decades of operational security experience. This project is a Next.js app on Vercel with a coordinator allowlist that produced a **production 500 at boot within the last few days** because the auth boot guard was misconfigured (verified: `apps/web/app/lib/http/bootGuard.ts`, and the incident is in the project's own recent history). If UNHCR could not keep a biometric refugee registry out of a hostile state's hands, the honest prior for this team is worse, not better.

And the threat surface here is broader than "the government hacks the database." It includes:
- **Legal compulsion.** The data will physically live in `us-east-1` (verified: Rekognition has no South American region; and self-hosting still puts it on infra someone can be served process against). A subpoena, a hosting-provider compromise, an insider, a phished coordinator credential, or a seized laptop with cached data — any one of these is sufficient.
- **The registry is worse than the HOS-2026-006 database it is being distinguished from.** The proposal argues, correctly, that HOS-006 is a database of *missing and found civilians* (people the system is trying to help), whereas this is a database of *the helpers*. A leaked list of missing persons is a humanitarian tragedy. A leaked list of the volunteer corps is an **order of battle for reprisals** — it tells an authoritarian state exactly who to detain, and the face templates make sure they can identify them at a checkpoint. This proposal correctly identifies that its own risk profile is HIGHER than HOS-006, and HOS-006 already required human + legal sign-off.

**Impact:** Detention, disappearance, or death of volunteers — the precise population this system exists to mobilize. And a chilling effect: the moment word spreads that "you have to scan your face to help," enrollment among exactly the most security-conscious (i.e., most experienced) volunteers collapses.

**Could we fix it?** For the geolocation and device-key portions: yes. For the **face-biometric registry: NO.** There is no engineering mitigation that reduces "we hold a face-indexed list of the resistance" to an acceptable residual risk in this threat model. Encryption-at-rest does not help against a compromised coordinator account or legal compulsion of the operator. "Store only vectors, not raw images" (the self-hosted option's pitch) does not help — a face template is still biometric special-category data that re-identifies a specific person, and templates can be matched against a probe image the state supplies. Data minimization has a floor here, and the floor is still "a list of who helped, keyed to their face." The only fix is not to build it. **Biometrics cannot be rotated after compromise** (the proposal says this itself) — unlike a leaked password, a leaked face is leaked forever.

---

### Flaw 2: Face-as-login is a coercion feature, not just a privacy risk

**Severity:** CRITICAL

**What breaks:** A detained or pressured volunteer can be compelled to unlock and authenticate far more easily than they can be compelled to reveal a passphrase they can plausibly claim to have forgotten.

**Why it's real:** This is a well-understood distinction in operational security, and it inverts the usual UX argument for biometrics. "Log in with your face, no password to forget" is a *convenience* framing that becomes a *liability* the instant the adversary is a state actor with physical custody of the person. You cannot be tortured into forgetting something you can genuinely forget; you *can* be physically turned toward a camera. Worse, the same property lets a captor **impersonate a captured volunteer**: point the phone at the detainee's face, and now the state is authenticated into the reporting system as a trusted, known field volunteer — able to inject false "found person" / "needs" / location reports that coordinators are being explicitly told to *trust more* because they came from a verified identity at a plausible location. The feature's entire value proposition (coordinators can trust verified submissions) becomes the attack: **the more the coordinators trust the biometric signal, the more damage a coerced login does.**

**Impact:** Coerced authentication; state injection of poisoned field data under a trusted volunteer's identity; increased physical danger to a volunteer whose face is the key.

**Could we fix it?** Partially, and only by abandoning the premise. A memorable passphrase preserves *deniability and duress resistance* that a face fundamentally cannot. This flaw alone argues that even if the privacy-registry problem (Flaw 1) were somehow solved, face-as-the-authentication-factor is the wrong factor for this specific adversary. NO clean fix while face is the credential.

---

### Flaw 3: The false-lockout burden lands exactly on the people the system depends on, during the exact moment it matters

**Severity:** CRITICAL

**What breaks:** A legitimate volunteer cannot submit a report during an active crisis because face verification fails — poor camera, bad lighting, injury, a cracked screen, a dirty lens, a dust storm, nighttime, a face partially covered for the volunteer's own safety, or simply the demographic error profile of the model.

**Why it's real:** The verified research is blunt: **NIST FRVT shows many face-recognition algorithms are 10–100x more likely to misidentify Black or East Asian faces than white faces.** The Venezuelan volunteer population is not the demographic these models were optimized on, and the failure is worst precisely under the conditions this deployment guarantees: low-end phones (the proposal's own stated reason for rejecting SMS), poor connectivity, poor lighting, field conditions, and stressed or injured subjects. So the false-non-match rate is highest *for this population, in this environment, at the highest-stakes moment.* The proposal's stated principle is "crisis-grade: works low-connectivity, mistakes recoverable." A face-login gate is the opposite of crisis-grade — it *adds* a network round-trip and a compute dependency (`us-east-1` for Rekognition, or a GPU host at ~$150–400+/mo for self-hosted; CPU-only inference is 10–30s/image per the verified research, which is a non-starter for field login) to the critical path of getting a report in.

The proposal's answer is "a non-biometric fallback lane so face-auth trouble never fully locks a legitimate volunteer out." Fine — but notice what that concession actually proves: **if a non-biometric lane is robust enough that a locked-out volunteer can always fall back to it and still report, then the non-biometric lane is sufficient on its own, and the face layer is adding risk (Flaws 1 & 2) without adding assurance** — because any adversary can also take the same fallback lane. You cannot simultaneously claim the fallback is a safe universal escape hatch *and* that the face gate meaningfully raises the trust bar. Pick one. If the fallback is weak enough to preserve the face gate's value, it will strand real volunteers. If it is strong enough to never strand a real volunteer, it dissolves the face gate's value.

**Impact:** Silent loss of field reports during a crisis; the loss is biased against the demographic and the conditions the system serves; erosion of volunteer trust ("the app locked me out when it mattered").

**Could we fix it?** The lockout problem is fixed by *not gating on the biometric at all.* The fallback-lane paradox above is not fixable by tuning a threshold — it is structural.

---

### Flaw 4: Web-app geolocation is trivially spoofable, so the geofence buys far less integrity than the proposal implies

**Severity:** HIGH

**What breaks:** The "device is physically near the assigned location" guarantee is, on a pure web app, an honor-system value that a motivated bad actor overrides in seconds.

**Why it's real:** Verified research: **hardware-backed attestation (Google Play Integrity, Apple App Attest) is available ONLY to native apps distributed through app stores** — a Next.js web app, even installed as a PWA, cannot use it. That means the browser Geolocation API value is software-supplied and **mock-location tools are widely available.** Anyone who wants to submit a fake report from a fake location can trivially set `navigator.geolocation` to return whatever coordinates they like, or spoof GPS at the OS level. So the geofence stops *honest accidental* location errors and *casual* misuse, but provides ~zero resistance against the adversary Flaw 1 and Flaw 2 are worried about. The proposal is fairly honest about this ("Geolocation on a pure web app is spoofable"), but I want the Board to see the consequence clearly: **you are adding a mandatory friction (every submission must capture and pass a location check) whose security value against a real adversary is close to nil, while its cost against honest volunteers is real** (a volunteer legitimately at the edge of a zone, or reassigned mid-crisis, or reporting on behalf of someone in the next zone over, gets flagged).

Two more specific breakages:
- **Zone reassignment during a crisis is the norm, not the exception.** Crisis response is fluid — volunteers get redeployed, chase a lead into an adjacent zone, or relay a report from a colleague who has no phone. A rigid "must be near your *assigned* zone" check fights the actual operational reality. The proposal says failures are "a flag for human review, never an automatic block," which is the right call — but if every cross-zone report gets flagged, you have just created a flood of low-value flags for coordinators to triage during the busiest moments, which is its own failure mode (see Flaw 7).
- **The building block the proposal says it will reuse does not exist at the path cited.** The proposal states (twice — in `scope.in` and `resources.prerequisites`) that it will "reuse existing VE-CCS-style zone-grid in `apps/web/app/lib/geotag.ts`." **That file does not exist.** (Verified: no `geotag.ts` anywhere in the repo; the zone constants live in `apps/web/app/lib/db/seed.ts` and `coordinationSeed.ts`, and `apps/web/app/lib/coordination/match.ts` contains **no** haversine / distance / lat / lng / radius logic at all.) So the proposal's "reuse an existing working building block" is partly fiction: there is a zone *vocabulary* (VE-CCS-001..006, VE-LGU-001, VE-MAI-001/002) but there is **no coordinate-to-zone proximity function** to reuse. The current matching path uses only **Jaccard string overlap of free-text location tokens** (verified: `apps/web/app/lib/matching/engine.ts:37`). Building real server-side proximity is net-new work, and the time estimate ("2–3 weeks for geolocation-only") should be treated with suspicion until someone confirms the geo primitive is actually being written from scratch, including the spoofing-resistance heuristics.

**Impact:** A mandatory check with low real-world integrity, real honest-user friction, a flag flood, and a schedule built partly on a non-existent dependency.

**Could we fix it?** The geofence is *worth keeping as an advisory freshness/plausibility signal* — I am not asking to kill it. But it must be sold honestly as "weak, advisory, spoofable, for catching honest staleness," not as an integrity guarantee. And the missing `geotag.ts` primitive means the schedule and the "reuse existing" claim need correcting before any vote.

---

### Flaw 5: There is no volunteer account system to attach an identity to — the load-bearing prerequisite is another in-progress project

**Severity:** HIGH

**What breaks:** The entire proposal presupposes "a lightweight account record (name, org, role, assigned zone)" for volunteers. **No such system exists** (verified: only coordinators have Supabase Auth; `/api/found` and `/api/missing` are fully anonymous). The proposal acknowledges this and points at HOS-2026-001-08 ("Real auth, roles, org isolation") as the dependency — which is `in_progress`, i.e., not done.

**Why it's real:** This makes HOS-008 a proposal to build the second floor of a building whose first floor is still under construction by another crew. The time estimate even admits it: "6–10 weeks for the full face-enrollment path IF it proceeds in parallel with HOS-2026-001-08's account/roles work already in progress, longer if it has to wait." Translation: the headline number depends on a parallelization that may not hold, and on another team's unfinished work landing cleanly. Coupling a *biometric* feature (maximum blast radius if the identity model has a bug — e.g., an org-isolation flaw that lets one org see another's volunteer registry) to an *actively-changing* auth substrate is how you get a security defect at the worst possible layer.

**Impact:** Schedule risk, and — more seriously — the risk of building irreversible biometric collection on top of an auth/org-isolation model that is not yet stable or audited.

**Could we fix it?** Sequencing fixes it: no volunteer identity work — biometric or otherwise — until HOS-2026-001-08's account/roles/org-isolation model has landed and been reviewed. This is a hard ordering constraint, not a nice-to-have.

---

### Flaw 6: "Consent" is not meaningful when the alternative is "you can't help"

**Severity:** HIGH

**What breaks:** The proposal promises "explicit consent" and lists a "consent-in-a-crisis problem" in its own risks. But if face enrollment is required to obtain a role that lets someone help their community during a catastrophe, consent is coerced by circumstance. It is not freely given.

**Why it's real:** The Rohingya precedent again: **refugees who refused biometric enrollment had aid cut off in some camps.** The structural pressure is identical here — "enroll or you can't participate." The **ICRC Handbook (3rd ed., 2024) biometrics chapter** applies a strict *necessity and proportionality* test precisely because biometric data creates a permanent re-identifying record, and consent under duress fails that test. A consent checkbox does not launder a coercive structure. And note the asymmetry with the proposal's *stated* reason for existing: the goal is "fresher, more trustworthy field data." Biometric enrollment of the volunteer corps is wildly disproportionate to that goal — you do not need a face registry to know a report is fresh; you need a timestamp and a plausible location, both of which the geolocation-only path already provides.

**Impact:** A consent process that will not survive legal/ethics review, and that pressures vulnerable people into surrendering biometric data they cannot later un-surrender.

**Could we fix it?** Only by making biometric enrollment genuinely optional with a fully-equal non-biometric path — at which point, per Flaw 3's paradox, the biometric path adds risk without adding assurance and should be cut.

---

### Flaw 7: The proposal quietly re-opens a settled Board precedent — "advisory, never blocks" degrades into "flag flood the coordinators ignore"

**Severity:** MEDIUM (rising to HIGH if unaddressed)

**What breaks:** The proposal correctly commits to the established precedent — geolocation and face results are "always advisory signals a coordinator can see and override, never an automatic block" (consistent with the verified HOS-2026-002 precedent that AI/automated signals must only demote/flag, never override human judgment). Good. But it does not reckon with the *volume* consequence. Every cross-zone submission, every failed/low-confidence face match, every spoofing heuristic trip becomes a flag a human coordinator must adjudicate — **during a crisis, when coordinator attention is the scarcest resource in the entire system.**

**Why it's real:** "Advisory, human decides" is the right principle, but it silently assumes a human has spare cycles to decide. In a surge (the proposal's own edge case: "a sudden surge / viral moment"), the flag queue grows faster than coordinators can clear it, and the predictable human response is to **rubber-stamp or ignore the flags** — at which point the biometric/geo signal provides zero real safety benefit while having imposed all of its enrollment and privacy costs. This is the classic alert-fatigue failure, and it converts a well-intentioned "people decide" into "people can't keep up, so the signal is decorative."

**Impact:** The safety machinery becomes theater under load; coordinators burn out triaging false flags; genuinely suspicious submissions hide in the noise.

**Could we fix it?** Yes, but only by designing the flag economics up front: what is the expected flag rate at surge volume, who triages, what is the auto-accept policy when the queue is deep, and how do you avoid the honesty violation of a flag that silently expires unreviewed (compare the D4 finding, verified in `apps/web/app/lib/services/familyReach.ts`, where the system was caught claiming a delivery that never happened — an unreviewed-but-marked-handled flag is the same class of dishonesty). This must be answered before build, not after.

---

### Flaw 8: The stated tooling is not actually available, and the proposal treats "fastest to stand up" as if the fast path were open

**Severity:** MEDIUM

**What breaks:** The favored-by-speed option (`aws-rekognition`) leans on AWS access the project does not currently have.

**Why it's real:** Verified: **there is no AWS usage anywhere in the codebase, and the principal's local AWS credentials currently fail with `InvalidClientTokenId`** — i.e., effectively no working AWS access as of this review. The proposal notes this in passing but still frames Rekognition as "Fastest to stand up." It is not fast if the account access is dead, a DPA is unsigned, a documented legal basis does not exist, and the data must cross to `us-east-1` (a fact that itself needs the legal sign-off the proposal defers). The `azure-face` option is explicitly gated behind a Limited Access application + ethics review ("likely too slow for this timeline"). So of the four options, one is dead-credentialed + cross-border + needs a DPA, one is access-gated and too slow by the proposal's own admission, one (self-hosted InsightFace) needs a GPU host and an operator the project does not have, and one (`non-biometric-alternative`) is the option I am telling you is actually correct.

**Impact:** The "fast" biometric path is not fast; the schedule optimism is unfounded; and every biometric option carries a cross-border-data or standing-infrastructure cost that has not been paid.

**Could we fix it?** The dead credentials are rotatable, but that is the least of it — the DPA, legal basis, cross-border transfer justification, and (for self-hosted) GPU operations are all real, unpaid costs. This flaw mostly reinforces that the biometric path is heavier and slower than advertised, which further tips the scale toward geolocation-only.

---

## Assumptions We're Betting On

| Assumption | Confidence | Risk If Wrong |
| --- | --- | --- |
| A biometric registry of the volunteer corps can be kept out of the hostile state's hands | **Very Low** | CRITICAL — target list for detention/reprisal; UNHCR/Rohingya shows even professional agencies failed. Non-recoverable. |
| Volunteers can give *meaningful* (uncoerced) consent to biometric enrollment when it gates their ability to help | Low | HIGH — coercive consent fails ICRC necessity/proportionality + legal review; ethical harm. |
| Face-as-credential resists the actual adversary (a state with physical custody) | Very Low | CRITICAL — biometrics are coercible and non-rotatable; enables impersonation + coerced login. |
| A non-biometric fallback can be *both* a safe universal escape hatch *and* preserve the face gate's added assurance | Very Low (logically incompatible) | HIGH — either strands real volunteers or renders the face gate pointless. |
| Web-app geolocation provides real integrity against a motivated adversary | Very Low | MEDIUM — spoofable; buys honest-error detection only, not security. |
| Face models perform acceptably on this population + these field conditions | Low | CRITICAL — NIST FRVT 10–100x demographic error gap concentrates false lockouts on the served population. |
| The `geotag.ts` zone-grid proximity primitive already exists and is reusable | **False (verified)** | MEDIUM — it does not exist; net-new work; schedule and "reuse existing" claim are wrong. |
| HOS-2026-001-08 (volunteer accounts/roles/org-isolation) lands cleanly and in time to parallelize | Low–Medium | HIGH — biometric feature built on unstable, unaudited auth substrate. |
| Working AWS access exists for the "fast" Rekognition path | **False today (verified)** | MEDIUM — `InvalidClientTokenId`; the fast path is not currently open. |
| Coordinators will have attention to triage geo/face flags during a surge | Low | MEDIUM–HIGH — alert fatigue turns "people decide" into decorative safety theater. |

## Edge Cases We Haven't Addressed

1. **Volunteer is injured / face is bandaged / partially covered for safety** → face verification fails at the highest-stakes moment; forced onto the fallback (which then must be robust, which then obviates the face gate).
2. **Nighttime / power outage / no ambient light** (routine in a Venezuelan grid crisis) → camera capture fails → lockout or fallback.
3. **Volunteer is detained; captor points phone at their face** → state authenticates as a trusted volunteer and injects poisoned reports coordinators are told to trust.
4. **Volunteer relays a report for a colleague with no phone, from the next zone over** → geofence flags a *correct, valuable* report as suspicious; multiply by a surge = flag flood.
5. **Volunteer legitimately reassigned mid-crisis** → "near assigned zone" check fights the operational reality of fluid deployment.
6. **Mock-location app / rooted phone** → geofence returns a perfect spoofed location; the check passes while providing zero integrity.
7. **Viral surge** → enrollment queue + flag queue both exceed coordinator capacity; the system either blocks new volunteers (fails "crisis-grade") or waves everyone through (fails the whole point).
8. **Same face enrolled twice / identical twins / a volunteer who changes appearance** (weight, beard, hijab, aging) → false non-match on a real, known volunteer.
9. **Coordinator credential phished** (this project has *already* had an auth boot misconfiguration reach prod) → attacker reads the entire biometric volunteer registry.
10. **Legal process served on the `us-east-1` operator or the self-hosting provider** → biometric templates handed over lawfully; no hack required.
11. **A volunteer wants to be forgotten** (revocation/deletion) → the proposal promises a deletion policy but a face already matched at a checkpoint cannot be "deleted" from the adversary's copy; deletion is only as good as the assumption in Flaw 1, which is Very Low.
12. **Low-end phone with no front camera or a broken one** → cannot enroll at all; the proposal's own stated reason for existing (low-end phones) undercuts its chosen mechanism.

## Questions for the Proposer

1. **The fallback paradox:** If the non-biometric fallback lane is robust enough that no legitimate volunteer is ever stranded, what specific, quantified trust does the face layer add that the fallback (available to any adversary too) does not already provide? Give me a number, not a vibe.
2. **The registry-vs-goal proportionality:** The stated goal is "fresher, more trustworthy field data." Precisely which part of that goal *requires a face*, as opposed to a timestamp + device key + advisory geolocation? If the answer is "attribution to a known person," see Q3.
3. **Attribution without biometrics:** A device-bound keypair + passphrase already attributes a submission to a specific enrolled account. What does a face add over that, *other than* the coercion/impersonation risk in Flaw 2?
4. **Threat model for the registry itself:** Walk me through, concretely, how the biometric volunteer registry stays out of the current government's hands given (a) `us-east-1` hosting or a subpoena-able self-host, (b) a coordinator-credential compromise like the one that already hit prod, and (c) the UNHCR precedent where a better-resourced agency failed at exactly this. "Encryption at rest" is not an answer to (b) or a legal order.
5. **The missing primitive:** `apps/web/app/lib/geotag.ts` does not exist. What is the *actual* net-new geo work, and does the "2–3 weeks geolocation-only" estimate account for writing the coordinate-to-zone proximity function and spoofing heuristics from scratch?
6. **Flag economics at surge:** What is the projected flag rate at, say, 10x normal submission volume, who triages it, and what is the explicit policy when the queue outpaces coordinators — without recreating the D4 "marked handled but wasn't" dishonesty?
7. **Sequencing:** Will any biometric enrollment be built before HOS-2026-001-08's account/roles/org-isolation lands and is reviewed? If yes, justify building irreversible biometric collection on an unaudited, actively-changing auth substrate.
8. **Deletion under an adversary:** When a volunteer invokes the promised deletion right, what exactly is deleted, and how does that help them if the template already leaked or was lawfully compelled? If deletion cannot protect them post-compromise, say so plainly in the consent flow.

## What Would Change My Mind

On the **face-biometric path**, essentially nothing short of the threat model changing — i.e., if this were a volunteer corps in a rights-respecting jurisdiction with independent, audited data governance and genuinely optional enrollment. In Venezuela 2026, against this adversary, I do not believe there is a set of conditions that makes a centralized face registry of the resistance a proportionate, reversible, crisis-grade design. The proposal's own risk list is my witness.

On the **geolocation-only + device-key path**, I am much more open, and would move to PROCEED WITH CONDITIONS if:
- It is sold honestly as a *weak, advisory, spoofable freshness/plausibility* signal, never an integrity guarantee, always human-overridable (already promised — keep it).
- The `geotag.ts`/proximity primitive is confirmed as net-new work with a corrected estimate.
- It is sequenced *after* HOS-2026-001-08 lands and is reviewed.
- Flag economics at surge are designed up front (Q6), with no silent unreviewed-but-marked-handled flags.
- Device-key + memorable passphrase (not a face) is the authentication factor, preserving duress deniability.
- A genuine, fully-equal anonymous submission path remains for volunteers who cannot or will not enroll a device — the anonymous `/api/found` intake that exists today must not simply disappear behind a wall.

## Confidence Score

**0.88** — high confidence that the face-biometric enrollment path should be killed and the geolocation/device-key subset reshaped. Not higher because (a) I cannot see the exact operational-security posture the team can bring to bear, and there is a nonzero chance the self-hosted-vectors-only approach plus extraordinary governance could reduce residual risk more than I've credited; and (b) the surge/flag-economics and org-isolation risks depend on implementation details and another in-progress project (HOS-2026-001-08) I have not fully audited. Neither uncertainty rescues the face path — they only keep me from claiming certainty.

## Final Note

The proposal already wrote the sentence that kills its own centerpiece — "a centralized face+identity registry of the volunteer corps is a higher-value target than the HOS-2026-006 missing/found DB" — and then kept the registry anyway. Believe your own risk block: cut the face, keep an honest advisory geofence, authenticate with a device key and a passphrase the state cannot torture out of someone, and do not build any of it on top of an auth layer that isn't finished.
