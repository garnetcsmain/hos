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

/** For a set of entity ids, the timestamp of the most recent event of a given
 *  type (e.g. the last "site.confirmed"). Lets the read model derive a liveness
 *  signal straight from the append-only log — no denormalized/last-confirmed
 *  column to keep in sync across the three schema paths, and it stays honest to
 *  the event truth. Ids absent from the returned map had no such event. One
 *  grouped query; occurred_at is ISO-8601 UTC, so MAX() orders chronologically.
 */
export async function latestEventAtByEntity(
  entityType: EntityType,
  type: string,
  entityIds: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (entityIds.length === 0) return result;
  const placeholders = entityIds.map(() => "?").join(", ");
  const rows = await db
    .prepare(
      `SELECT entity_id, MAX(occurred_at) AS latest
         FROM events
        WHERE entity_type = ? AND type = ? AND entity_id IN (${placeholders})
        GROUP BY entity_id`,
    )
    .all(entityType, type, ...entityIds);
  for (const row of rows as Array<{ entity_id: unknown; latest: unknown }>) {
    if (row.entity_id != null && row.latest != null) {
      result.set(String(row.entity_id), String(row.latest));
    }
  }
  return result;
}

export async function recentEvents(limit = 50): Promise<HosEvent[]> {
  const rows = await db.prepare(`SELECT * FROM events ORDER BY id DESC LIMIT ?`).all(limit);
  return rows.map(mapEvent);
}
