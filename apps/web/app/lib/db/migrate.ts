// One-shot migrate + verify. Opens the configured backend (which runs init(),
// creating the schema idempotently — that IS the migration for Postgres) and
// reports what exists. Run against the hosted DB with:
//   node --env-file=.env.local app/lib/db/migrate.ts

import { backendKind, closeDatabase, db } from "./client.ts";

const kind = await backendKind(); // opens the backend and runs the schema init

const rows =
  kind === "postgres"
    ? await db
        .prepare(
          `SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
        )
        .all()
    : await db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`).all();

console.log(`[hos] backend = ${kind}`);
console.log(`[hos] tables (${rows.length}): ${rows.map((r) => String(r.name)).join(", ")}`);

if (kind === "postgres") {
  const ext = await db.prepare(`SELECT extname FROM pg_extension WHERE extname = 'vector'`).all();
  console.log(`[hos] pgvector: ${ext.length ? "enabled" : "MISSING"}`);
}

await closeDatabase();
console.log("[hos] migrate: done");
