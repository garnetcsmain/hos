# Expansionist Review: HOS-2026-015

## My Recommendation
🟢 GREEN LIGHT

Everyone else is going to argue about whether the framework is "real security." Wrong axis.
The security work is already happening (it's the HOS-008 pile). What this decision actually
buys is a **passport**: a recognized name for the security posture HOS already has. In the
humanitarian sector, that passport is the difference between "an interesting solo project"
and "an instance a UN cluster is allowed to share data onto." That is a 10x lever, and it is
nearly free because the underlying work is done anyway.

## Biggest Upside
**HOS becomes onboarding-eligible as shared coordination infrastructure, not just a tool one
NGO runs.** Scale: instead of reaching families through one operator, a legible security
posture lets partner agencies (a local shelter network, a diaspora org, eventually an
ICRC/UNHCR/OCHA cluster) put *their* caseloads onto a shared HOS instance — the reach
multiplies by the number of agencies who can say "yes, their posture clears our data-sharing
bar." Timeline: the artifact exists this cycle; the first partner conversation it unlocks is
months, not years, because you're removing a *blocker* (illegibility), not building a feature.

## Domino Effects
1. **Unlocks:** a recognized security artifact (CSF 2.0 index + FIPS 199 categorization +
   800-53 control-reference list) → **Enables:** passing a partner NGO's or funder's due-diligence
   checklist without a bespoke security engagement HOS can't staff.
2. **Enables:** formal data-sharing agreements with UN coordination clusters (the whole point
   of the "cluster" model is shared situational data) → **Opens:** HOS as the reunification/
   coordination substrate *multiple* agencies read and write, i.e. a network, not a silo.
3. **Opens:** funder eligibility gated on "documented security posture" → **Compounds:** funding
   that pays for the Detect-maturity and key-custody work the proposal honestly flags as unfunded.
4. **Compounds:** every agency that adopts the shared instance makes the reunification graph
   denser → more found-persons matched to more missing-persons reports → the core mission at scale.

## Moat Opportunity
**Trust legibility as a standard.** The durable advantage isn't the code — it's being the
humanitarian reunification tool that *speaks the security language partners require* while
staying radically minimal. If HOS publishes its CSF/FIPS-199/Privacy-Framework mapping as a
reusable template ("here's how a small NGO adopts the load-bearing 20% and honestly declines
the theater 80%"), it can become the reference other small humanitarian tools copy — and the
one UN clusters already know how to evaluate. First legible mover in a field of illegible
solo tools is a real, compounding position. Crucially, the moat is *honesty-compatible*:
the same document that earns the passport also states the limit, so the trust is durable
rather than a bubble waiting to pop.

## Adjacent Opportunities
- **Cross-crisis reuse:** the categorization + control map is crisis-agnostic; the same passport
  works for the next emergency (other regions, other disaster types) with zero re-derivation.
- **Legal/counsel on-ramp:** a future pro-bono legal partner can engage a system described in a
  vocabulary they already use, lowering the cost of the key-custody/jurisdiction opinion HOS
  actually needs (HOS-008-D2) — the framework makes HOS *legible to lawyers*, not just funders.
- **Volunteer-org federation:** once org-scoped authorization lands (HOS-011), the same posture
  artifact is what lets a *new* agency self-onboard onto the shared instance safely.

## Resource Bottleneck
**Secure the partnership-legibility framing NOW, while the security artifact is being written
anyway — but write it to the framework the partners actually use.** The one input to lock in
cheaply is *which* recognized name buys the most doors: if UN/ICRC partners evaluate against
ISO 27001 + the ICRC Handbook on Data Protection (Researcher will confirm), then the artifact
should present NIST/FIPS internally but **cross-map to ISO 27001 / ICRC** for the outward-facing
passport. Mapping once, now, while the document is fresh, is near-free; retrofitting a second
framework later is not. Do not publish a NIST-only passport if the doors are ISO-shaped.

## Confidence Score
**0.74** — the upside is real and cheap, but it is *contingent on partners*, whom I can't
poll. The multiplier only fires if a partner actually onboards; a passport nobody asks to see
is still a nice-to-have. I'm also deferring to the Researcher on which framework name opens the
most doors — if it's ISO not NIST, the upside survives but the artifact must be re-shaped.

## What I Don't Know
- Whether any concrete funder or cluster is close enough to make the passport load-bearing *this*
  cycle, or whether it's optionality for later.
- Whether the shared-instance vision collides with HOS-011-D4 (is case/PII data a shared
  cross-org pool or org-partitioned?) — my "multiple agencies read/write one graph" upside may
  depend on the human answering that the pool IS shared, which is not yet decided.
