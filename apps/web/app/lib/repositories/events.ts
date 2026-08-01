// Append-only event store. This is both an operational feature (reconstruct
// any record's history) and a forensic control (AGENTS.md): code here only
// ever INSERTs. There is intentionally no update or delete.

import { db, lazyStatement } from "../db/client.ts";
import { mapEvent } from "../db/mappers.ts";
import { nowIso } from "../domain/time.ts";
import type { EntityType, HosEvent } from "@/app/lib/domain/types";

export interface NewEvent {
  entityType: EntityType;
  entityId: string;
  type: string;
  actor: string;
  payload?: Record<string, unknown>;
}

const insertStmt = lazyStatement(
  `INSERT INTO events (occurred_at, entity_type, entity_id, type, actor, payload)
   VALUES (?, ?, ?, ?, ?, ?)`,
);

/** Record an event. Caller should already be inside a transaction when the
 *  event accompanies a state change, so the two commit or roll back together. */
export async function appendEvent(event: NewEvent): Promise<void> {
  await insertStmt().run(
    nowIso(),
    event.entityType,
    event.entityId,
    event.type,
    event.actor,
    JSON.stringify(event.payload ?? {}),
  );
}

export async function eventsFor(entityType: EntityType, entityId: string): Promise<HosEvent[]> {
  const rows = await db
    .prepare(
      `SELECT * FROM events WHERE entity_type = ? AND entity_id = ? ORDER BY id ASC`,
    )
    .all(entityType, entityId);
  return rows.map(mapEvent);
}

/** All events for any of the given entity ids, oldest first — used to build a
 *  cross-entity timeline (missing report + its candidates + notifications). */
export async function eventsForEntities(entityIds: string[]): Promise<HosEvent[]> {
  if (entityIds.length === 0) return [];
  const placeholders = entityIds.map(() => "?").join(", ");
  const rows = await db
    .prepare(`SELECT * FROM events WHERE entity_id IN (${placeholders}) ORDER BY id ASC`)
    .all(...entityIds);
  return rows.map(mapEvent);
}

export async function recentEvents(limit = 50): Promise<HosEvent[]> {
  const rows = await db.prepare(`SELECT * FROM events ORDER BY id DESC LIMIT ?`).all(limit);
  return rows.map(mapEvent);
}

/** For every site that has ever been confirmed operational, the timestamp of its
 *  most recent `site.confirmed` event (HOS-2026-014-01, Judge D1). Derived from
 *  the append-only event store rather than a denormalized column so the
 *  confirmation clock cannot drift from the audit trail. `occurred_at` is a
 *  zero-padded UTC ISO-8601 string, so a lexical MAX is a chronological MAX.
 *  Sites absent from the map have never been confirmed through HOS. */
export async function lastConfirmedAtBySite(): Promise<Map<string, string>> {
  const rows = (await db
    .prepare(
      `SELECT entity_id, MAX(occurred_at) AS last_confirmed
         FROM events
        WHERE entity_type = 'site' AND type = 'site.confirmed'
        GROUP BY entity_id`,
    )
    .all()) as Array<{ entity_id: string; last_confirmed: string }>;
  return new Map(rows.map((r) => [r.entity_id, r.last_confirmed]));
}
