// Zero-setup backend using Node's built-in node:sqlite (no native build, fully
// offline). This is the default when no DATABASE_URL is configured — it keeps
// the "runs on a laptop with nothing installed" property that the project is
// built around, and it is what the test suite runs against.
//
// node:sqlite is synchronous and single-connection. To keep that correct once
// the repository layer is async (statements can now interleave across awaits),
// every operation runs under a tiny async mutex: an open transaction holds the
// lock for its whole lifetime, so auto-commit queries from other in-flight
// requests queue behind it instead of leaking into the open transaction. This
// reproduces the serialized behavior the old synchronous transaction() had.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA_SQL } from "../schema.ts";
import type { Backend, Row, Tx } from "./types.ts";
import { coerceParams, isWrite } from "./sql.ts";

type Conn = InstanceType<typeof DatabaseSync>;

// The value types node:sqlite accepts as anonymous bind parameters.
type SqliteValue = null | number | bigint | string | Uint8Array;

const DB_PATH = process.env.HOS_DB_PATH ?? join(process.cwd(), ".data", "hos.db");

function runOne(conn: Conn, sql: string, params: readonly unknown[]): Row[] {
  const stmt = conn.prepare(sql);
  const args = coerceParams(params) as SqliteValue[];
  if (isWrite(sql)) {
    stmt.run(...args);
    return [];
  }
  return stmt.all(...args) as Row[];
}

export class SqliteBackend implements Backend {
  readonly kind = "sqlite" as const;
  #conn: Conn | null = null;
  // Promise-chain mutex. Each acquirer awaits the previous release.
  #tail: Promise<void> = Promise.resolve();

  async init(): Promise<void> {
    if (this.#conn) return;
    if (DB_PATH !== ":memory:") {
      mkdirSync(join(process.cwd(), ".data"), { recursive: true });
    }
    const conn = new DatabaseSync(DB_PATH);
    // busy_timeout first so a concurrent writer waits for the lock instead of
    // failing; WAL lets readers and a writer coexist.
    conn.exec("PRAGMA busy_timeout = 8000;");
    conn.exec("PRAGMA journal_mode = WAL;");
    conn.exec("PRAGMA foreign_keys = ON;");
    conn.exec(SCHEMA_SQL);
    this.#conn = conn;
  }

  #db(): Conn {
    if (!this.#conn) throw new Error("sqlite backend used before init()");
    return this.#conn;
  }

  /** Acquire the mutex; returns the release function. */
  #acquire(): Promise<() => void> {
    const prev = this.#tail;
    let release!: () => void;
    this.#tail = new Promise<void>((r) => (release = r));
    return prev.then(() => release);
  }

  async query(sql: string, params: readonly unknown[]): Promise<Row[]> {
    const release = await this.#acquire();
    try {
      return runOne(this.#db(), sql, params);
    } finally {
      release();
    }
  }

  async begin(): Promise<Tx> {
    const release = await this.#acquire();
    const conn = this.#db();
    try {
      conn.exec("BEGIN");
    } catch (err) {
      release();
      throw err;
    }
    let settled = false;
    const finish = (verb: "COMMIT" | "ROLLBACK") => {
      if (settled) return;
      settled = true;
      try {
        conn.exec(verb);
      } finally {
        release();
      }
    };
    return {
      // Runs on the same held connection — no re-locking, no interleaving.
      query: async (sql, params) => runOne(conn, sql, params),
      commit: async () => finish("COMMIT"),
      rollback: async () => finish("ROLLBACK"),
    };
  }

  async close(): Promise<void> {
    // Drain the mutex so we don't close mid-statement.
    const release = await this.#acquire();
    try {
      this.#conn?.close();
      this.#conn = null;
    } finally {
      release();
    }
  }
}
