// Nightly incremental sync from caracasayuda.com (HOS-2026-007-10).
//
// Replaces the one-off checked-in import (caracasayudaData.ts) with a
// repeatable reconcile against the source's public Supabase "puntos" table.
// Human direction (2026-07-03): pull nightly for the initial period, and
// ALWAYS give precedence to data modified or entered directly in HOS:
//
//   - rows created directly in HOS (source_id IS NULL) are never touched;
//   - imported rows locally edited since their last sync
//     (updated_at > synced_at) are never overwritten — the source cannot
//     undo a coordinator's correction;
//   - only untouched imported rows are refreshed from the source.
//
// Classification is text-first (lib/coordination/classify.ts): the source's
// categoria field and map pins are unreliable; locality always derives from
// the record's text, and the pin is kept only when it agrees.
//
// The source shape (verified live 2026-07-03): public read on `puntos`
// (id uuid, nombre, categoria, tipo ayuda|necesidad, lat, lng, direccion,
// horario, telefono, descripcion, necesitan, ofrecen, estado
// pending|verified|old, created_at, updated_at). Rows older than 5 days are
// hidden by the source's own UI, so we sync the same 5-day active window.

import { db, transaction } from "./client.ts";
import { appendEvent } from "../repositories/events.ts";
import { insertNeed, insertOrg, insertSite } from "../repositories/coordination.ts";
import { newNeedId, newOrgId, newSiteId } from "../domain/ids.ts";
import { nowIso } from "../domain/time.ts";
import {
  inVenezuela,
  locateNeed,
  needCategoryFromText,
  siteCategoryFromSource,
  urgencyFromText,
} from "../coordination/classify.ts";

// Public-by-design constants (embedded in caracasayuda.com's frontend);
// overridable so a source migration doesn't need a code change.
const SOURCE_URL =
  process.env.CARACASAYUDA_SUPABASE_URL ?? "https://zxpfumbsxgnfzxjlhocu.supabase.co";
const SOURCE_KEY =
  process.env.CARACASAYUDA_SUPABASE_KEY ?? "sb_publishable_bx7plOxEb3M4aNID_stt-g_WPh-FS88";

const SOURCE_ORG_NAME = "Comunidad · caracasayuda.com";
const ACTIVE_WINDOW_MS = 5 * 24 * 60 * 60 * 1000; // the source's own liveness window
const PAGE_SIZE = 1000; // PostgREST hard-caps responses at 1000 rows

