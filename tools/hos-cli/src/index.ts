#!/usr/bin/env -S npx tsx
import path from "node:path";
import dotenv from "dotenv";
import { REPO_ROOT } from "./config.js";
import { runAgent } from "./runAgent.js";
import { BOARD_AGENTS } from "./agents.js";

// Load .env from the repo root (gitignored). Never overrides real env vars.
dotenv.config({ path: path.join(REPO_ROOT, ".env"), quiet: true });

const HELP = `hos — Humanitarian Operations System agentic CLI

Usage:
  hos run-agent <agent> --proposal <file> [options]

Agents:
  ${Object.values(BOARD_AGENTS)
    .map((a) => `${a.emoji} ${a.key}`)
    .join("   ")}

Options:
  --proposal <file>   Path to the proposal (.yaml or .md) to review   [required]
  --model <id>        Model id (default: claude-opus-4-8)
  --out <file>        Write the review here instead of <proposal-dir>/board/<agent>.md
  --show-thinking     Stream the model's reasoning summary to stderr
  --dry-run           Resolve everything and print the plan; no API call
  -h, --help          Show this help

Examples:
  hos run-agent contrarian --proposal docs/decision-log/2026-06-27-HOS-001-ai-matching/proposal.yaml
  hos run-agent contrarian --proposal <file> --show-thinking
  hos run-agent contrarian --proposal <file> --dry-run
`;

interface Parsed {
  command?: string;
  agent?: string;
  proposal?: string;
  model?: string;
  out?: string;
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

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.command) {
    process.stdout.write(HELP);
    process.exit(args.command ? 0 : args.help ? 0 : 1);
  }

  if (args.command !== "run-agent") {
    process.stderr.write(`unknown command: ${args.command}\n\n${HELP}`);
    process.exit(2);
  }

  if (!args.agent) {
    process.stderr.write(`run-agent needs an agent name.\n\n${HELP}`);
    process.exit(2);
  }
  if (!args.proposal) {
    process.stderr.write(`run-agent needs --proposal <file>.\n\n${HELP}`);
    process.exit(2);
  }

  await runAgent({
    agent: args.agent,
    proposalPath: args.proposal,
    model: args.model,
    showThinking: args.showThinking,
    dryRun: args.dryRun,
    outPath: args.out,
  });
}

main().catch((err) => {
  process.stderr.write(`\n${err?.stack ?? err}\n`);
  process.exit(1);
});
