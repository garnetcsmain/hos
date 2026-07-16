# Contrarian Review: HOS-2026-013

## My Recommendation
🟠 RESHAPE — and split the verdict by sub-decision, because this proposal bundles the honest and useful (D5 console ergonomics, most of D2/D3) with the genre that will get someone targeted (D1 public pulse board).

- **D5 console ergonomics** → 🟢 PROCEED. Independent of the public layer, behind the existing gate. Nothing to argue with; ship it.
- **D3 onboarding to a 12-year-old bar** → 🟡 PROCEED WITH CONDITIONS, and one of those conditions is load-bearing (Flaw 5): lowering the friction to *do* things includes lowering the friction to *post a need with a real name in the free-text*, which grows the exact PII inventory the rest of the proposal is straining to keep out of the public feed.
- **D2 personal dashboards** → 🟡 PROCEED WITH CONDITIONS. The "critical banners are unfilterable" promise is a mechanism the proposal has not specified, and the shareable URL propagates a filtered worldview to people who never chose the filter (Flaw 4).
- **D4 "Ver como" switcher** → 🟠 RESHAPE. As a leak-audit tool it audits the wrong thing under honor-system auth, and the "always fetch the lower-privilege payload" guarantee is only as real as the re-fetch being server-side (Flaw 3).
- **D1 public pulse board** → 🔴 do not ship public this cycle, and do not ship the "labeled demo on the public landing" as a consolation prize (Flaws 1 and 2). The coordinator-gated version is fine; the public variant is the whole risk.

I want the conditions treated as load-bearing, not decoration.

## Fatal Flaws Found

### Flaw 1: The aggregate feed is a targeting oracle, and k≥5 + delay buckets do not neutralize it — they just change what leaks
**Severity:** 🔴 CRITICAL

**What breaks:** The proposal keeps arguing the wrong threat. It suppresses *identity* (no names, no free-text, no precise need locations) — good, necessary, table stakes. But the adversarial value of a live crisis feed under a hostile state was never "who is at this pin." It is **"which district is weakest right now, and how fast does help arrive there."** The proposal ships exactly that intelligence and calls it safe because it's aggregated.

**Why it's real:** Three concrete leaks survive k≥5 and 15-minute buckets:

1. **Composition / differencing over time.** k-anonymity is a property of a *static release*. A live feed is a *stream of releases*. An adversary who snapshots the aggregate at t₁ and t₂ and diffs them recovers the delta — and the delta is often a single event even when every snapshot individually satisfies k≥5. Rolling-window k-anonymity is not k-anonymity; it is a sequence of overlapping releases, and the standard composition attack defeats it. Nobody has to break the k-threshold on any single frame to reconstruct the underlying event stream from the frames.

2. **The suppression itself is signal.** k≥5 forces a choice for a district with few needs, and *both branches leak*. If you **suppress** below-threshold districts, then a district showing nothing while its neighbors pulse is advertising "sparse activity / no coverage here" — which is precisely "weakest district." If instead you **hold events until k accrues then batch-release**, the batch's arrival time reveals the accumulation rate. Absence is not neutral in a feed whose entire purpose is to show presence.

3. **Response cadence is the payload, not the counters.** The feed animates state transitions — need posted → assigned → confirmed — coarsened to ≥15-min buckets. Coarsening the *timestamp* does not hide the *interval*. "This district's median posted→assigned gap is 6 hours; that one's is 40 minutes" is operational tempo intelligence: when do aid orgs move, how long is the response gap, which district can be hit or have its aid intercepted during the lull. Fifteen-minute buckets are far finer than the hours-scale cadence an adversary needs.

**Impact:** This is the Operación Tun Tun problem the board named in HOS-2026-012, one layer of abstraction up: not "here is a person," but "here is when and where the system is thin." A feed built to prove the system is alive doubles as a map of where and when it is weakest. Under HOS-2026-008 (state = in-scope latent adversary, host compellable) this is the payload that matters.

