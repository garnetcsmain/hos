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

/** Most recent occurrence time of ONE event `type` per entity, across the given
 *  ids. Used to derive a per-site "last confirmed operativo" freshness straight
 *  from the append-only log — the confirmation IS the `site.confirmed` event, not
 *  a mutable column, so nothing needs to be denormalized or migrated. Returns a
 *  map of entityId -> ISO time; ids that never saw the event are simply absent.
 *  `occurred_at` is stored as TEXT ISO-8601 UTC in both backends, so MAX() orders
 *  it correctly (lexicographic == chronological for that format). */
export async function latestEventTimeByEntity(
  entityType: EntityType,
  type: string,
  entityIds: string[],
): Promise<Map<string, string>> {
  if (entityIds.length === 0) return new Map();
  const placeholders = entityIds.map(() => "?").join(", ");
  const rows = await db
    .prepare(
      `SELECT entity_id, MAX(occurred_at) AS last_at
         FROM events
        WHERE entity_type = ? AND type = ? AND entity_id IN (${placeholders})
        GROUP BY entity_id`,
    )
    .all(entityType, type, ...entityIds);
  const out = new Map<string, string>();
  for (const row of rows) {
    const id = row.entity_id;
    const at = row.last_at;
    if (typeof id === "string" && typeof at === "string" && at) out.set(id, at);
  }
  return out;
}

export async function recentEvents(limit = 50): Promise<HosEvent[]> {
  const rows = await db.prepare(`SELECT * FROM events ORDER BY id DESC LIMIT ?`).all(limit);
  return rows.map(mapEvent);
}
