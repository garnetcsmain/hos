This confirms a key finding. The data model has a dedicated `sensitiveNotes` field separate from `description`, and the AI augment service correctly sends only `description` (not `sensitiveNotes`, not `reporterContact`, not `foundLocation`). So the "PII minimized before external call" claim is structurally true at the field level — good. But `description` is free-text up to 2000 chars and a reporter can put medical details, scars, conditions in it; the minimization is structural, not content-aware. That's a real but bounded finding.

I now have everything needed to write the review.

# Principals Review: HOS-2026-002

## My Recommendation (per decision)
- D1: **GREEN LIGHT (with conditions)** — Cold-start reality makes a deterministic, fully-explainable engine the *correct* first-principles choice; the 50/50 AI blend is the one overreach.
- D2: **GREEN LIGHT** — `node:sqlite` behind a repository layer is the simplest thing that satisfies every principle today; the migration debt is real but cheap and honestly named.
- D3: **RESHAPE** — The mechanism is sound, but the *dev-open-when-unset* default inverts fail-safe: absence of config silently disables the only access control. Fail closed.
- D4: **GREEN LIGHT** — In-app-only with an explicit "not delivered externally" stance is the textbook honest implementation of the trust layer; deferral is correctly scoped, not a violation.

## Key Findings

**F1 (D3) — Dev-open default is fail-open on a privileged surface. Severity: CRITICAL.**
`assertCoordinator` (auth.ts:14-22): if `HOS_COORDINATOR_TOKEN` is unset, the function returns and the request proceeds. The protection for match-review, verify, notify, and full-PII timeline endpoints is gated on the *presence* of an env var. A deploy that forgets one variable doesn't fail loudly — it silently serves precise shelter/hospital locations and lets anonymous callers confirm reunifications. This is the inverse of fail-safe design: the secure state should be the default, and *absence* of configuration should deny, not allow. The one-time `console.warn` is not a control. *If I'm wrong:* if there is a deploy-time guard elsewhere (a startup assertion that refuses to boot in production without the token), this drops to LOW. I did not find one; the check is per-request and purely env-presence-based.

**F2 (D1) — 50/50 AI blend lets an unvalidated external model move a score across the MATCH_FLOOR in either direction. Severity: HIGH.**
`blendScore` (blend.ts:25): `0.5*baseline + 0.5*meanAi*100`. A deterministic baseline of 80 with a single provider returning 0.1 yields 45 — exactly the floor. Conversely a baseline of 30 (below floor, correctly suppressed) plus an AI score of 0.9 yields 60 and surfaces a candidate the explainable engine rejected. The blend is symmetric, so the LLM has equal authority to *create* false hope as to suppress it — and it is the false-positive direction that sends a grieving family to the wrong morgue. The stated philosophy ("AI is a force multiplier, not an authority") is contradicted by the math: 50% is co-equal authority. *If I'm wrong:* if the product intent is that AI should only ever *demote* (cap blended at baseline) or only *flag for extra review* without moving rank, then the current symmetric blend is simply mis-specified and the fix is a one-line clamp. The principle that survives either way: an unvalidated model must not be able to lift a sub-floor pair into the review queue.

**F3 (D1) — Occam violation: two independent rank/persist pipelines and an ML-style version label on a hand-tuned engine. Severity: MEDIUM.**
`rankFoundForMissing` (engine.ts:184) and `persistForMissing` (matcher.ts:29-33) reimplement the identical map→filter(score≥FLOOR)→sort→slice(TOP_K) logic. Two copies of the core ranking rule will drift. Simpler: the service should call the engine's ranking function, not re-derive it. Separately, `MODEL_VERSION = "rule-engine@v1"` borrows ML-deployment vocabulary for a set of literal weights — harmless, but it invites the "trained model" mental model that D1 explicitly walked away from. *If I'm wrong:* the duplication is trivial LOC and the version string is just a provenance tag; if the team values the matcher controlling its own persistence shape, the cost is only future drift, not a present bug.

**F4 (D1) — "PII minimized before external call" is structural, not content-aware. Severity: MEDIUM.**
Genuinely good: `toPairInput` (aiAugment.ts:22-47) sends only matching fields and the domain model isolates `sensitiveNotes`, `reporterContact`, and precise `foundLocation` into fields that are *not* forwarded (types.ts:31,36,52). The claim holds at the field level. But `description` is forwarded and is free-text up to 2000 chars (schemas.ts:38); a reporter who types "diabético, cicatriz de cesárea, VIH+" into description ships that to Anthropic/OpenAI. Minimization is enforced by schema shape, not by what families actually write. *If I'm wrong:* if intake UX steers medical content into `sensitiveNotes` and description is reliably non-medical, residual risk is low. There is no guarantee of that today; the floor is "we minimized the schema," not "we minimized the content."

**F5 (D4) — Honesty layer is implemented correctly; the residual risk is human over-trust, not a code defect. Severity: LOW.**
`buildFamilyNotification` (verification.ts:34-37) literally states "Esta es una verificación humana, no una confirmación automática," contact is redacted (projections.ts:67), resolution + notification are one atomic transaction (verification.ts:65-121), and nothing claims external delivery. This is the cleanest decision in the package. The named risk ("families not reached until a channel is wired") is a *capability* gap honestly disclosed, not a *trust* violation. *If I'm wrong:* only if the UI elsewhere contradicts the notification body and implies an SMS went out — I did not see that, and the channel is hard-coded `in_app`.

