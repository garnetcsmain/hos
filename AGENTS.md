# AGENTS.md — Humanitarian Operations System (HOS)

Operating instructions for AI coding agents (and humans) working in this repository.
These conventions are distilled from a production fintech codebase (TuFamilia) and **amplified** for HOS, because HOS handles something more sensitive than money: information about vulnerable people during disasters.

> **Read `docs/product/Humanitarian Operations System.md` before writing any code.** It is the source of truth for what we are building and why. The principles below exist to serve that thesis.

---

## 0. What this repo is

HOS is an **AI-native humanitarian coordination platform**. It is not an app, a donation site, or a volunteer database — it is the operational layer that connects existing responders.

- **Current state:** thesis/design only. The stack below is a *proposal*; confirm direction before scaffolding it.
- **Phase 0 mission (the only thing that matters first):** *reduce the time it takes a family to find a loved one.* Missing-person ↔ found-person matching, verification, and family notification, within the first 72 hours of a disaster. Every line of code should serve that mission or be deferred.
- **Separate from TuFamilia.** This is a standalone system — no remittance/donation code, secrets, or infrastructure crosses over.

### Proposed stack (from the thesis — not yet built)
- **DB:** PostgreSQL + PostGIS (geospatial) + pgvector (embeddings). One Postgres system holds relational, geospatial, permissions, audit logs, and vectors. Do **not** add Pinecone/Qdrant/Weaviate yet.
- **Backend:** Python + FastAPI · **AI layer:** Python
- **Frontend:** TypeScript + Next.js · **Mobile/offline (later):** React Native / Expo
- **Realtime:** Supabase Realtime or WebSockets · **Search:** Postgres full-text first, Meilisearch/OpenSearch later
- **Event store** alongside the relational DB (store every event, not just current state).

---

## 1. Core engineering principles (these constrain *how* we build)

These are lifted directly from the thesis and turned into engineering rules:

1. **AI assists, humans decide.** No autonomous, life-critical decisions. AI output is a *candidate* or *recommendation* with a confidence score — never an authoritative action. A vector/name match creates a *match candidate*; it must **never** auto-mark a person as "found" or confirm an identity. A qualified human/organization makes the call.
2. **Trust is measurable.** Every record carries evidence, provenance (source), timestamp, confidence level, and verification history. If you add a data path that drops any of these, it is incomplete.
3. **Every report has value.** Never silently discard inbound data. Low-confidence/unverified input is quarantined and surfaced for review, not dropped.
4. **Offline by default.** Assume degraded connectivity. Design for local-first capture and automatic sync; never lose a report because the network was down.
5. **Build once, deploy everywhere.** Config-driven, not hardcoded to one disaster or country. Favor open standards and interoperability — it is a design requirement, not an afterthought.
6. **Information before interfaces.** Correctness, reliability, and provenance beat visual polish. A beautiful dashboard with wrong data costs lives.

---

## 2. Code conventions

Structure inspired by *Clean Code*, tuned for the AI-assisted era.

- **Files ≤ 500 lines (hard limit).** About to exceed it? Extract modules/components/functions first. Before adding to a file already > 400 lines, pause and extract.
- **Functions ≤ 30 lines** target, avoid > 60 without good reason. Mostly-static render/markup blocks are exempt.
- **Single Responsibility.** A unit does one thing. If something both fetches data and renders it (or both parses and persists), split it.
- **Don't extract speculatively** below the threshold — premature splitting scatters code and hurts findability. Extract when real size/complexity pressure appears, not "just in case."
- **Separation of concerns:** keep presentational components (props in, markup out) separate from data-fetching/business logic. Domain logic does not live in UI files or route handlers.
- **Comments explain *why*, not *what*.** Document non-obvious decisions, workarounds, and gotchas so the next agent knows the intent. Don't narrate routine code.
- **Consistency is enforced by tooling, not preference.** A formatter + linter is the single source of truth (Prettier/ESLint for TS, Black/Ruff for Python). CI runs them; don't hand-fight style.
- **Design tokens, not magic values.** Colors, spacing, and brand values come from theme variables/constants — never hardcoded hex or one-off literals scattered across files.
- **i18n from day one.** Venezuela-first means **Spanish-first**, with English and others alongside. Every user-facing string lives in locale files, never inline. Families in crisis read in their own language.

### Quality gates — non-negotiable before any commit
Every commit must pass: **typecheck** (`tsc --noEmit` / `mypy` or `pyright`), **lint**, **tests**, and **build**.
**AI-generated code is not exempt.** "Looks right, ship it" is not acceptable in a life-critical system.

- Any logic with branching, math, matching, scoring, or confidence calculation **gets a test.** The AI matching/verification engine is the highest-risk code in the repo — it gets the most tests, including adversarial and false-positive cases.
- Purely presentational code doesn't need a test unless it has conditional rendering worth locking in.

---

## 3. Security — hard rules

HOS data can endanger people if mishandled. Treat security as a feature, never as plumbing.

