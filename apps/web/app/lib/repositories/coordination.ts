// Repository layer for the coordination epic (HOS-2026-007). Same philosophy as
// the rest of HOS: parameterized SQL only, lazy prepared statements, domain
// types in / domain types out. The service layer wraps writes in transactions
// and appends audit events.

import { db, lazyStatement } from "../db/client.ts";
import { mapNeed, mapOffer, mapOrg, mapSite } from "../db/coordinationMappers.ts";
import { nowIso } from "../domain/time.ts";
import type {
  Need,
  NeedStatus,
  Offer,
  Org,
  Site,
} from "@/app/lib/domain/coordination";

// --- Orgs -----------------------------------------------------------------

const insertOrgStmt = lazyStatement(
  `INSERT INTO orgs (id, created_at, name, kind) VALUES (?, ?, ?, ?)`,
);

export async function insertOrg(org: Org): Promise<void> {
  await insertOrgStmt().run(org.id, org.createdAt, org.name, org.kind);
}

export async function getOrg(id: string): Promise<Org | null> {
  const row = await db.prepare(`SELECT * FROM orgs WHERE id = ?`).get(id);
  return row ? mapOrg(row) : null;
}

export async function listOrgs(): Promise<Org[]> {
  const rows = await db.prepare(`SELECT * FROM orgs ORDER BY name ASC`).all();
  return rows.map(mapOrg);
}

export async function countOrgs(): Promise<number> {
  const row = (await db.prepare(`SELECT COUNT(*) AS n FROM orgs`).get()) as
    | { n: number }
    | undefined;
  return Number(row?.n ?? 0);
}

// --- Sites ----------------------------------------------------------------

const insertSiteStmt = lazyStatement(
  `INSERT INTO sites
     (id, created_at, updated_at, name, org_id, district, category, lat, lng, beds_total, beds_free, status, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

export async function insertSite(site: Site): Promise<void> {
  await insertSiteStmt().run(
    site.id,
    site.createdAt,
    site.updatedAt,
    site.name,
    site.orgId,
    site.district,
    site.category,
    site.lat,
    site.lng,
    site.bedsTotal,
    site.bedsFree,
    site.status,
    site.notes,
  );
}

export async function getSite(id: string): Promise<Site | null> {
  const row = await db.prepare(`SELECT * FROM sites WHERE id = ?`).get(id);
  return row ? mapSite(row) : null;
}

export async function listSites(): Promise<Site[]> {
  const rows = await db.prepare(`SELECT * FROM sites ORDER BY updated_at DESC`).all();
  return rows.map(mapSite);
}

/** Update mutable site fields (capacity/status/notes) and bump updated_at so the
 *  freshness signal is honest. */
export async function updateSiteCapacity(
  id: string,
  fields: { bedsTotal: number; bedsFree: number; status: string; notes: string },
): Promise<void> {
  await db.prepare(
    `UPDATE sites SET beds_total = ?, beds_free = ?, status = ?, notes = ?, updated_at = ? WHERE id = ?`,
  ).run(fields.bedsTotal, fields.bedsFree, fields.status, fields.notes, nowIso(), id);
}

// --- Needs ----------------------------------------------------------------

const insertNeedStmt = lazyStatement(
  `INSERT INTO needs
     (id, created_at, updated_at, org_id, site_id, district, category, quantity, unit, urgency, status, claimed_by_org_id, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

export async function insertNeed(need: Need): Promise<void> {
  await insertNeedStmt().run(
    need.id,
    need.createdAt,
    need.updatedAt,
    need.orgId,
    need.siteId,
    need.district,
    need.category,
    need.quantity,
    need.unit,
    need.urgency,
    need.status,
    need.claimedByOrgId,
    need.notes,
  );
}

export async function getNeed(id: string): Promise<Need | null> {
  const row = await db.prepare(`SELECT * FROM needs WHERE id = ?`).get(id);
  return row ? mapNeed(row) : null;
}

export async function listNeeds(status?: NeedStatus): Promise<Need[]> {
  const rows = status
    ? await db.prepare(`SELECT * FROM needs WHERE status = ? ORDER BY updated_at DESC`).all(status)
    : await db.prepare(`SELECT * FROM needs ORDER BY updated_at DESC`).all();
  return rows.map(mapNeed);
}

/** Transition a need's status (and optionally its claimer). updated_at is bumped
 *  so a stale item reads as stale. The service layer guards which transitions
 *  are legal and who may make them. */
export async function setNeedStatus(
  id: string,
  status: NeedStatus,
  claimedByOrgId: string | null,
): Promise<void> {
  await db.prepare(
    `UPDATE needs SET status = ?, claimed_by_org_id = ?, updated_at = ? WHERE id = ?`,
  ).run(status, claimedByOrgId, nowIso(), id);
}

// --- Offers ---------------------------------------------------------------

const insertOfferStmt = lazyStatement(
  `INSERT INTO offers
     (id, created_at, updated_at, org_id, district, category, quantity, unit, status, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

export async function insertOffer(offer: Offer): Promise<void> {
  await insertOfferStmt().run(
    offer.id,
    offer.createdAt,
    offer.updatedAt,
    offer.orgId,
    offer.district,
    offer.category,
    offer.quantity,
    offer.unit,
    offer.status,
    offer.notes,
  );
}

export async function listOffers(): Promise<Offer[]> {
  const rows = await db.prepare(`SELECT * FROM offers ORDER BY updated_at DESC`).all();
  return rows.map(mapOffer);
}
