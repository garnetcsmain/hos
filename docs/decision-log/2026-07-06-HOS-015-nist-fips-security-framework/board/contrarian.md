# Contrarian Review: HOS-2026-015

## My Recommendation
🟡 PROCEED WITH CONDITIONS

The proposal is unusually self-aware — it pre-declines FIPS 140-3, pre-labels the
false-assurance risk, and pre-scopes 800-53 as a "reference namer." That deflates most
of my usual attack surface. So I am not here to kill it. I am here to name the one thing
a framework-adoption move like this always does if you let it: **produce a security
narrative that outruns the security reality.** Two-thirds of "adopt NIST/FIPS" is
re-labeling; I need the record to make crystal-clear which one-third is load-bearing.

## Fatal Flaws Found

### Flaw 1: "NIST/FIPS-aligned" is a claim a partner will over-read, and the record must physically prevent it
**Severity:** 🟠 HIGH

**What breaks:** The moment HOS can point a funder or an ICRC partner at "we're CSF 2.0 /
FIPS 199 / 800-63 aligned," someone — a partner, a journalist, or *us* on a tired day —
will treat that as "the data is safe." It is not. The apex threat (HOS-008-D1, answered
YES) is lawful compulsion of a foreign-hosted Supabase/Vercel stack, and **nothing in this
proposal touches that.** The proposal knows this (context.user_impact, risk #2) but knowing
is not the same as structurally preventing.

**Why it's real:** This is the exact failure the HOS-008 judge already ruled on — "a
protection we claim but do not deliver is the same failure as a delivery we claim but do
not make, applied to safety." A named framework is a *bigger* megaphone for that claim than
ad-hoc security ever was. The risk grows with the legibility the Expansionist wants.

**Impact:** A partner shares beneficiary data onto a HOS instance believing "NIST-aligned"
means state-resistant; the host is compelled; people in hiding are exposed. The framework
that was supposed to build trust becomes the instrument of a betrayal of it.

**Could we fix it?** YES. The proposal's success_criterion #5 (the complement-not-substitute
statement) must be a **hard gate, not a nice-to-have**: no artifact HOS shows externally
(the CSF index, the 800-53 control list) may omit the one-sentence limit — "NIST/FIPS
alignment is our hygiene floor and shared vocabulary; it does NOT defend against legal
compulsion of the host, which is addressed only by data minimization, non-retention, and
key custody outside the compellable jurisdiction." Put it in the artifact template, not
just the proposal.

### Flaw 2: Coordinator "AAL2" is AAL2-in-name until three things that don't exist today are built
**Severity:** 🟠 HIGH

**What breaks:** The proposal lists "coordinator AAL2 (MFA)" as an ADOPT-NOW, low-cost win.
But I read the code. `auth.ts` today is a **shared** `HOS_COORDINATOR_TOKEN` compared in
constant time (auth.ts:22-46) — that is not AAL1, it is *no per-person identity at all*.
The Supabase path exists (`requireCoordinator`, auth.ts:66-79) but MFA is not enabled, and
even with MFA on, "every coordinator action attributed to a person" requires retiring the
shared token as anything but break-glass — which is HOS-2026-001-08, still `in_progress` and
partially blocked. So "AAL2 now" is really "AAL2 after 001-08's attribution work lands."

**Why it's real:** Calling it a hours-to-a-day config win understates it. Enabling TOTP in
Supabase is a day; making coordinator actions *actually attributable to a person* (the thing
AAL2 is for) is gated on the same per-user-identity work that has been in progress for a week.

**Impact:** If we report "coordinators at AAL2" while the shared break-glass token still
works and actions still say `coordinator:<org>` not `coordinator:alice`, we have overstated
identity assurance in exactly the log a forensic investigation would rely on.

**Could we fix it?** YES. Split the item honestly: "enable Supabase MFA" (ship-now, real) vs
"per-person attribution / retire shared token to break-glass" (sequenced with HOS-001-08,
NOT claimable as done until it lands). Do not report AAL2 achieved until both hold.

