import { fileURLToPath } from "node:url";
import path from "node:path";

// This file lives at tools/hos-cli/src/config.ts -> repo root is three levels up.
const here = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(here, "..", "..", "..");

// Default model for board/ops agents. Override per-run with --model.
export const DEFAULT_MODEL = "claude-opus-4-8";