**Could we fix it?** PARTIALLY, and only by being honest that k-thresholds are not the control:
- The public feed must be **event-suppressed against composition**, not just per-frame k-thresholded: no diffable running aggregates, larger time granularity (I'd argue hours, not 15 minutes — the proposer needs to defend 15 as anything but a number), and cadence/interval data must be dropped from the public payload entirely, not merely coarsened.
- The 007 gate re-review must run this specific attack (snapshot-diff + suppression-as-signal + interval leakage) as a written adversarial test, not a review sentence. The proposal lists "an explicit Contrarian pass in the gate re-review" as the mitigation — this review IS that pass, and my finding is that the mitigations as written are insufficient.
- Until a serializer demonstrably resists composition (tested, adversarial), the public variant stays dark. This is not fixable by the ~1 week of engineering the proposal budgets; it is a data-release-modeling problem.

### Flaw 2: "Labeled demo on the public landing" pre-empts the gate it claims to respect
**Severity:** 🔴 CRITICAL (as a governance breach) / 🟠 HIGH (if you only weigh the honesty cost)

**What breaks:** Option A says that *before* the 007 re-review passes, "the landing may embed the component in labeled demonstration mode (synthetic data, marked 'demostración')." The proposal treats this as the safe, gate-respecting interim. It is neither.

**Why it's real:**
- **It pre-empts the gate's actual question.** The 007 public-feed gate is not only "is the payload PII-free." It is "should a public, animated, live-pulse crisis board *exist as a genre* under a hostile state." Putting the component — same visual grammar, same motion vocabulary, same public URL — on the landing under a "demo" label answers that question in the affirmative before the board has been asked. It normalizes the artifact and trains both the public *and the adversary* on exactly what the real board will look like and where it will live. Flipping demo→live is then a one-line data-source swap, which is precisely the "side door" the proposal itself warns about for dispatch (risk: "must not become its side door"). You do not get to build the door, hang a "demo" sign on it, and call the gate respected.
- **It strains the honesty principle it invokes.** The persuasive purpose of the pulse board is "the system is alive." A *synthetic* pulse board on the public landing is decorative fake motion selling that exact impression — the HOS-2026-002-D4 line — and the "demostración" label does not survive the distribution channel the proposal itself names: WhatsApp OG-card sharing and screenshots strip the label. A screenshot of the animated demo, shared as "look, HOS is live," is a lie the system authored and cannot recall.

**Impact:** The cheapest-looking piece of D1 is the one that quietly decides the gated question and manufactures a shareable artifact that reads as real. "Labeled" is doing far more work than it can bear.

**Could we fix it?** YES, cleanly: the public landing shows **no pulse component at all** — demo or otherwise — until the gate passes. If the board wants to show outsiders that the system works before the gate, use a static, clearly-retrospective infographic (Option B's one genuinely-useful element) that makes no claim of liveness. The coordinator-gated pulse board delivers all the situational-awareness value now; the public landing loses nothing honest by waiting.

### Flaw 3: "Ver como" audits the wrong thing, and its safety guarantee is unenforceable under honor-system auth
**Severity:** 🟠 HIGH

**What breaks:** D4 is sold two ways: as a coordinator convenience and as "the cheapest standing leak-audit tool we can own." As an audit tool it has two structural holes.

**Why it's real:**
1. **Client-side filter vs. server re-fetch.** The safety claim is "preview always fetches the LOWER-privilege payload (fetch as-that-audience)." If that fetch is genuinely a server round-trip *as the lower audience*, fine. If it is instead a client-side render over data the coordinator's session already holds — the tempting, cheap implementation — then the privileged payload (names, free-text, precise locations, steward identity from HOS-2026-014) is already in the browser, and "Ver como público" is theater: it shows a filtered *view* while the sensitive *data* sits in the client bundle, one XSS or one devtools open away. The proposal's success criterion ("byte-identical to what the selected audience actually receives") is only met by a real server-side re-fetch, and the proposal does not commit to that as the *only* permitted implementation.
2. **It audits the coordinator's session, not the public's session.** "Ver como" is exercised by an authenticated coordinator. Caching keyed to auth, feature flags scoped to the coordinator's org, CDN behavior for logged-in vs. anonymous requests — any of these can make the preview render *safe* while the genuinely-anonymous public endpoint renders *unsafe*. You can pass the audit and still leak, because the audit tool never stands where the public stands.
3. **"Lower privilege" is not yet well-ordered.** The guarantee "always downgrade, never elevate" presumes a privilege lattice. HOS-2026-011 capabilities have not landed; interim auth is the shared coordinator token (honor-system). There is no *enforced* ordering for "render as X" to respect, so "Ver como" downgrading is itself an honor-system promise, not a checked invariant. The proposal is honest that it "becomes fully role-aware once HOS-2026-011 lands" — which means until then it is a role-*unaware* preview marketed as a role audit.

**Impact:** A leak-audit tool that can render "all clear" while the real public surface leaks is worse than no audit tool, because it produces documented false assurance — the same manufactured-confidence failure the board flagged in HOS-2026-009. Do not let "Ver como passed" become evidence in the 007 gate that the feed is safe.

**Could we fix it?** YES: mandate that "Ver como" is a server-side re-fetch as an *unauthenticated* client (true anonymous request path, not a filtered coordinator payload), and record that its output is a *smoke test, never proof* — the PII-free-by-construction serializer tests are the real control; the switcher is a convenience on top.

### Flaw 4: Personalization can suppress the one banner that matters, and the shareable URL spreads the suppression
**Severity:** 🟠 HIGH

**What breaks:** D2 promises "personalization must never suppress critical safety banners" and "critical banners are unfilterable." That is a requirement stated as if it were a mechanism. The mechanism is where it breaks.

**Why it's real:**
- **Who classifies a banner as "critical"?** "Mi tablero" filters by district + category. A safety banner is presumably district-scoped (an evacuation notice for District X). A user filtered to District Y only sees District X's banner *only if the system overrides the filter* — which requires every critical banner to be reliably tagged critical-and-cross-district at authoring time. If that tag is set by the coordinator writing the aviso (the people-decide layer), then a genuinely critical warning that is mis-tagged, or tagged critical-for-X, gets filtered out for exactly the users who narrowed their view — the engaged, returning users the feature is built to reward. The failure is silent: they don't see what they don't see.
- **The shareable URL propagates a filtered worldview.** I compose "Mi tablero" for District Y, encode it in a URL, and share it on WhatsApp — the proposal's named distribution channel. Everyone who opens my link inherits *my* filter. If an evacuation banner is scoped to District X, or the cross-district override fails for any of them, I have just distributed a District-Y-only view of a crisis to people who never chose to exclude District X. Personalization stops being a personal choice the moment it is shareable.

**Impact:** The whole point of an "unfilterable critical banner" is the life-safety case, and that is exactly the case where a filter-inheritance or mis-tag failure is fatal. A feature that lets a returning user (or a WhatsApp recipient of their link) miss an evacuation notice because they'd narrowed to their own district has inverted its own safety promise.

**Could we fix it?** YES, but specify it: critical/safety banners must be a **separate, unfilterable channel by construction** — rendered outside the personalizable board region, ungated by any district/category filter, and never encoded into or suppressible by the shareable URL. And critical-classification must not be author-optional for the safety tier: a life-safety banner type that is cross-district by definition, not by a coordinator remembering to tick a box.

### Flaw 5: Making it 12-year-old-easy to DO things means 12-year-old-easy to post a real name into free-text — growing the exact PII the feed must never leak
**Severity:** 🟡 MEDIUM (rising to HIGH given the companion feed)

**What breaks:** D3 extends the 12-year-old usability bar from *explaining* to *doing*, routing "Necesito ayuda" straight to a pre-filtered, one-primary-action screen. The unexamined consequence: the fastest path to "doing" for a person in crisis is **posting a need**, and today's need free-text "names real people" (the proposal's own words, the reason need.notes may never reach a public payload). Lowering friction to post is lowering friction to inject PII into the most sensitive table in the system.

**Why it's real:** Every gram of friction currently removed from the "post a need" flow is a gram removed from the accidental brake on PII intake. A 12-year-old-bar flow that says "¿Qué necesita? Escríbalo aquí" will collect free-text with names, locations, and relationships, at higher volume, from more people, faster. The public-feed defenses (Flaw 1) are all downstream *serializer* controls — they keep PII out of the *public* payload — but they do nothing about the growing inventory of PII sitting in the compellable Supabase store (HOS-2026-008: the host is legally compellable; minimization is the control that actually holds, not field encryption). D3 works against minimization at the intake.

**Impact:** The proposal optimizes the funnel that fills the single most dangerous table while the rest of the document works to keep that table off the public wire. Those two efforts are pulling in opposite directions and only one of them is named.

**Could we fix it?** YES, and cheaply: the 12-year-old "Necesito ayuda" flow must **collect the minimum by design** — structured category + district selection over free-text wherever possible, an explicit in-flow nudge in plain usted ("No escriba nombres ni direcciones exactas — solo lo que necesita"), and the same PII-minimization posture applied at *intake*, not only at *publication*. Success criterion should include "the onboarding flow does not increase free-text PII intake per need vs. the current console."

## Assumptions We're Betting On

| Assumption | Confidence | Risk If Wrong |
|-----------|-----------|---|
| "k≥5 + 15-min buckets stop the feed being a targeting oracle" | 25% | Composition/diff + suppression-as-signal + interval leakage reconstruct district weakness and response cadence; the feed becomes a where/when-we're-thin map |
| "A labeled demo on the public landing respects the 007 gate" | 20% | It pre-decides the gated question, trains the adversary on the real artifact, and ships a screenshot that reads as live |
| "'Ver como' proves the public surface is PII-free" | 30% | Audits the coordinator's session, not the anonymous one; can render 'all clear' while the real endpoint leaks |
| "Critical banners are unfilterable" (as a working mechanism) | 40% | Mis-tag or filter-inheritance hides an evacuation notice from the most-engaged users and everyone they share the URL with |
| "12-yo onboarding doesn't change PII intake" | 45% | Lower friction to post = more real-name free-text into the compellable store, against the minimization control that actually holds |
| "The pulse board honestly represents a quiet system" | 45% | Count-ups, spotlight rotation, and pulse motion dramatize a trickle into a nerve center — the HOS-002-D4 honesty line |

## Edge Cases We Haven't Addressed

1. **Feed differencing over time** → an adversary snapshotting the aggregate on a schedule reconstructs the per-event stream despite every frame satisfying k≥5.
2. **A district with one active org** → needs may clear k≥5, but the posted→assigned→confirmed cadence fingerprints that single org's operational tempo and presence hours.
3. **Viral / surge moment** → the board is designed to impress at exactly the moment the oracle is most valuable to an adversary *and* the moment low-end phones choke on continuous animation. The "impress" goal and the "degrade gracefully" goal peak in opposite directions.
4. **The quiet system** → nights, low-connectivity windows, early deployment with genuinely sparse activity: the board either looks dead (undersells, contradicting its purpose) or the motion vocabulary makes three events feel like a live nerve center (oversells — dishonest). There is no honest animation of near-zero.
5. **Screenshot laundering** → the "demostración" label does not survive a WhatsApp OG card or a screenshot; the synthetic board circulates as proof of a live system.
6. **The static fallback code path** → the "cheap static SSR snapshot" for low-end phones is a *second* rendering path. Is it also PII-free by construction and composition-resistant, or a separate serializer that could leak differently? Two paths, two chances to leak.
7. **Coordinator saved-view URL** → reuses the same shareable-URL mechanism; an accidentally-shared coordinator view leaks which districts/categories a coordinator is watching (operational interest), even with no PII in it.

## Questions for the Proposer

1. Defend "15-minute buckets" and "k≥5" against a **composition attack**: an adversary snapshots the public feed every 15 minutes for a week. Show me they cannot reconstruct the per-event stream or the per-district posted→assigned interval. If you can't, the number is decorative.
2. When you say the public landing may run a "labeled demo" before the gate — what stops that from being the gate decided by fait accompli? What is the one-line diff between demo and live, and who is allowed to flip it?
3. Is "Ver como público" a server-side re-fetch as a genuinely *unauthenticated* client, or a client-side filter over the coordinator's already-fetched payload? If the latter, the sensitive data is in the browser — is it?
4. Who tags a banner "critical/unfilterable," when, and what happens to a critical banner that is mis-tagged or scoped to a district a personalized user has filtered out — including recipients of their shared URL?
5. Does the 12-year-old "Necesito ayuda" flow collect *more* free-text PII per need than today's console, or less? What is the intake-side minimization control?
6. When the system is genuinely quiet, what does the board show — and does that representation over- or under-state reality? Show me the near-zero frame.

## What Would Change My Mind?

If you could show me:
- A serializer + release model that is demonstrably **composition-resistant** (adversarial snapshot-diff test in the gate re-review, interval data dropped not coarsened, suppression handled so absence isn't signal) → I downgrade Flaw 1 from CRITICAL.
- The public landing showing **no pulse component (not even a labeled demo)** until the gate passes, with only static retrospective infographics before then → I clear Flaw 2.
- "Ver como" specified as a **server-side unauthenticated re-fetch**, documented as a smoke test rather than proof → I downgrade Flaw 3.
- Critical banners implemented as a **separate unfilterable channel, non-suppressible via the shareable URL, with a non-author-optional life-safety type** → I downgrade Flaw 4.
- An intake-minimization design + success criterion for D3 → I downgrade Flaw 5.

...then D5 and D3 go GREEN, D2/D4 become clean PROCEED-WITH-CONDITIONS, and D1-public becomes a real gate decision on real evidence instead of a foregone conclusion.

## Confidence Score
**0.78** — I'm 78% confident in this analysis.

Why not higher? The composition/differencing severity depends on the *actual* release cadence and aggregate shape the serializer produces, which isn't built yet — a sufficiently coarse, non-diffable release could genuinely defang Flaw 1, and I can't test what doesn't exist. And the User persona's field read matters more than mine on whether the pulse board or "Mi tablero"+search is the real adoption driver; if the board isn't even the thing families use, some of my D1 heat is aimed at a feature that won't carry weight. I'm most confident on Flaws 2 and 3, which are governance and implementation invariants, not empirical bets.

## Final Note
The honest, useful two-thirds of this proposal (console ergonomics, search, onboarding, coordinator-gated situational awareness) needs none of the risk. The risk lives entirely in the public animated feed, and the proposal's own mitigations — k-thresholds, delay buckets, a labeled demo, a preview switcher — are each one level too shallow: they stop identity leaks while passing through cadence and weakness, they respect the letter of the gate while pre-deciding it, and they audit the operator's session instead of the public's. Ship the coordinator-gated board and the ergonomics now; keep the public wire dark until a release model beats a composition attack, not just a name filter.
