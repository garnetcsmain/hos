// Production backend: managed Postgres (Supabase / Neon / any DATABASE_URL) via
// node-postgres. Selected automatically whenever DATABASE_URL is set. Gives the
// multi-instance writes, managed backups/HA, and pgvector readiness that SQLite
// can't (HOS-2026-001-07, Board D2).
//
// Connection notes for serverless (Vercel): point DATABASE_URL at Supabase's
// transaction-mode pooler (…pooler.supabase.com:6543) so each function instance
// shares connections instead of exhausting the direct-connection limit.

import pg from "pg";
import { PG_SCHEMA_SQL } from "../schema.pg.ts";
import type { Backend, Row, Tx } from "./types.ts";
import { coerceParams, toPgPlaceholders } from "./sql.ts";

const { Pool } = pg;

// Advisory-lock key so concurrent cold-starting instances serialize schema init
// (CREATE ... IF NOT EXISTS can still race on the system catalog otherwise).
const SCHEMA_LOCK_KEY = 4207530001;

function sslConfig(connectionString: string): pg.PoolConfig["ssl"] {
  const mode = (process.env.HOS_PG_SSL ?? "").toLowerCase();
  if (mode === "disable" || /sslmode=disable/.test(connectionString)) return false;
  if (mode === "require") return { rejectUnauthorized: false };
  // Local Postgres needs no TLS; anything else (hosted) does. Supabase presents
  // a chain Node may not have a root for, so don't hard-fail verification.
  if (/@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(connectionString)) return false;
  return { rejectUnauthorized: false };
}

export class PostgresBackend implements Backend {
  readonly kind = "postgres" as const;
  #pool: pg.Pool;

  constructor(connectionString: string) {
    this.#pool = new Pool({
      connectionString,
      ssl: sslConfig(connectionString),
      max: Number(process.env.HOS_PG_POOL_MAX ?? 10),
      // Fail fast on a bad host rather than hanging a request.
      connectionTimeoutMillis: Number(process.env.HOS_PG_CONNECT_TIMEOUT_MS ?? 10_000),
    });
  }

  async init(): Promise<void> {
    const client = await this.#pool.connect();
    try {
      // A TRANSACTION-scoped advisory lock (auto-released at COMMIT/ROLLBACK) so
      // concurrent cold-starting instances serialize schema creation. Transaction
      // scope is required to work through Supabase's transaction pooler, which
      // does not keep a session across statements. DDL is transactional in
      // Postgres, so the whole schema applies atomically.
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock($1)", [SCHEMA_LOCK_KEY]);
      // Multi-statement simple query (no bind params) — creates schema idempotently.
      await client.query(PG_SCHEMA_SQL);
      await client.query("COMMIT");
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // ignore rollback failure; surface the original error
      }
      throw err;
    } finally {
      client.release();
    }
  }

  async query(sql: string, params: readonly unknown[]): Promise<Row[]> {
    const res = await this.#pool.query(toPgPlaceholders(sql), coerceParams(params));
    return res.rows as Row[];
  }

  async begin(): Promise<Tx> {
    const client = await this.#pool.connect();
    await client.query("BEGIN");
    let settled = false;
    const finish = async (verb: "COMMIT" | "ROLLBACK") => {
      if (settled) return;
      settled = true;
      try {
        await client.query(verb);
      } finally {
        client.release();
      }
    };
    return {
      query: async (sql, params) => {
        const res = await client.query(toPgPlaceholders(sql), coerceParams(params));
        return res.rows as Row[];
      },
      commit: () => finish("COMMIT"),
      rollback: () => finish("ROLLBACK"),
    };
  }

  async close(): Promise<void> {
    await this.#pool.end();
  }
}
