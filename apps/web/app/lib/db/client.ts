// Single SQLite connection for the whole app, using Node's built-in
// `node:sqlite` (no native build step, fully self-contained / offline).
//
// The connection is opened LAZILY — on first real use, never at module import.
// During `next build`, page-data collection evaluates the route modules across
// several parallel worker processes; if the DB were opened at import each worker
// would race to create the schema on the same file and the build would flakily
// throw SQLITE "database is locked". Deferring the open to request time means the
// build never touches the database at all. A globalThis singleton survives
// Next.js HMR so we don't leak a connection on every hot reload in development.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA_SQL } from "./schema.ts";

type Statement = ReturnType<DatabaseSync["prepare"]>;

const DB_PATH = process.env.HOS_DB_PATH ?? join(process.cwd(), ".data", "hos.db");

function createConnection(): DatabaseSync {
  if (DB_PATH !== ":memory:") {
    mkdirSync(join(process.cwd(), ".data"), { recursive: true });
  }
  const connection = new DatabaseSync(DB_PATH);
  // busy_timeout first so any concurrent writer waits for the lock instead of
  // failing; WAL lets readers and a writer coexist.
  connection.exec("PRAGMA busy_timeout = 8000;");
  connection.exec("PRAGMA journal_mode = WAL;");
  connection.exec("PRAGMA foreign_keys = ON;");
  connection.exec(SCHEMA_SQL);
  return connection;
}

const globalForDb = globalThis as unknown as { __hosDb?: DatabaseSync };

/** Open (once) and return the connection, creating it on first call. */
export function getDb(): DatabaseSync {
  return (globalForDb.__hosDb ??= createConnection());
}

/** A lazy handle to the connection: accessing any property opens the DB on
 *  first use, so call sites can keep writing `db.prepare(...)` while nothing is
 *  opened at import time. */
export const db: DatabaseSync = new Proxy({} as DatabaseSync, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
}) as DatabaseSync;

/** Prepare a statement lazily and memoize it. Safe to assign at module top
 *  level: the SQL is captured but the DB is not opened until the returned
 *  accessor is first invoked (request time, never during build). */
export function lazyStatement(sql: string): () => Statement {
  let stmt: Statement | null = null;
  return () => (stmt ??= getDb().prepare(sql));
}

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
  const conn = getDb();
  if (txDepth > 0) {
    txDepth++;
    try {
      return fn();
    } finally {
      txDepth--;
    }
  }
  conn.exec("BEGIN");
  txDepth++;
  try {
    const result = fn();
    conn.exec("COMMIT");
    return result;
  } catch (error) {
    conn.exec("ROLLBACK");
    throw error;
  } finally {
    txDepth--;
  }
}
