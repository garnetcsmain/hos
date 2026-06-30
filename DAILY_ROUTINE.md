# HOS Daily Routine — Executive Orchestrator

The Executive Orchestrator is an AI agent that manages HOS development day-to-day.
It reads current sprint state, picks the top priority, and executes it.

---

## Run the Daily Session

```bash
# Option 1: Claude Code (recommended)
# Open this repo in Claude Code, then say:
"Daily routine — 2026-MM-DD. Act as Executive Orchestrator for HOS."

# Option 2: hos CLI (launches claude in terminal)
npm run hos orchestrate
npm run hos orchestrate --date 2026-07-01

# Option 3: claude CLI directly
claude --system-prompt agents/prompts/ops/executive_orchestrator.md
```

The orchestrator will:
1. Read `tasks/TASKS_ACTIVE.yaml` + the backlog
2. Assess sprint health (blockers, velocity, gates)
3. Pick the single top-priority task
4. Start executing it (code, review, proposal, or board run)
5. Output an EOD update at the end of the session

---

## Board Review (Governance Step)

Before any strategic change is implemented, run the board:

```bash
# Run all 5 board agents in sequence
npm run hos run-board --proposal docs/decision-log/YYYY-MM-DD-HOS-XXX-title/proposal.yaml

# Run a single agent (e.g. to iterate)
npm run hos run-agent contrarian --proposal docs/decision-log/.../proposal.yaml
npm run hos run-agent expansionist --proposal docs/decision-log/.../proposal.yaml
npm run hos run-agent principals --proposal docs/decision-log/.../proposal.yaml
npm run hos run-agent researcher --proposal docs/decision-log/.../proposal.yaml
npm run hos run-agent user --proposal docs/decision-log/.../proposal.yaml
```

Board outputs go to `docs/decision-log/HOS-XXX-*/board/`.
After board review, the Judge synthesizes a verdict — write it to `judge_decision.yaml`.

---

## Decision Log (What Needs Board Approval)

| Decision | Status | Next Step |
|----------|--------|-----------|
| HOS-2026-001: AI Matching Engine | Proposal written | Run board review |
| HOS-2026-003: Response Coordination Hub | Proposal written | Run board review |

---

## Current Sprint Status

See `tasks/TASKS_ACTIVE.yaml` for live status.

**Sprint 2026-W27** (Jun 30 – Jul 6):
- Goal: Ship Response Coordination Hub + run HOS-2026-003 board review
- Top tasks: `003-04` (coordinate page verification) → `003-06` (board review) → `003-05` (geotag forms)

---

## Governance Ladder (Quick Reference)

| Type | Examples | Needs Board? | Authority |
|------|---------|--------------|-----------|
| Tactical | Bug fix, refactor, test | No | DEV |
| Operational | Dependency change, timeline slip | Optional | CTO/COO |
| Strategic | New feature, architecture change, new API | YES | Judge |
| Critical | Security breach, data loss | YES + Human | Judge + Human |

---

## Agent System Prompt Files

| Agent | File |
|-------|------|
| Executive Orchestrator | `agents/prompts/ops/executive_orchestrator.md` |
| Contrarian | `agents/prompts/board/contrarian_base.md` |
| Expansionist | `agents/prompts/board/expansionist_base.md` |
| Principals | `agents/prompts/board/principals_base.md` |
| Researcher | `agents/prompts/board/researcher_base.md` |
| User | `agents/prompts/board/user_base.md` |

---

## Environment Setup (Local Dev)

```bash
# .env.local (gitignored — create manually)
HOS_DEV_OPEN=1                        # Unlocks coordinator endpoints without token
HOS_AI_PROVIDERS=openai               # or: anthropic, mock
OPENAI_KEY=sk-...                     # Required for AI matching + situation briefing
GOOGLE_MAPS_API_KEY=AIza...           # Required for map proxy (or use embed fallback)
ANTHROPIC_API_KEY=sk-ant-...          # Required to run board agents via hos CLI
```

Vercel production/preview already has `OPENAI_KEY` and `GOOGLE_MAPS_API_KEY` set.
