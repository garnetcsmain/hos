# Daily Routine — Executive Orchestrator

How the HOS Executive Orchestrator is invoked once per day, what it reads, how it picks
the day's focus, and the board commands it uses. This is the operational companion to
the role definition in
[`agents/prompts/ops/executive_orchestrator.md`](agents/prompts/ops/executive_orchestrator.md)
and the lifecycle in [`TASK_MANAGEMENT.md`](TASK_MANAGEMENT.md).

The orchestrator runs in an ephemeral cloud sandbox: the repo is cloned fresh each run,
there is **no `ANTHROPIC_API_KEY`**, and nothing survives the run except what is
committed and pushed to a branch and opened as a PR.

---

## The five steps

### Step 1 — Load the role

Read [`agents/prompts/ops/executive_orchestrator.md`](agents/prompts/ops/executive_orchestrator.md).
That file is the orchestrator's system prompt: identity, authority (strategic vs.
tactical), decision framework, and output format. Follow it exactly.

### Step 2 — Read current state (in order)

1. [`tasks/TASKS_ACTIVE.yaml`](tasks/TASKS_ACTIVE.yaml) — sprint status, every epic,
   every task, all active blockers and risks. The single source of truth for state.
2. [`TASK_MANAGEMENT.md`](TASK_MANAGEMENT.md) — the task lifecycle and governance model.
3. This file — the invocation guide and board commands.
4. `git log --oneline -8` — what shipped recently.
5. Glob `tasks/backlog/` and `docs/decision-log/` for untracked work or pending
   proposals.
6. **List the open PRs** (see [Checking the PR queue](#checking-the-pr-queue-do-this-before-picking))
   — this step is not optional; skipping it is how redundant work gets shipped.

Summarize sprint status in one short table (epic, progress, blockers).

### Step 3 — Assess and pick today's focus

Follow the orchestrator decision framework (role doc §3): pick the **single
highest-value UNBLOCKED task**, preferring **overdue gates > tasks that unblock others >
Judge-condition commitments > `in_progress` continuation**. State the task id and a
one-sentence rationale before doing anything.

### Step 4 — Execute the work

Do it, by task type (role doc §4): CODE, BOARD REVIEW, PROPOSAL, or DOCS. For CODE,
verify with a clean `npm run build:web`, `npm test -w @hos/web`, and `npm run
check:crypto` from the repo root.

### Step 5 — Record and deliver

1. Update `tasks/TASKS_ACTIVE.yaml` (status, progress %, EOD standup note).
2. Open **one focused** PR targeting `main`.
3. End the run with: completed today, in progress, blockers surfaced, and
   "Next session should start with: …".

---

## Checking the PR queue (do this before picking)

Because the sandbox is ephemeral and `main` only advances when a human merges, a task
stays `todo` in `tasks/TASKS_ACTIVE.yaml` until its PR lands. If each daily run re-picks
the top `todo` task without checking what is already in flight, **multiple runs
implement the same task and the open-PR queue fills with redundant, conflicting PRs.**
This has happened. Prevent it:

```
# List open PRs (via the GitHub MCP tools available in-session):
#   list_pull_requests(owner="garnetcsmain", repo="hos", state="open", minimal_output=true)
```

Then, before committing to a pick:

- **If an open PR already implements the task, do not re-implement it.** Move to the
  next genuinely un-attempted item.
- **If several open PRs implement the same task**, that redundancy is itself a signal —
  surface it to the human rather than adding another copy.
- **If an open PR is now obsolete** (its task was completed by a different merged
  commit), note it so the human can close it.
- Prefer a task that no open PR touches. New, non-overlapping value beats a ninth
  attempt at an already-attempted slice.

The orchestrator cannot merge on the human's behalf (merging is the human's call, and
the standing constraint is "open a PR; never push directly to `main`"). What it can do
is keep each day's work **additive and distinct**, and flag the backlog.

---

## Board review commands

A strategic decision (new feature, architecture change, new external dependency) needs a
five-persona board review plus a Judge verdict before any code.

### Preferred: the `hos` CLI

```bash
# From the repo root. Requires ANTHROPIC_API_KEY (present in a real environment,
# NOT in the daily sandbox).
npm run hos -- run-agent contrarian    --proposal docs/decision-log/<dir>/proposal.yaml
npm run hos -- run-agent expansionist  --proposal docs/decision-log/<dir>/proposal.yaml
npm run hos -- run-agent principals    --proposal docs/decision-log/<dir>/proposal.yaml
npm run hos -- run-agent researcher    --proposal docs/decision-log/<dir>/proposal.yaml
npm run hos -- run-agent user          --proposal docs/decision-log/<dir>/proposal.yaml

# Useful flags: --dry-run (resolve + print the plan, no API call),
#               --show-thinking, --out <file>.
```

Each agent writes its review to `docs/decision-log/<dir>/board/<agent>.md` by default.

### In the sandbox: native in-session review

The daily sandbox has **no `ANTHROPIC_API_KEY`**, so do **not** shell out to the CLI.
Perform the review natively instead:

1. For each of the five agents, read its persona at
   `agents/prompts/board/<agent>_base.md` (`contrarian`, `expansionist`, `principals`,
   `researcher`, `user`), adopt that persona fully, and write its review to
   `docs/decision-log/<decision-dir>/board/<agent>.md` in the mandated output format.
2. Synthesize a Judge verdict (`GREEN_LIGHT | RESHAPE | KILL`, with binding conditions
   and any `escalate_to_human`) to
   `docs/decision-log/<decision-dir>/judge_decision.yaml`. Match the shape of existing
   `judge_decision.yaml` files in the decision log.

A `RESHAPE` typically clears a narrow honest slice to build now and withholds the rest
behind a named gate — implement only the cleared slice, and carry the gate forward.

---

## Guardrails (summary — full list in the role doc §7)

- One focused PR per run, targeting `main`. Never push to `main`/`development` directly.
- Never mark a task `done` unless `npm run build:web` is clean and tests pass.
- No emoji in commits, PR titles/bodies, code, or docs. No `Co-Authored-By: Claude`
  trailer, ever.
- Never touch production secrets, deploys, or migrations. `OPENAI_KEY` and
  `GOOGLE_MAPS_API_KEY` live in Vercel env, not in the repo.
- Strategic change → board proposal + Judge verdict before code. Tactical fix
  (bug/test/refactor/docs) → straight to work.
- If no meaningful, safe improvement can be made today, say so and stop. Never produce
  busy work.
