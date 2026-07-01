// The one database seam for the whole app. Repositories talk to `db`,
// `lazyStatement`, and `transaction` here and nothing else; which physical store
// backs them — node:sqlite for zero-setup local/dev/test, managed Postgres when
// DATABASE_URL is set — is decided here and nowhere else. That is what keeps the
// SQLite -> Postgres move (HOS-2026-001-07) a contained swap.
//
// The API is async because a real network database is async; the shapes are
// otherwise unchanged (`db.prepare(sql).get/all/run(...)`, `lazyStatement(sql)`,
// `transaction(fn)`), so the repositories read almost exactly as before.
//
// Nothing is opened at import: the backend is created and its schema ensured
// lazily on first real use. During `next build`, route modules are imported but
// no request runs, so the database is never touched (the old build-flakiness
// this avoided still can't happen). A globalThis singleton survives Next.js HMR.

import { AsyncLocalStorage } from "node:async_hooks";
import type { Backend, Row, Tx } from "./backends/types.ts";
import { SqliteBackend } from "./backends/sqlite.ts";
import { PostgresBackend } from "./backends/postgres.ts";

export type { Row } from "./backends/types.ts";

const globalForDb = globalThis as unknown as {
  __hosBackend?: Backend;
  __hosBackendInit?: Promise<Backend>;
};

/** Postgres when a connection string is configured, else zero-setup SQLite. */
function createBackend(): Backend {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
  return url ? new PostgresBackend(url) : new SqliteBackend();
}

/** Open (once) and initialize the backend. The init promise is memoized so
 *  concurrent first callers share one open + one schema-ensure. */
function backend(): Promise<Backend> {
  if (globalForDb.__hosBackend) return Promise.resolve(globalForDb.__hosBackend);
  return (globalForDb.__hosBackendInit ??= (async () => {
    const b = createBackend();
    await b.init();
    globalForDb.__hosBackend = b;
    return b;
  })());
}

/** The executor bound to the current async context: the open transaction if we
 *  are inside transaction(), otherwise the backend's auto-commit path. */
const txStore = new AsyncLocalStorage<Tx>();

async function run(sql: string, params: readonly unknown[]): Promise<Row[]> {
  const tx = txStore.getStore();
  if (tx) return tx.query(sql, params);
  return (await backend()).query(sql, params);
}

/** A prepared-ish statement. Building one does no I/O (it just captures the
 *  SQL), so it is safe at module top level; the backend opens on first execute. */
export interface Statement {
  get(...params: unknown[]): Promise<Row | undefined>;
  all(...params: unknown[]): Promise<Row[]>;
  run(...params: unknown[]): Promise<void>;
}

function prepare(sql: string): Statement {
  return {
    async get(...params) {
      return (await run(sql, params))[0];
    },
    async all(...params) {
      return run(sql, params);
    },
    async run(...params) {
      await run(sql, params);
    },
  };
}

/** Lazy statement handle. `db.prepare(sql)` also works; both defer all I/O to
 *  the execute call. */
export const db = { prepare };

/** Memoize a statement so hot paths don't rebuild the closure each call. Safe to
 *  assign at module top level. */
export function lazyStatement(sql: string): () => Statement {
  const stmt = prepare(sql);
  return () => stmt;
}

/** Run a function inside a transaction; commits on success, rolls back on any
 *  thrown error. Every identity/match/verification state change goes through
 *  here so it is atomic and audited (AGENTS.md §3).
 *
 *  Reentrant-safe: a nested call JOINs the transaction already open in this
 *  async context instead of opening a second one. The outermost call owns
 *  commit/rollback; a throw anywhere rolls back the whole unit (Board
 *  HOS-2026-002-D2). Reentrancy is tracked per async context via
 *  AsyncLocalStorage, so concurrent requests each get their own transaction. */
export async function transaction<T>(fn: () => T | Promise<T>): Promise<T> {
  if (txStore.getStore()) return fn(); // already inside a transaction — join it.
  const tx = await (await backend()).begin();
  try {
    const result = await txStore.run(tx, () => Promise.resolve(fn()));
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

/** Close the active backend and clear the singleton. For tests and graceful
 *  shutdown; the next db use opens a fresh backend. */
export async function closeDatabase(): Promise<void> {
  const b = globalForDb.__hosBackend;
  globalForDb.__hosBackend = undefined;
  globalForDb.__hosBackendInit = undefined;
  if (b) await b.close();
}

/** Which backend is active ("sqlite" | "postgres"), opening it if needed. Used
 *  by diagnostics and tests. */
export async function backendKind(): Promise<Backend["kind"]> {
  return (await backend()).kind;
}
