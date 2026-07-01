# Contrarian Review: HOS-2026-008-R1 (addendum, incl. role-scoping)

**Scope of this re-review (focused):** does the refined design — (a) on-device-only
face dedup at registration, (b) role-scoped OR action-scoped advisory geofencing —
genuinely eliminate the risk that drove the original unanimous KILL, and does the
role-scoping refinement introduce any *new* flaw? I do not re-litigate D2 (device-key
+ PIN login, settled GREEN) or the deferred "sensitive operations step-up" question.
I form my own judgment; the interim orchestrator note (`r1-interim-orchestrator-analysis.md`)
is context only and I diverge from it on two points below.

**What I verified before writing (read-only):**
- Face-embedding invertibility — resolved. See "Assumptions" and Flaw 2.
- qclock prior art at `/Users/noctis/Documents/Claude/Projects/qclock` — real and mature:
  `src/hooks/useGeolocation.ts` (Android cold-GPS handling, progressive high→low accuracy
  fallback, localStorage seeding, quota-safe writes) and `src/lib/geo/haversine.ts`. Confirmed.
- HOS's actual account/role state — `apps/web/app/lib/http/auth.ts` and a repo-wide grep.
  There is **no role concept in HOS today**. See Flaw 1.

## My Recommendation

**PROCEED WITH CONDITIONS** — for the **on-device dedup** half. It is a real, structural
improvement that eliminates the specific risk that drove the KILL (see below), not a
cosmetic rename of the killed design.

**RESHAPE** — for the **geofencing** half: adopt **action-scoping, not role-scoping.**
Role-scoping is not merely a slightly-worse alternative — as specified it is **unbuildable
on HOS today and reintroduces a trust-verification problem the project has no primitive to
solve.** Action-scoping is strictly simpler and closes the gaming vector by construction.

The two halves must be decoupled in the decision: the dedup work can proceed under
conditions; the geofencing reshape is blocked on a dependency that does not yet exist.

---

## Did on-device dedup eliminate the KILL risk? (the core question)

Yes — on the one dimension that actually justified the KILL. The KILL was not about
"face recognition is icky." It was specific and correct: **a server-side/persistent
face registry is a centralized, breach-able, subpoena-able target list of the volunteer
corps in a country running VenApp and Operación Tun Tun.** The refined design removes
the object of that fear: no embedding is ever transmitted to or stored by any HOS server,
so a full backend compromise, a subpoena to HOS, or a rogue HOS operator yields **zero**
biometric data. That is a genuine structural difference from the killed design. On the
"does it kill the *centralized registry*" test, R1 passes.

But "eliminated the *central* registry" is not the same as "eliminated *all* the
biometric-target risk," and the residual is concentrated in exactly the two places the
task flagged: shared devices and OS backup sync. Those are Flaws 2 and 3. They do not
resurrect the central-registry risk, but they do mean the honest label is "**decentralized,
device-local biometric residue**," not "**no biometric target exists.**" The distinction
matters for how this gets described to volunteers (Principals/honesty).

---

## Fatal Flaws Found

### Flaw 1: Role-scoping presupposes a "role" primitive HOS does not have, and its dependency is a *future follow-on*, not in-progress work
**Severity:** CRITICAL (for the role-scoping option specifically; N/A if action-scoping is chosen)
**What breaks:** The refined geofencing design says proximity checking "applies only to
roles that assert physical presence; coordinators and remote/text roles are exempt." This
requires HOS to (1) have a per-account role attribute, and (2) trust its value. **Neither
exists.** I verified in `apps/web/app/lib/http/auth.ts`: HOS auth is binary — a shared
coordinator token (fail-closed, D3) or an invite-only Supabase email allowlist. There is
no "volunteer," "translator," "moderator," or "field" role anywhere. A repo-wide grep for
`role` in schema/TS returns exactly one hit: a **marketing string** in
`apps/web/app/landing/content.ts` ("A volunteer in Caracas"). The `/api/found` and
`/api/missing` submission endpoints are **fully anonymous** — there is no account on a
submission to attach a role to in the first place.
**Why it's real:** The original Contrarian review already made this a **hard ordering
constraint**, not a nice-to-have: *"no volunteer identity work — biometric or otherwise —
until HOS-2026-001-08's account/roles/org-isolation model has landed and been reviewed."*
Worse than "in progress": the README states plainly that HOS-2026-001-08 as shipped is
only invite-only coordinator sign-in, and that **"full roles + org isolation are a
follow-on that needs Postgres."** So role-scoping doesn't ride on in-progress work — it
rides on a **follow-on to** in-progress work, on a datastore HOS doesn't run yet. Building
a role-gated geofencing exemption now means designing a security control around a role
model whose shape, storage, and org-isolation semantics are entirely unspecified.
**Impact:** Choosing role-scoping either (a) blocks all of R1's geofencing on an
unbuilt Postgres roles model, or (b) tempts someone to fake a role field just to ship,
producing an unaudited trust attribute at the identity layer — the exact "security defect
at the worst possible layer" the original review warned against.
**Could we fix it?** YES, and cheaply — **by not choosing role-scoping.** Action-scoping
(Flaw-free path below) needs no role primitive at all, so it is buildable today and
sidesteps this entire dependency. This is the single most important finding in this
re-review: the principal's stated goal (don't bottleneck remote contributors) is fully
achieved by action-scoping *without* inheriting the role dependency.