export interface SourcePunto {
  id: string;
  nombre: string | null;
  categoria: string | null;
  tipo: string | null;
  lat: number | null;
  lng: number | null;
  direccion: string | null;
  horario: string | null;
  telefono: string | null;
  descripcion: string | null;
  necesitan: string | null;
  ofrecen: string | null;
  estado: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SyncSummary {
  fetched: number;
  sitesInserted: number;
  sitesUpdated: number;
  needsInserted: number;
  needsUpdated: number;
  /** Imported rows left alone because a coordinator edited them in HOS. */
  preservedLocalEdits: number;
  /** Source rows flagged stale by the community (estado=old). */
  skippedFlaggedOld: number;
  /** Rows that don't belong on this board (outside corridor / not an aid point). */
  skippedOutOfScope: number;
}

async function fetchSourceRows(): Promise<SourcePunto[]> {
  const since = new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString();
  const rows: SourcePunto[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const url =
      `${SOURCE_URL}/rest/v1/puntos?select=*` +
      `&created_at=gte.${encodeURIComponent(since)}&order=created_at.asc`;
    const res = await fetch(url, {
      headers: {
        apikey: SOURCE_KEY,
        Authorization: `Bearer ${SOURCE_KEY}`,
        "Range-Unit": "items",
        Range: `${from}-${from + PAGE_SIZE - 1}`,
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok && res.status !== 206) {
      throw new Error(`caracasayuda source responded ${res.status}`);
    }
    const page = (await res.json()) as SourcePunto[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

/** Compose display notes the same way the original import did, and carry the
 *  source's own verification state honestly. */
function composeNotes(p: SourcePunto): string {
  const parts = [
    (p.descripcion ?? "").trim() || (p.necesitan ?? "").trim() || (p.ofrecen ?? "").trim(),
    p.direccion?.trim() ? `Dirección: ${p.direccion.trim()}` : "",
    p.horario?.trim() ? `Horario: ${p.horario.trim()}` : "",
    p.telefono?.trim() ? `Tel: ${p.telefono.trim()}` : "",
  ].filter(Boolean);
  let notes = parts.join(" · ");
  if (p.estado === "pending") notes = notes ? `${notes} · Sin verificar en el origen` : "Sin verificar en el origen";
  return notes;
}

function classifiableText(p: SourcePunto): string {
  return [p.nombre, p.descripcion, p.necesitan, p.direccion].filter(Boolean).join(" · ");
}

interface ExistingRow {
  id: string;
  updated_at: string;
  synced_at: string | null;
}

// Millisecond grain: a local edit stamped in the exact same ms as the sync's
// synced_at would read as unmodified. At nightly-cron vs human-edit
// timescales that cannot happen; noted so nobody "fixes" this to >= (which
// would mark every seeded row — synced_at == updated_at by construction —
// as locally modified and freeze the first refresh).
function locallyModified(row: ExistingRow): boolean {
  if (!row.synced_at) return true; // unknown reconcile point: refuse to overwrite
  return Date.parse(row.updated_at) > Date.parse(row.synced_at);
}

async function existingBySource(table: "sites" | "needs"): Promise<Map<string, ExistingRow>> {
  const rows = (await db
    .prepare(`SELECT id, source_id, updated_at, synced_at FROM ${table} WHERE source_id IS NOT NULL`)
    .all()) as Array<{ id: unknown; source_id: unknown; updated_at: unknown; synced_at: unknown }>;
  return new Map(
    rows.map((r) => [
      String(r.source_id),
      {
        id: String(r.id),
        updated_at: String(r.updated_at),
        synced_at: r.synced_at === null || r.synced_at === undefined ? null : String(r.synced_at),
      },
    ]),
  );
}

async function sourceOrgId(): Promise<string> {
  const row = (await db.prepare(`SELECT id FROM orgs WHERE name = ?`).get(SOURCE_ORG_NAME)) as
    | { id: unknown }
    | undefined;
  if (row) return String(row.id);
  const org = { id: newOrgId(), createdAt: nowIso(), name: SOURCE_ORG_NAME, kind: "other" as const };
  await insertOrg(org);
  return org.id;
}

/** Refuse to run against a database seeded before source_id existed — every
 *  source row would be re-inserted as a duplicate. One reseed fixes it. */
async function assertSyncableDb(): Promise<void> {
  const total = (await db.prepare(`SELECT COUNT(*) AS n FROM sites`).get()) as { n: number };
  if (Number(total?.n ?? 0) === 0) return; // empty DB: plain first import
  const withSource = (await db
    .prepare(`SELECT COUNT(*) AS n FROM sites WHERE source_id IS NOT NULL`)
    .get()) as { n: number };
  if (Number(withSource?.n ?? 0) === 0) {
    throw new Error(
      "coordination data predates sync provenance (no source_id on any site): " +
        "run `npm run seed:coordination` once before enabling the nightly sync",
    );
  }
}

export async function runCoordinationSync(
  fetchRows: () => Promise<SourcePunto[]> = fetchSourceRows,
): Promise<SyncSummary> {
  await assertSyncableDb();
  const source = await fetchRows();

  const summary: SyncSummary = {
    fetched: source.length,
    sitesInserted: 0,
    sitesUpdated: 0,
    needsInserted: 0,
    needsUpdated: 0,
    preservedLocalEdits: 0,
    skippedFlaggedOld: 0,
    skippedOutOfScope: 0,
  };

  const [sitesBySource, needsBySource] = await Promise.all([
    existingBySource("sites"),
    existingBySource("needs"),
  ]);

  await transaction(async () => {
    const orgId = await sourceOrgId();
    const now = nowIso();

    for (const p of source) {
      if (p.estado === "old") {
        summary.skippedFlaggedOld += 1;
        continue;
      }
      const text = classifiableText(p);
      const notes = composeNotes(p);
      const sourceUpdatedAt = p.updated_at ?? p.created_at;
      const pin = p.lat !== null && p.lng !== null ? { lat: p.lat, lng: p.lng } : null;

      if (p.tipo === "ayuda") {
        // Physical aid point → site (only our five site categories qualify).
        const category = siteCategoryFromSource(p.categoria ?? "", text);
        if (!category || !pin || !inVenezuela(pin)) {
          summary.skippedOutOfScope += 1;
          continue;
        }
        const located = locateNeed(text, pin);
        const district = located?.district ?? "Otra región";
        const existing = sitesBySource.get(p.id);
        if (!existing) {
          await insertSite({
            id: newSiteId(),
            createdAt: p.created_at,
            updatedAt: sourceUpdatedAt,
            name: (p.nombre ?? "").trim() || "Punto de ayuda",
            orgId,
            district,
            category,
            lat: pin.lat,
            lng: pin.lng,
            bedsTotal: 0,
            bedsFree: 0,
            status: "active",
            notes,
            sourceId: p.id,
            syncedAt: now,
            announcement: "",
            announcementUntil: null,
          });
          summary.sitesInserted += 1;
        } else if (locallyModified(existing)) {
          summary.preservedLocalEdits += 1;
        } else {
          // Data fields only: capacity and open/closed liveness are local
          // coordinator signals the source knows nothing about.
          await db
            .prepare(
              `UPDATE sites SET name = ?, district = ?, category = ?, lat = ?, lng = ?, notes = ?, updated_at = ?, synced_at = ? WHERE id = ?`,
            )
            .run(
              (p.nombre ?? "").trim() || "Punto de ayuda",
              district,
              category,
              pin.lat,
              pin.lng,
              notes,
              sourceUpdatedAt,
              now,
              existing.id,
            );
          summary.sitesUpdated += 1;
        }
      } else if (p.tipo === "necesidad") {
        // Need report → corridor-scoped, text-first location (pin kept only
        // when it agrees with the text — HOS-2026-007-07 relocation rule).
        const located = locateNeed(text, pin);
        if (!located) {
          summary.skippedOutOfScope += 1;
          continue;
        }
        const category = needCategoryFromText(text);
        const urgency = urgencyFromText(text, category);
        const existing = needsBySource.get(p.id);
        if (!existing) {
          await insertNeed({
            id: newNeedId(),
            createdAt: p.created_at,
            updatedAt: sourceUpdatedAt,
            orgId,
            siteId: null,
            district: located.district,
            lat: located.lat,
            lng: located.lng,
            category,
            quantity: 1,
            unit: "",
            urgency,
            status: "open",
            claimedByOrgId: null,
            notes,
            sourceId: p.id,
            syncedAt: now,
          });
          summary.needsInserted += 1;
        } else if (locallyModified(existing)) {
          summary.preservedLocalEdits += 1;
        } else {
          // Status/claims are local workflow state — never synced. An
          // unmodified row is still open by definition (any transition
          // bumps updated_at past synced_at and protects the row above).
          await db
            .prepare(
              `UPDATE needs SET district = ?, lat = ?, lng = ?, category = ?, urgency = ?, notes = ?, updated_at = ?, synced_at = ? WHERE id = ?`,
            )
            .run(
              located.district,
              located.lat,
              located.lng,
              category,
              urgency,
              notes,
              sourceUpdatedAt,
              now,
              existing.id,
            );
          summary.needsUpdated += 1;
        }
      } else {
        summary.skippedOutOfScope += 1;
      }
    }

    await appendEvent({
      entityType: "coordination",
      entityId: "caracasayuda-sync",
      type: "coordination.synced",
      actor: "system:sync",
      payload: { source: "caracasayuda.com", ...summary },
    });
  });

  return summary;
}
