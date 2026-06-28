// Registry of board agents. Each maps to a system-prompt file (under the repo)
// and the filename its review is written to, inside the decision's `board/` dir.
//
// Only `contrarian` currently has a prompt file checked in. The others are
// registered so the CLI knows their canonical filenames; running them errors
// with a clear message until their `<key>_base.md` prompt exists.

export interface BoardAgent {
  key: string;
  label: string;
  emoji: string;
  promptFile: string;
  outputFile: string;
}

export const BOARD_AGENTS: Record<string, BoardAgent> = {
  contrarian: {
    key: "contrarian",
    label: "Contrarian",
    emoji: "🔴",
    promptFile: "agents/prompts/board/contrarian_base.md",
    outputFile: "contrarian.md",
  },
  expansionist: {
    key: "expansionist",
    label: "Expansionist",
    emoji: "🟢",
    promptFile: "agents/prompts/board/expansionist_base.md",
    outputFile: "expansionist.md",
  },
  principals: {
    key: "principals",
    label: "Principals",
    emoji: "🧠",
    promptFile: "agents/prompts/board/principals_base.md",
    outputFile: "principals.md",
  },
  researcher: {
    key: "researcher",
    label: "Researcher",
    emoji: "📊",
    promptFile: "agents/prompts/board/researcher_base.md",
    outputFile: "researcher.md",
  },
  user: {
    key: "user",
    label: "User",
    emoji: "👤",
    promptFile: "agents/prompts/board/user_base.md",
    outputFile: "user.md",
  },
};

export function resolveAgent(name: string): BoardAgent | undefined {
  return BOARD_AGENTS[name.toLowerCase()];
}
