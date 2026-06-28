# Agentic Board — Adoption (operational as of 2026-06-28)

The governance framework in `AGENTIC_GOVERNANCE.md` / `AGENTIC_ROLES.md` is now
**operational**, not just documented. This file is the short "how we actually
work now" companion.

## What changed

- **All five board prompts exist** (`agents/prompts/board/{contrarian,
  expansionist,principals,researcher,user}_base.md`). Previously only
  `contrarian` was checked in.
- **The board has been run for real**, end to end, on the first real decision
  package: **HOS-2026-002** (Phase 0 MVP architecture). See
  `docs/decision-log/2026-06-28-HOS-002-mvp-architecture/` — `proposal.yaml`,
  five `board/*.md` reviews, `judge-decision.yaml`, and `remediation.md`.
- **CRITICAL findings were remediated in code** the same day (see
  `remediation.md`); design-level findings became tracked tasks.

## The standing rule (adopted)

- **Tactical** changes (bug fixes, refactors, tests, copy) — just do them. No board.
- **Strategic** changes (architecture, security model, a new external dependency
  that handles PII, a new user-facing capability, anything touching biometrics or
  deploy-time security) — **write a `proposal.yaml` and run the board first**, and
  record the Judge verdict in `docs/decision-log/` before the work hardens.
- **Critical** items (deploy-time security, real PII leaving the system, biometric
  data) — board **plus** a human/legal sign-off. These are listed under
  `escalate_to_human` in the Judge decision and must not ship without it.

When unsure which tier applies, default up a tier.

## How to run a board review

Two equivalent paths:

**A. The CLI (one decision, one agent at a time)**
```bash
npm install                      # once — installs tsx for the workspace
./hos run-agent contrarian   --proposal docs/decision-log/<id>/proposal.yaml
./hos run-agent expansionist --proposal docs/decision-log/<id>/proposal.yaml
./hos run-agent principals   --proposal docs/decision-log/<id>/proposal.yaml
./hos run-agent researcher   --proposal docs/decision-log/<id>/proposal.yaml
./hos run-agent user         --proposal docs/decision-log/<id>/proposal.yaml
# --dry-run resolves everything without an API call; --show-thinking streams reasoning.
```
Each review is written to `docs/decision-log/<id>/board/<agent>.md`. Needs
`ANTHROPIC_API_KEY` in the repo-root `.env` (model defaults to `claude-opus-4-8`).
Agents review **independently** — never share their drafts before the Judge, to
avoid groupthink (governance doc, "Forbidden Communication").

**B. Parallel fan-out** — the five personas run concurrently in isolation, then a
Judge synthesizes a verdict per decision. This is how HOS-2026-002 was run.

The Judge step (synthesis → `judge-decision.yaml` with GREEN_LIGHT / RESHAPE /
KILL per decision, conditions, next gate, and `escalate_to_human`) is currently a
manual/orchestrated step; the CLI runs the five board personas.

## Where the work is tracked

`tasks/TASKS_ACTIVE.yaml` is the single source of truth; per-task files live under
`tasks/backlog/<epic>/`. Board conditions that need follow-up become tasks linked
back to the decision (`decision_link:`).

## Next board item queued

**HOS-2026-006 — Facial-recognition assisted matching** (`docs/decision-log/
2026-06-28-HOS-006-facial-recognition/proposal.yaml`, status DRAFT). Do not
implement before it clears the board **and** a human/legal sign-off.