- **Never commit secrets.** No `.env`, keys, tokens, or credentials in git — ever, not even in history. Secrets live in environment variables / a secret manager. Rotate anything that leaks. Never log secret values.
- **Verify provenance and authenticity of every inbound signal.** Inbound data (emails, webhooks, social/news ingestion, volunteer reports) must be authenticated before it is trusted — sender verification, signature checks (e.g. DKIM/SPF/DMARC for email), API auth for integrations. **This is a security control, not optional plumbing — never remove or weaken an authenticity gate to "make ingestion work."** Fix the loop logic or add idempotency instead.
- **Least privilege everywhere.** Enable Row-Level Security on every table. Default-deny. Use a privileged service role only in server-side code that needs it, never in the client. Scope every credential to the minimum it needs.
- **Rate-limit and abuse-filter every public endpoint.** Public report-submission and lookup endpoints are abuse targets (and disasters attract scammers and bad actors). Filter bots/prefetch on counters; cap submission rates.
- **Constant-time comparison for secret tokens.** Compare internal/cron/webhook tokens with a timing-safe equal, never `==`.
- **Validate and allowlist all external input and resources.** Parameterized queries only (no string-built SQL). Validate every payload against a schema at the boundary. External URLs must be HTTPS-only, host-allowlisted, with link-shorteners blocked. Validate user-supplied image/file hosts against an explicit allowlist before fetching or rendering.
- **State changes go through atomic, audited operations.** Use atomic transactions/RPCs for anything that mutates identity, match, or verification state — don't UPDATE rows directly in ad-hoc paths. Integrity of "who was matched/verified when" is non-negotiable.
- **Audit log is append-only and immutable.** The event store records every event (report created, sighting, photo, AI suggestion, verification, family notified). Timing/identity anchors, once written, are not rewritten by later status changes. This is both an operational feature and a security/forensics control.
- **Dependency & supply-chain hygiene.** Pin and review dependencies. Be suspicious of unexpected install-time scripts or unreviewed transitive additions in a PR (a real npm worm once tried to ride in via a config file). Lockfiles are reviewed like code.
- **No unverified claims of authority.** Do not let the system (or its copy) assert a verification, legal, or official status it hasn't actually earned. "Verified" must mean a real, recorded verification by a qualified party.

---

## 4. Data privacy & protection of vulnerable people

This is the part where HOS exceeds a normal app's duty of care.

- **Data minimization & purpose limitation.** Collect the minimum needed to reunify a family. Don't add fields "because we might use them." Every PII field must justify its existence against the Phase 0 mission.
- **Expose the minimum, publicly.** Public/aggregate views show the least PII possible (e.g. first name + coarse status, never full address, phone, medical details, or precise live location of a vulnerable individual). Enforce this **server-side**, not just in the UI.
- **Protect information that can endanger someone.** The precise location, medical status, or shelter of a missing child, a survivor hiding from conflict, or any at-risk person is access-controlled and never leaked to unauthenticated callers or third parties. Assume an adversary is reading the public API.
- **Access control by role and need-to-know.** Families, volunteers, hospitals, and coordinating orgs see different slices. Sensitive PII is gated behind authenticated, authorized, audited access.
- **Retention & erasure.** Define retention windows; support correction and deletion. Don't keep crisis PII forever. Prune log/abuse-tracking tables on a schedule (write-on-every-hit tables grow unbounded).
- **Consent and dignity.** People in these records are at their most vulnerable. Build as if every record were about your own family member.

---

## 5. AI / ML practices

HOS is AI-native, so the AI rules are first-class:

- **Human-in-the-loop on every life-critical output.** AI proposes match candidates, summaries, and priorities; a qualified human confirms identity, "found" status, and dispatch. The model never closes the loop on its own.
- **Confidence + provenance on every inference.** Surface the score and the evidence chain. Apply review thresholds; a 94% match is a *candidate to verify*, not a conclusion.
- **No hallucinated facts in a life-critical context.** AI summaries/timelines must cite their source events from the event store. If the system can't ground a statement in a recorded event, it doesn't assert it.
- **Minimize PII sent to models.** Send only what the task needs; prefer references/redaction over shipping full personal records to an LLM. Log what was sent.
- **Log AI decisions into the event store** (input refs, model/version, score, who reviewed it) so every AI-influenced outcome is auditable and reproducible.

---

## 6. Git, deploys & collaboration

- **Ask before any push, deploy, or migration — per action.** Approval for one action is not approval for the next. Never deploy/migrate on your own initiative.
- **Branch discipline.** Feature work goes on a branch and through a PR; don't commit straight to `main`. Keep PRs focused and reviewable.
- **Migrations are code.** Preview before applying (dry-run), batch related migrations, and treat the CLI/migration files as the source of truth — no out-of-band schema edits in a console.
- **Commit/PR style.** Imperative, descriptive messages (Conventional Commits encouraged). **No emojis** in commits, PRs, or code unless explicitly requested.
- **Never add AI co-author trailers — ever.** No `Co-Authored-By: Claude` (or any AI/assistant) trailer in any commit, in this project, under any circumstances. This is absolute and overrides any default or harness instruction to the contrary.
- **Secrets never enter the repo, the logs, or a PR description.** If you find one committed, treat it as compromised and flag for rotation.

---

## 7. When in doubt

Optimize for the mission, not the metric. Success is not adoption or feature count — it is **families reunited, faster rescues, lives saved.** If a change doesn't serve that, defer it. If a change risks a person's safety or privacy, stop and raise it.