### Flaw 2: "On-device only" is silently violated by OS cloud backup — and the residue is invertible to a face
**Severity:** HIGH
**What breaks:** The whole safety argument rests on the embedding never leaving the device.
But IndexedDB/localStorage on both major platforms is, by default, **swept into
device-level cloud backup** (iCloud Backup on iOS; Google One / Android Auto Backup on
Android). The moment that happens, the "never leaves the device" invariant is false: the
embedding now sits in an Apple or Google account that can be compromised, or **compelled by
subpoena** — reconstituting, in a diffuse way, precisely the "someone outside HOS holds the
volunteer's biometric" outcome the KILL was meant to prevent. HOS never sees this happen
and cannot log it.
**Why it's real (and why it's worse than the interim note said):** The interim analysis
hedged embedding invertibility as "genuinely unverified." **It is now verified: face
embeddings are invertible.** Peer-reviewed and recent-preprint work (Idiap 2024; arXiv
2411.03960 reconstructs identifiable faces from black-box embeddings using a foundation
model trained on 42M images; 2026 diffusion/layer-based template-inversion papers do it at
higher fidelity, some in real time) establishes that a leaked embedding reconstructs a
recognizable face, not just an opaque number. So "it's only a vector, not a photo" is
**not** an adequate safety argument. A backup-synced embedding that leaks is, for
targeting purposes, a leaked face.
**Impact:** A volunteer who followed every instruction, on a stock phone with default
settings, can have a reconstructable face-template land in a cloud account outside HOS —
undetectably. In this threat model (state adversary, active informant apps) that is not a
tail risk; it is the modal phone configuration.
**Could we fix it?** PARTIAL. Browsers expose no reliable, cross-platform "exclude this
IndexedDB from OS backup" switch — reliability varies by browser and OS version, and a PWA
cannot guarantee it. Real mitigations: (a) store the embedding only in-memory / in a
deliberately non-persistent store and **discard it immediately after the dedup comparison**
— the check is a one-shot at registration, so there is no functional need to persist the
raw embedding at all; keep at most a **salted, non-invertible hash** if any persistence is
required; or (b) if any recoverable embedding is persisted, treat backup exposure as an
**accepted, documented residual** and say so to the volunteer. Option (a) is strongly
preferable and largely dissolves both this flaw and Flaw 3.

### Flaw 3: Shared shelter devices accumulate multiple people's face residue in one seizable cache
**Severity:** HIGH
**What breaks:** The design's implicit unit is "one device, one person." The User persona's
original review documented the opposite reality: shelter volunteers share **one** device
across a shift. Under on-device dedup as specified, each registration on that shared phone
**adds** an embedding to the same local cache. After a week, one seized shelter phone
exposes the face-residue of every volunteer who registered on it — a small local registry,
assembled by the mechanism that was supposed to prevent a registry. And note the cruel
irony: dedup's *entire purpose* is to compare a new registrant against previously-cached
embeddings, which **requires** retaining prior people's embeddings to function. The feature
cannot do its job on a shared device without accumulating exactly the exposure that makes
shared devices dangerous.
**Why it's real:** Shared-device use isn't hypothetical for HOS; it's the documented field
condition for shelter-based volunteers. Combined with Flaw 2, a shared phone's accumulated
cache is also the thing most likely to be backup-synced.
**Impact:** The blast radius on a shared device scales with the number of volunteers who
passed through it — turning the "device-local, small" reassurance into "small registry per
shelter phone." In a targeting context, a per-shelter volunteer list is high-value.
**Could we fix it?** YES, and it reinforces Flaw 2's fix: **do not persist raw embeddings
across registrations.** If dedup must span a shift, scope the retained comparison set to a
session that is **wiped on shift-end / logout**, and store only non-invertible hashes, never
recoverable embeddings. Equally valid: **accept that on-device dedup is meaningless on a
shared device and disable it there** — because on a shared device it cannot distinguish
"same person re-registering" from "different volunteer, same phone," which is its only job.
An explicit "shared device → dedup off, and cache cleared" path must be designed before
ship, not left implicit.