**F6 (D2) — SQLite single-node ceiling is real but correctly deferred and reversible. Severity: LOW.**
WAL + `busy_timeout` + FKs + repository indirection means the Postgres swap touches adapters, not services. The debt is named in the proposal and the abstraction that pays it down already exists. First-principles: this is the *minimum* persistence that satisfies auditability (append-only event store) and crisis-grade offline fit, with the exit ramp pre-built. *If I'm wrong:* only if multiple agencies write concurrently *before* the migration — a scaling trigger, not a design flaw.

## Principle-by-Principle Ledger

| Principle | D1 Matching | D2 Persistence | D3 Identity | D4 Notifications |
|---|---|---|---|---|
| AI recommends, people decide | **ALIGNED** — candidates only; verification is the sole resolver (matcher.ts, verification.ts) | NEUTRAL | **ALIGNED** — human gate enforced at verify endpoint | **ALIGNED** — notification frames match as candidate, not confirmation |
| Information before interfaces | **ALIGNED** — explainable evidence chain on every candidate | ALIGNED — zero-setup means it actually runs | NEUTRAL | ALIGNED — correct info reaches coordinator without polish |
| Trust & honesty | **VIOLATED (partial)** — 50/50 blend lets an unvalidated model assert authority it can't justify (F2) | NEUTRAL | NEUTRAL | **ALIGNED** — explicitly disclaims external delivery (F5) |
| Data minimization | **ALIGNED structurally / WEAK on content** (F4) | NEUTRAL | **ALIGNED** — public projections strip PII (projections.ts) | **ALIGNED** — recipient redacted before storage |
| Auditability | **ALIGNED** — every suggestion + AI augment logged with model/scores (matcher.ts:55, aiAugment.ts:79) | **ALIGNED** — append-only event store is the spine | ALIGNED — verifier org/name on every decision event | **ALIGNED** — `family.notified` event emitted atomically |
| Crisis-grade | **ALIGNED at baseline** (deterministic, offline, zero-latency) / **degraded by blend** (external call adds latency + failure surface; correctly best-effort) | **ALIGNED** — offline/edge fit is the whole point of D2 | **VIOLATED** — fail-open default is not crisis-grade; a misconfig exposes PII silently (F1) | ALIGNED — works with zero providers |

**Simplest-solution check (Occam):**
- D1: The deterministic engine *is* the simplest defensible matcher for cold-start — correct. The simplification owed is internal (F3: collapse the duplicate ranking pipeline) and a constraint on the blend (F2: an unvalidated model should never *raise* a score over the floor — the simplest safe rule is "AI may flag/demote, not promote").
- D2: Already the simplest thing that works. No cut to make.
- D3: The token mechanism (constant-time compare, rate-limited, zod-validated) is appropriately simple. The *only* change is removing the dangerous convenience: unset → deny, with an explicit `HOS_ALLOW_OPEN_COORDINATOR=true` escape hatch for local dev. That is *less* surprising, not more code.
- D4: Already minimal and honest. No cut.

## Confidence Score
**0.82.**
High because the findings are grounded in the actual source, not the proposal's self-description, and the two load-bearing claims (F1 fail-open, F2 symmetric blend) are short, verifiable code facts. Not higher because: (a) I did not read the API route handlers or app startup, so I cannot fully rule out a production guard that would downgrade F1 — though the per-request env-presence check strongly implies none; (b) I did not exercise the engine against adversarial inputs, so the *calibration* of MATCH_FLOOR=45 and the hard-negative multipliers (×0.35, ×0.4) is unverified — those numbers are asserted, not validated against data (which is itself the honest cold-start admission); (c) the AI providers' real behavior (anthropic.ts/openai.ts) was not read, only the blend math that consumes them.

## What I Don't Know
- Whether any production/startup assertion refuses to boot without `HOS_COORDINATOR_TOKEN` (would change F1 severity).
- Whether intake UX actually routes medical content into `sensitiveNotes` vs. `description` (determines real F4 exposure).
- Empirical false-positive/false-negative rate of the weights and the 45 floor — unknowable pre-data, which is precisely why D1's cold-start framing is honest, but it means "crisis-grade matching quality" is currently an assertion.
- Whether the 50/50 blend ratio was deliberately chosen as co-equal or is a placeholder; the comment says "force multiplier, not authority," which the math contradicts (F2).
- How candidate scores are presented to coordinators (a raw "80%" vs. an evidence-first view materially changes the over-trust risk named in the proposal's own risk list).

Relevant files: `apps/web/app/lib/http/auth.ts` (F1), `apps/web/app/lib/ai/blend.ts` (F2), `apps/web/app/lib/matching/engine.ts` + `apps/web/app/lib/services/matcher.ts` (F3), `apps/web/app/lib/services/aiAugment.ts` + `apps/web/app/lib/domain/types.ts` (F4), `apps/web/app/lib/services/verification.ts` + `apps/web/app/lib/domain/projections.ts` (F5).
