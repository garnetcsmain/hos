#!/usr/bin/env -S npx tsx
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import dotenv from "dotenv";
import { REPO_ROOT } from "./config.js";
import { runAgent } from "./runAgent.js";
import { BOARD_AGENTS } from "./agents.js";

// Load .env from the repo root (gitignored). Never overrides real env vars.
dotenv.config({ path: path.join(REPO_ROOT, ".env"), quiet: true });

const ORCHESTRATOR_PROMPT = path.join(REPO_ROOT, "agents/prompts/ops/executive_orchestrator.md");

const HELP = `hos — Humanitarian Operations System agentic CLI

Usage:
  hos <command> [options]

Commands:
  run-agent <agent> --proposal <file>   Run a single board agent on a proposal
  run-board --proposal <file>           Run all 5 board agents in sequence
  orchestrate [--date YYYY-MM-DD]       Start the Executive Orchestrator daily session

Board agents:
  ${Object.values(BOARD_AGENTS)
    .map((a) => `${a.emoji} ${a.key}`)
    .join("   ")}

Options (run-agent / run-board):
  --proposal <file>   Path to the proposal (.yaml or .md)   [required for board cmds]
  --model <id>        Model id (default: claude-opus-4-8)
  --out <file>        Write review here (run-agent only)
  --show-thinking     Stream model reasoning to stderr
  --dry-run           Print plan without calling API
  -h, --help          Show this help

Examples:
  hos run-agent contrarian --proposal docs/decision-log/2026-06-27-HOS-001-ai-matching/proposal.yaml
  hos run-board --proposal docs/decision-log/2026-06-30-HOS-003-response-coordination/proposal.yaml
  hos orchestrate
  hos orchestrate --date 2026-07-01
`;

interface Parsed {
  command?: string;
  agent?: string;
  proposal?: string;
  model?: string;
  out?: string;
  date?: string;
  showThinking: boolean;
  dryRun: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): Parsed {
  const p: Parsed = { showThinking: false, dryRun: false, help: false };
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "-h":
      case "--help":
        p.help = true;
        break;
      case "--show-thinking":
        p.showThinking = true;
        break;
      case "--dry-run":
        p.dryRun = true;
        break;
      case "--proposal":
        p.proposal = argv[++i];
        break;
      case "--model":
        p.model = argv[++i];
        break;
      case "--out":
        p.out = argv[++i];
        break;
      case "--date":
        p.date = argv[++i];
        break;
      default:
        if (arg.startsWith("--")) {
          process.stderr.write(`unknown option: ${arg}\n`);
          process.exit(2);
        }
        positionals.push(arg);
    }
  }

  p.command = positionals[0];
  p.agent = positionals[1];
  return p;
}

async function runBoard(proposalPath: string, model?: string, showThinking = false, dryRun = false) {
  process.stdout.write(`\nRunning all board agents on: ${proposalPath}\n\n`);
  for (const agent of Object.values(BOARD_AGENTS)) {
    process.stdout.write(`─── ${agent.emoji} ${agent.label} ───────────────────\n`);
    await runAgent({
      agent: agent.key,
      proposalPath,
      model,
      showThinking,
      dryRun,
    });
    process.stdout.write("\n");
  }
  process.stdout.write("All board agents complete. Review outputs in the proposal's board/ directory.\n");
  process.stdout.write("Next step: run Judge synthesis (hos run-agent judge --proposal <file>) or review manually.\n");
}

function orchestrate(date?: string) {
  if (!fs.existsSync(ORCHESTRATOR_PROMPT)) {
    process.stderr.write(`Orchestrator prompt not found: ${ORCHESTRATOR_PROMPT}\n`);
    process.exit(1);
  }

  const today = date ?? new Date().toISOString().slice(0, 10);
  const systemPrompt = fs.readFileSync(ORCHESTRATOR_PROMPT, "utf8");

  // Check if claude CLI is available
  const claudeCheck = spawnSync("which", ["claude"], { encoding: "utf8" });
  if (claudeCheck.status !== 0) {
    // Fallback: print instructions for manual invocation
    process.stdout.write(`\nClaude CLI not found in PATH. To start the Executive Orchestrator:\n\n`);
    process.stdout.write(`  1. Open a Claude Code session in this repo\n`);
    process.stdout.write(`  2. Paste this as your first message:\n\n`);
    process.stdout.write(`  "Daily routine — ${today}. I am the Executive Orchestrator for HOS. `);
    process.stdout.write(`Read tasks/TASKS_ACTIVE.yaml and tasks/backlog/, then tell me today's focus."\n\n`);
    process.stdout.write(`  System prompt file: ${ORCHESTRATOR_PROMPT}\n`);
    return;
  }

  process.stdout.write(`\nStarting Executive Orchestrator session for ${today}...\n`);
  process.stdout.write(`System prompt: ${ORCHESTRATOR_PROMPT}\n\n`);

  // Launch claude CLI with the orchestrator system prompt
  const result = spawnSync(
    "claude",
    ["--system-prompt", ORCHESTRATOR_PROMPT, "--message",
     `Daily routine — ${today}. Read tasks/TASKS_ACTIVE.yaml and the tasks/backlog/ directory, assess current sprint health, then tell me today's single top priority and start working on it.`],
    { stdio: "inherit", cwd: REPO_ROOT, encoding: "utf8" }
  );

  if (result.status !== 0) {
    process.stderr.write(`Claude session ended with status ${result.status}\n`);
    process.exit(result.status ?? 1);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.command) {
    process.stdout.write(HELP);
    process.exit(args.command ? 0 : args.help ? 0 : 1);
  }

  switch (args.command) {
    case "run-agent": {
      if (!args.agent) { process.stderr.write(`run-agent needs an agent name.\n\n${HELP}`); process.exit(2); }
      if (!args.proposal) { process.stderr.write(`run-agent needs --proposal <file>.\n\n${HELP}`); process.exit(2); }
      await runAgent({ agent: args.agent, proposalPath: args.proposal, model: args.model, showThinking: args.showThinking, dryRun: args.dryRun, outPath: args.out });
      break;
    }
    case "run-board": {
      if (!args.proposal) { process.stderr.write(`run-board needs --proposal <file>.\n\n${HELP}`); process.exit(2); }
      await runBoard(args.proposal, args.model, args.showThinking, args.dryRun);
      break;
    }
    case "orchestrate": {
      orchestrate(args.date);
      break;
    }
    default: {
      process.stderr.write(`unknown command: ${args.command}\n\n${HELP}`);
      process.exit(2);
    }
  }
}

main().catch((err) => {
  process.stderr.write(`\n${err?.stack ?? err}\n`);
  process.exit(1);
});