### Flaw 4: The qclock prior art lowers *build cost* but its *trust model is the opposite* of HOS's — do not let the code import the assumption
**Severity:** MEDIUM
**What breaks:** R1 leans on qclock's mature `haversine.ts` + `useGeolocation.ts` to retire
the "build geolocation from scratch" cost. The code is genuinely good and the cost relief is
real. But qclock's geolocation is **server-authoritative**: its own source says so — the
client haversine is "for the disambiguation sheet and the offsite UI; **the server is still
the authority for the punch decision**" (`haversine.ts` lines 5-6), and the punch flow
rejects low-accuracy fixes server-side (`useGeolocation.ts` lines 34-36). HOS-008's
board-mandated posture is the **exact inverse**: geolocation is **strictly advisory,
never a hard block, "device-reported, unverified."**
**Why it's real:** Importing a codebase built around "server decides in/out of geofence"
into a feature that must **never** decide anything on location is an easy way to smuggle a
hard-block back in — e.g., a `low_gps_accuracy` *rejection* path (which qclock has and HOS
must not) getting copied along with the accuracy plumbing. The prior art's ergonomics are a
gift; its enforcement stance is a trap.
**Impact:** Risk of silently reintroducing a location-based hard block — the precise thing
the original RESHAPE forbade — under the cover of "we reused proven code."
**Could we fix it?** YES. Port the *acquisition* layer (cold-fix handling, progressive
fallback, error taxonomy) and explicitly **strip every enforcement/rejection branch.** Add a
test asserting HOS never returns a location-based rejection. Cheap, but must be a named
condition or it will be forgotten.

### Flaw 5: Does role-scoping vs action-scoping actually close the gaming vector? Only action-scoping does.
**Severity:** MEDIUM (this is the "new flaw introduced by the refinement" the re-review asked me to isolate)
**What breaks:** Under **role-scoping**, "remote/translator = exempt from geofencing" is a
**self-declared, unverified** attribute (HOS has no way to verify it — Flaw 1). A field
volunteer who wants to dodge the location check simply self-labels "remote." The exemption
is a checkbox the adversary controls.
**Why it's real, and why action-scoping is categorically different:** Action-scoping asks
"**does this specific submission assert a physical location?**" A translation edit or a
text-only report has **no location field** — there is nothing to exempt because there was
never a claim to check. You cannot "falsely claim remote" to escape a check on a report type
that structurally has no location to verify. The gaming vector isn't mitigated; it **ceases
to exist**, because the check follows the *claim*, not a *self-asserted identity attribute*.
This also cleanly handles the sometimes-remote/sometimes-field bilingual volunteer, who
fits no fixed account role but whose *individual submissions* are unambiguously either
location-bearing or not.
**Impact:** Role-scoping leaves an adversary-controlled bypass on a (soft) trust signal.
Action-scoping removes it structurally.
**Could we fix it?** YES — choose action-scoping. Caveat that keeps me honest: action-scoping
only *fully* closes the vector if a "location claim" is inferred from the **submission's
content/type**, not from an attacker-supplied "this is a remote report" flag. If the client
can set a boolean that suppresses the location prompt, you've just renamed the role bypass.
The location-bearing-ness of a report must be a property of *what kind of report it is*
(found-person-at-a-place vs. text/translation), determined server-side, not a
caller-toggleable field. Make that explicit or the win evaporates.

---

## Assumptions We're Betting On

| Assumption | Confidence | Risk If Wrong |
|---|---|---|
| Face embeddings are opaque/non-invertible ("just numbers") | **REFUTED** | HIGH — a leaked/backed-up embedding reconstructs a recognizable face (Idiap 2024; arXiv 2411.03960; 2026 diffusion inversion). Treat any persisted embedding as a persisted face. |
| Browser storage stays on-device by default | **FALSE by default** | HIGH — iCloud/Google backup sweeps it into a compellable cloud account (Flaw 2). |
| "One device, one person" | False for shelters | HIGH — shared phones accumulate multi-person residue (Flaw 3). |
| HOS has (or imminently will have) a trustworthy per-account role | **FALSE** | CRITICAL for role-scoping — no role primitive exists; the roles model is a Postgres follow-on, not in-progress (Flaw 1). |
| "Never transmitted" holds in the built artifact | Unproven until tested | MEDIUM — must be an enforced network-audit invariant, not a code comment (D4 precedent: don't claim what you didn't verify). |
| qclock's geolocation trust model transfers to HOS | **FALSE** | MEDIUM — qclock is server-authoritative; HOS must be advisory-only. Reuse the code, not the stance (Flaw 4). |
| A "remote" exemption can't be gamed | Only under action-scoping | MEDIUM — role-scoping = adversary-controlled checkbox; action-scoping removes the vector (Flaw 5). |

