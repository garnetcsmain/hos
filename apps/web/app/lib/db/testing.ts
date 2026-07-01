// Test-only helper. The DB-touching flow tests historically relied on a fresh
// in-memory SQLite database per process. To let the SAME suite run (and re-run)
// against Postgres — the acceptance criterion for HOS-2026-001-07 — they call
// this first to start from a clean slate on whichever backend is configured.
//
// Only ever imported by *.test.ts. It clears the Phase-0 tables in FK-safe order
// (children before parents). match_embeddings is Postgres-only and unused in
// Phase 0, so it is intentionally omitted.

import { db } from "./client.ts";

const TABLES = [
  "events",
  "notifications",
  "verifications",
  "match_candidates",
  "needs",
  "offers",
  "sites",
  "orgs",
  "found_reports",
  "missing_reports",
];

export async function resetAllTablesForTests(): Promise<void> {
  for (const table of TABLES) {
    await db.prepare(`DELETE FROM ${table}`).run();
  }
}
