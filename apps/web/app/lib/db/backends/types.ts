// Storage-backend contract. The repository layer talks to ONE async interface
// (see db/client.ts); concrete backends — node:sqlite for zero-setup local/dev,
// Postgres for production — implement this. Keeping the surface tiny (run one
// parameterized statement; open/commit/rollback a transaction; one-time init)
// is what makes the SQLite -> Postgres swap a contained change.
//
// Placeholders are written in SQLite style (`?`) everywhere in the repositories;
// the Postgres backend rewrites them to `$1..$n` at execution time (see sql.ts).

export type Row = Record<string, unknown>;

/** Runs one parameterized statement and returns its rows (empty for writes). */
export interface Executor {
  query(sql: string, params: readonly unknown[]): Promise<Row[]>;
}

/** A transaction bound to a single dedicated connection. The outermost
 *  transaction() owns commit/rollback; see db/client.ts. */
export interface Tx extends Executor {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/** A persistence backend: an auto-commit executor, a way to open a transaction
 *  on a dedicated connection, and idempotent schema initialization. */
export interface Backend extends Executor {
  readonly kind: "sqlite" | "postgres";
  /** Create the schema if absent. Idempotent and safe to call once per process. */
  init(): Promise<void>;
  /** Open a transaction on a dedicated connection. */
  begin(): Promise<Tx>;
  /** Release all resources (used by tests and graceful shutdown). */
  close(): Promise<void>;
}
