# HOS Agentic CLI (`hos`)

The runtime that turns the agentic governance docs into something you can
actually execute. This first slice runs a single **board agent** against a
**proposal** and saves its review to the decision log.

> This runs **locally** against the Claude API. It is not Claude Desktop and not
> Claude Code — it's a small Node/TypeScript program that calls the API
> directly, so you can run it, watch it stream, and read the output.

## One-time setup

From the repo root:

```bash
npm install                       # installs the CLI's deps (tsx, @anthropic-ai/sdk, dotenv)
cp .env.example .env              # then put your real key in .env
```

`.env` must contain `ANTHROPIC_API_KEY=sk-ant-...` (it's gitignored). The CLI
also accepts a key already exported in your shell.

## Run the Contrarian against the sample proposal

```bash
./hos run-agent contrarian --proposal docs/decision-log/2026-06-27-HOS-001-ai-matching/proposal.yaml
```

What happens:

1. Loads the system prompt from `agents/prompts/board/contrarian_base.md`.
2. Reads the proposal file.
3. Calls `claude-opus-4-8` (streaming) — the review streams to your terminal so
   you can monitor it live.
4. Saves the review to `docs/decision-log/<id>/board/contrarian.md` (next to the
   proposal), with a metadata footer.

### Flags

| Flag | Meaning |
|---|---|
| `--proposal <file>` | Proposal to review (`.yaml` or `.md`). **Required.** |
| `--model <id>` | Override the model (default `claude-opus-4-8`). |
| `--out <file>` | Write the review somewhere other than the default. |
| `--show-thinking` | Stream the model's reasoning summary to stderr while it works. |
| `--dry-run` | Resolve prompt + proposal + output path and print the plan; **no API call** (no key needed). |
| `-h`, `--help` | Usage. |

### Monitoring tips

- `--dry-run` verifies wiring (paths, prompt size) without spending tokens.
- `--show-thinking` lets you watch the reasoning, not just the final review.
- The **review** goes to stdout; **status/thinking** go to stderr. So you can
  capture just the review: `./hos run-agent contrarian --proposal <file> > review.md`.

## How it maps to the governance docs

- Agent registry → `src/agents.ts` (board agents + their prompt/output files).
- Decision-log layout → review saved at `docs/decision-log/<id>/board/<agent>.md`,
  exactly as described in `AGENTIC_SYSTEM.md`.

## Not built yet (natural next steps)

- The other board prompts (`expansionist_base.md`, `principals_base.md`,
  `researcher_base.md`, `user_base.md`) — the CLI already knows their filenames
  and will run them once the prompts exist.
- `hos board-review <proposal>` — fan out all board agents in parallel.
- `hos run-judge <decision-dir>` — synthesize the board into a decision.