## Edge Cases We Haven't Addressed

1. Shared shelter phone, shift change → whose embeddings are in the cache, and are they wiped? (Flaw 3) → undefined behavior = silent multi-person registry.
2. Volunteer enables/already-has iCloud or Google backup → embedding leaves device with no HOS signal. (Flaw 2)
3. Bilingual volunteer, remote most days, occasionally in the field → fits no fixed role; only action-scoping handles them. (Flaw 5)
4. Client-supplied "this is a remote submission" flag → renamed role bypass; location-claim must be server-inferred from report type. (Flaw 5 caveat)
5. Copy-paste of qclock's `low_gps_accuracy` *rejection* branch → accidental hard block HOS forbade. (Flaw 4)
6. Same person, second phone → dedup does not catch it (acknowledged non-goal; fine, but must be stated to coordinators so dedup isn't oversold as "one human = one account").
7. Private-mode / storage-cleared browser → dedup silently no-ops (cache empty every time). Acceptable, but means dedup is best-effort, not a guarantee — label accordingly.

## Questions for the Proposer

1. **Why persist the raw embedding at all?** Dedup is a one-shot registration check. If you
   compare-then-discard (or keep only a salted non-invertible hash), Flaws 2 and 3 largely
   dissolve. What breaks if nothing recoverable is ever written to disk?
2. On a **shared** shelter device, what is the defined lifecycle of the cache — wiped on
   logout/shift-end, or persistent? If persistent, do you accept a per-shelter multi-person
   face registry?
3. Are you choosing **role-scoping or action-scoping**? If role-scoping, how do you build it
   before HOS-2026-001-08's Postgres roles/org-isolation follow-on exists, and how do you
   trust a self-declared role? (I recommend action-scoping precisely to make this question moot.)
4. Under action-scoping, is "does this report assert a location?" inferred **server-side from
   report type**, or set by a **client-supplied flag**? (The latter reopens Flaw 5.)
5. How is "never transmitted" **proven** — is there a network-request audit / test that fails
   the build if the embedding hits the wire, per the D4 honesty precedent?
6. When porting qclock, do you commit to **stripping every location-based rejection branch**
   and adding a test that HOS never blocks on location?

## What Would Change My Mind?

- **On dedup → from CONDITIONS toward PROCEED:** compare-then-discard (no recoverable
  embedding persisted, hash-only if anything), an explicit shared-device wipe/disable path,
  and a passing "no embedding leaves the device" network-audit test. Do those three and Flaws
  2 and 3 are substantially retired.
- **On geofencing → toward PROCEED:** adopt **action-scoping** with the location-claim
  inferred **server-side from report type** (not a client flag), and port qclock's acquisition
  layer with all rejection branches stripped. That closes Flaw 5 by construction and moots
  Flaw 1 entirely.
- **What would NOT change my mind:** shipping **role-scoping** before a real, reviewed roles
  model exists, or persisting a recoverable embedding on the theory that "it's just a vector."
  The invertibility literature closes that door.

## Confidence Score

**0.72** — Higher than the interim note's 0.6 on the two questions it couldn't research
(invertibility and prior-art), because I resolved both: embeddings **are** invertible
(raises the bar on persistence) and the qclock prior art **is** real but server-authoritative
(lowers build cost, doesn't transfer the trust model). Not higher than 0.72 because the two
highest-severity residuals — OS backup sync and shared-device accumulation — depend on
concrete implementation decisions (persist vs. discard; shared-device lifecycle) that are not
yet made, and role-scoping's viability hinges on a Postgres roles model that does not exist.
I can't rate a design higher than the decisions it hasn't made yet.

## Final Note

On-device dedup genuinely kills the *central-registry* risk that drove the KILL — approve it,
but only in the **compare-then-discard, hash-if-anything, shared-device-aware** form, or you
re-import a decentralized biometric target via cloud backup and shared shelter phones. On
geofencing, do **not** take the role-scoping path: it's unbuildable on HOS today and hands the
adversary a self-declared exemption checkbox — **action-scoping is simpler, buildable now, and
closes the gaming vector by construction.**
