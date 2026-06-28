// Append-only event store. This is both an operational feature (reconstruct
// any record's history) and a forensic control (AGENTS.md): code here only
// ever INSERTs. There is intentionally no update or delete.

import { db } from "../db/client.ts";
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

const insertStmt = db.prepare(
  `INSERT INTO events (occurred_at, entity_type, entity_id, type, actor, payload)
   VALUES (?, ?, ?, ?, ?, ?)`,
);

/** Record an event. Caller should already be inside a transaction when the
 *  event accompanies a state change, so the two commit or roll back together. */
export function appendEvent(event: NewEvent): void {
  insertStmt.run(
    nowIso(),
    event.entityType,
    event.entityId,
    event.type,
    event.actor,
    JSON.stringify(event.payload ?? {}),
  );
}

export function eventsFor(entityType: EntityType, entityId: string): HosEvent[] {
  const rows = db
    .prepare(
      `SELECT * FROM events WHERE entity_type = ? AND entity_id = ? ORDER BY id ASC`,
    )
    .all(entityType, entityId);
  return rows.map(mapEvent);
}

/** All events for any of the given entity ids, oldest first — used to build a
 *  cross-entity timeline (missing report + its candidates + notifications). */
export function eventsForEntities(entityIds: string[]): HosEvent[] {
  if (entityIds.length === 0) return [];
  const placeholders = entityIds.map(() => "?").join(", ");
  const rows = db
    .prepare(`SELECT * FROM events WHERE entity_id IN (${placeholders}) ORDER BY id ASC`)
    .all(...entityIds);
  return rows.map(mapEvent);
}

export function recentEvents(limit = 50): HosEvent[] {
  const rows = db.prepare(`SELECT * FROM events ORDER BY id DESC LIMIT ?`).all(limit);
  return rows.map(mapEvent);
}