### Flaw 3: The ONE genuinely new, load-bearing security control is buried as item #4
**Severity:** 🟡 MEDIUM (elevated because it's the real thing)

**What breaks:** Strip the re-labeling and the escalations, and the net-new *security*
(not vocabulary) in this proposal is: (a) the Postgres TLS fix, (b) the AGENTS.md crypto
rule (which the audit says has zero current violations — so it locks in a good state, it
doesn't fix a bad one), (c) coordinator MFA (Flaw 2), and (d) an IR runbook. Of these, the
**TLS fix is the only one closing an actually-open hole** — and I confirmed it is real and
*worse than the proposal says*.

**Why it's real:** `sslConfig()` in `postgres.ts` returns `{ rejectUnauthorized: false }`
not only on the default hosted fall-through (line 28) but **also when the operator explicitly
sets `HOS_PG_SSL=require` (line 24)**. The comment literally says "don't hard-fail
verification." So an operator who does the responsible thing and asks for `require` STILL
gets TLS with no peer authentication — MITM-able against the Supabase pooler. The proposal
frames this as a minor item #4; it is the single concrete vulnerability in the whole packet.

**Impact:** On the day a real `DATABASE_URL` lands (HOS-001-07), every query runs over a
channel an on-path attacker can intercept or alter, defeating SC-8 for the most sensitive
table set. It's latent only because Postgres isn't deployed yet.

**Could we fix it?** YES — cheap: pin the Supabase root CA and set `rejectUnauthorized: true`
for all remote modes; keep `false` only for verified-localhost. This should be flagged as the
proposal's highest-priority *code* action, not its fourth.

## Assumptions We're Betting On

| Assumption | Confidence | Risk If Wrong |
|---|---|---|
| Adopting NIST/FIPS won't balloon into a compliance project | 75% | Second heavy initiative displaces unfinished Phase 0 — the HOS-007/008 failure mode, now with a certification gravity well |
| "NIST-aligned" won't be mis-sold as state-resistant | 55% | A partner over-trusts the label and shares data that gets someone exposed (Flaw 1) |
| Coordinator MFA is a same-day win | 60% | Real attribution is gated on HOS-001-08; "AAL2 now" is optimistic (Flaw 2) |
| US-federal NIST/FIPS is the framework that buys UN/ICRC legibility | 50% | Humanitarian partners speak ISO 27001 + ICRC Handbook, not FIPS — see Researcher |

## Edge Cases We Haven't Addressed

1. A funder asks "are you FIPS 140-3 validated?" (a common procurement checkbox) → our answer
   is "no, deliberately" — is that framed so it reads as a *considered* decline, not a gap?
2. We publish an 800-53 control-reference list; an auditor reads it as a *claim of compliance*
   with those controls at Moderate baseline → we've implied a baseline we explicitly declined.
3. The crypto rule lands in AGENTS.md but there is no CI check enforcing it → next year someone
   adds `Math.random()` for a token and no gate catches it. Naming ≠ enforcing.

## Questions for the Proposer

1. Will success_criterion #5 (complement-not-substitute) be embedded in every externally-shown
   artifact, or only in this proposal file that no funder will read?
2. Are you willing to split "coordinator AAL2" into MFA-on (now) vs attribution (with 001-08),
   and NOT report AAL2 as achieved until both land?
3. Why is the TLS peer-auth fix item #4 and not item #1, given it is the only open hole here?
4. Is there any CI/review enforcement planned for the AGENTS.md crypto rule, or is it aspirational?

## What Would Change My Mind

If you (a) make the honesty statement a template-level gate on external artifacts, (b) split
the AAL2 item honestly, and (c) reprioritize the TLS fix as the lead code action — I raise my
confidence in a good outcome from 0.70 to 0.85. None of these is expensive; all three convert
"framework paperwork" into "framework plus the one fix that mattered."

## Confidence Score
**0.72** — I'm 72% confident in this analysis.

Why not higher? I can't see the funders' actual procurement requirements (Flaw 1 / edge case 1
severity depends on them), and I'm inferring the ISO-vs-NIST legibility point that the
Researcher should confirm or refute.

## Final Note
This is a *good* proposal that is 90% honest about being mostly re-labeling. My whole job is
the other 10%: make the honesty guardrail load-bearing, don't let "AAL2" outrun the code, and
promote the one real fix (TLS peer auth) out of the footnotes. Do that and I have no fatal flaw.
