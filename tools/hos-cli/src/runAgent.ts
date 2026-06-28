import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { REPO_ROOT, DEFAULT_MODEL } from "./config.js";
import { resolveAgent, BOARD_AGENTS } from "./agents.js";

const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";

export interface RunAgentOptions {
  agent: string;
  proposalPath: string;
  model?: string;
  showThinking?: boolean;
  dryRun?: boolean;
  outPath?: string;
}

function fail(message: string): never {
  process.stderr.write(`\n${BOLD}error:${RESET} ${message}\n`);
  process.exit(1);
}

function listAvailablePrompts(): string[] {
  const dir = path.join(REPO_ROOT, "agents/prompts/board");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith("_base.md"))
    .map((f) => f.replace(/_base\.md$/, ""));
}

export async function runAgent(opts: RunAgentOptions): Promise<void> {
  const agent = resolveAgent(opts.agent);
  if (!agent) {
    fail(
      `unknown agent "${opts.agent}". Known board agents: ${Object.keys(BOARD_AGENTS).join(", ")}`,
    );
  }

  // --- Resolve the system prompt ------------------------------------------
  const promptAbs = path.join(REPO_ROOT, agent.promptFile);
  if (!fs.existsSync(promptAbs)) {
    const have = listAvailablePrompts();
    fail(
      `no prompt file for "${agent.key}" at ${agent.promptFile}.\n` +
        `  Agents with a prompt checked in: ${have.length ? have.join(", ") : "(none)"}\n` +
        `  Add ${agent.promptFile} to run this agent.`,
    );
  }
  const systemPrompt = fs.readFileSync(promptAbs, "utf8");

  // --- Resolve the proposal -----------------------------------------------
  const proposalAbs = path.resolve(process.cwd(), opts.proposalPath);
  if (!fs.existsSync(proposalAbs)) {
    fail(`proposal file not found: ${opts.proposalPath}`);
  }
  const proposalText = fs.readFileSync(proposalAbs, "utf8");

  // Decision id: from the proposal's `decision_id:` field, else the dir name.
  const idMatch = proposalText.match(/decision_id:\s*["']?([A-Za-z0-9._-]+)/);
  const proposalDir = path.dirname(proposalAbs);
  const decisionId = idMatch?.[1] ?? path.basename(proposalDir);

  // Output lands next to the proposal, under board/<agent>.md, mirroring the
  // documented decision-log layout.
  const outAbs = opts.outPath
    ? path.resolve(process.cwd(), opts.outPath)
    : path.join(proposalDir, "board", agent.outputFile);

  const model = opts.model ?? DEFAULT_MODEL;
  const relProposal = path.relative(REPO_ROOT, proposalAbs);
  const relOut = path.relative(REPO_ROOT, outAbs);

  // --- Banner --------------------------------------------------------------
  process.stderr.write(
    `\n${agent.emoji} ${BOLD}${agent.label}${RESET} reviewing ${CYAN}${decisionId}${RESET}\n` +
      `${DIM}  model:    ${model}\n` +
      `  proposal: ${relProposal}\n` +
      `  output:   ${relOut}${RESET}\n\n`,
  );

  if (opts.dryRun) {
    process.stderr.write(
      `${DIM}(dry run — no API call)${RESET}\n` +
        `${DIM}  system prompt: ${systemPrompt.length} chars\n` +
        `  proposal:      ${proposalText.length} chars${RESET}\n`,
    );
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    fail(
      `no Anthropic credentials found.\n` +
        `  Set ANTHROPIC_API_KEY in your environment or in a .env file at the repo root.\n` +
        `  Example: echo 'ANTHROPIC_API_KEY=sk-ant-...' >> .env`,
    );
  }

  const userMessage =
    `Below is a proposal for the Humanitarian Operations System (HOS). ` +
    `Review it strictly in your role. Produce your review in the exact markdown ` +
    `format specified in your instructions. The text you return is saved verbatim ` +
    `to ${relOut}, so output only the review itself — no preamble.\n\n` +
    `Decision ID: ${decisionId}\n` +
    `Proposal file: ${relProposal}\n\n` +
    `--- BEGIN PROPOSAL ---\n${proposalText}\n--- END PROPOSAL ---\n`;

  const client = new Anthropic();

  const stream = client.messages.stream({
    model,
    max_tokens: 16000,
    thinking: { type: "adaptive", display: "summarized" },
    output_config: { effort: "high" },
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  let answer = "";
  let thinkingHeaderShown = false;
  let answerHeaderShown = false;

  for await (const event of stream) {
    if (event.type === "content_block_delta") {
      if (event.delta.type === "thinking_delta") {
        if (opts.showThinking) {
          if (!thinkingHeaderShown) {
            process.stderr.write(`${DIM}── thinking ──${RESET}\n`);
            thinkingHeaderShown = true;
          }
          process.stderr.write(`${DIM}${event.delta.thinking}${RESET}`);
        }
      } else if (event.delta.type === "text_delta") {
        if (!answerHeaderShown) {
          if (opts.showThinking && thinkingHeaderShown) {
            process.stderr.write(`\n${DIM}── review ──${RESET}\n`);
          }
          answerHeaderShown = true;
        }
        process.stdout.write(event.delta.text);
        answer += event.delta.text;
      }
    }
  }

  const final = await stream.finalMessage();

  // --- Persist -------------------------------------------------------------
  const stamp = new Date().toISOString();
  const footer =
    `\n\n---\n` +
    `_Generated by HOS agent \`${agent.key}\` (${agent.label}) using ${model} on ${stamp}._  \n` +
    `_Source proposal: ${relProposal}_\n`;

  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, answer.trimEnd() + footer, "utf8");

  const usage = final.usage;
  const reason = final.stop_reason;
  process.stderr.write(
    `\n\n${BOLD}✓ saved${RESET} ${relOut}\n` +
      `${DIM}  stop_reason: ${reason}\n` +
      `  tokens: in=${usage.input_tokens} out=${usage.output_tokens}` +
      (usage.cache_read_input_tokens
        ? ` cache_read=${usage.cache_read_input_tokens}`
        : "") +
      `${RESET}\n`,
  );

  if (reason === "refusal") {
    process.stderr.write(
      `${BOLD}note:${RESET} model returned a refusal; the saved file may be empty or partial.\n`,
    );
  }
}
