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

/** The single most recent event of a given `type` for every entity of
 *  `entityType`, keyed by entity id. Used to derive a per-entity liveness signal
 *  straight from the append-only log — e.g. when each site was last CONFIRMED
 *  operativo (site.confirmed), which is deliberately NOT the same as when its row
 *  was last touched (updated_at). One query; rows come back oldest-first so the
 *  last write per entity wins the map. */
export async function latestEventByEntity(
  entityType: EntityType,
  type: string,
): Promise<Map<string, HosEvent>> {
  const rows = await db
    .prepare(
      `SELECT * FROM events WHERE entity_type = ? AND type = ? ORDER BY id ASC`,
    )
    .all(entityType, type);
  const latest = new Map<string, HosEvent>();
  for (const row of rows) {
    const ev = mapEvent(row);
    latest.set(ev.entityId, ev); // ascending id => later rows overwrite earlier
  }
  return latest;
}
