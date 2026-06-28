// Single SQLite connection for the whole app, using Node's built-in
// `node:sqlite` (no native build step, fully self-contained / offline).
//
// A globalThis singleton survives Next.js HMR so we don't leak a new
// connection on every hot reload during development.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA_SQL } from "./schema.ts";

const DB_PATH = process.env.HOS_DB_PATH ?? join(process.cwd(), ".data", "hos.db");

function createConnection(): DatabaseSync {
  if (DB_PATH !== ":memory:") {
    mkdirSync(join(process.cwd(), ".data"), { recursive: true });
  }
  const connection = new DatabaseSync(DB_PATH);
  // busy_timeout first: during `next build`, multiple worker processes import
  // the route modules and open this same file concurrently, racing to create
  // the schema. Without a busy timeout that race throws SQLITE_BUSY; with it,
  // concurrent writers wait for the lock instead of failing the build.
  connection.exec("PRAGMA busy_timeout = 8000;");
  connection.exec("PRAGMA journal_mode = WAL;");
  connection.exec("PRAGMA foreign_keys = ON;");
  connection.exec(SCHEMA_SQL);
  return connection;
}

const globalForDb = globalThis as unknown as { __hosDb?: DatabaseSync };

export const db: DatabaseSync = globalForDb.__hosDb ?? (globalForDb.__hosDb = createConnection());

let txDepth = 0;

/** Run a function inside a transaction; rolls back on any thrown error.
 *  Used for every state change that touches identity/match/verification —
 *  per AGENTS.md, those must be atomic and audited.
 *
 *  Reentrant-safe: a nested call JOINs the open transaction instead of issuing a
 *  second BEGIN (node:sqlite rejects nested BEGIN). The outermost call owns
 *  COMMIT/ROLLBACK; a throw anywhere rolls back the whole unit. (Board
 *  HOS-2026-002-D2 condition.) */
export function transaction<T>(fn: () => T): T {
  if (txDepth > 0) {
    txDepth++;
    try {
      return fn();
    } finally {
      txDepth--;
    }
  }
  db.exec("BEGIN");
  txDepth++;
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  } finally {
    txDepth--;
  }
}
