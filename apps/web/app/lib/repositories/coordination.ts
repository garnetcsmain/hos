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

export function insertOrg(org: Org): void {
  insertOrgStmt().run(org.id, org.createdAt, org.name, org.kind);
}

export function getOrg(id: string): Org | null {
  const row = db.prepare(`SELECT * FROM orgs WHERE id = ?`).get(id);
  return row ? mapOrg(row) : null;
}

export function listOrgs(): Org[] {
  return db.prepare(`SELECT * FROM orgs ORDER BY name ASC`).all().map(mapOrg);
}

export function countOrgs(): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM orgs`).get() as { n: number };
  return Number(row.n);
}

// --- Sites ----------------------------------------------------------------

const insertSiteStmt = lazyStatement(
  `INSERT INTO sites
     (id, created_at, updated_at, name, org_id, district, beds_total, beds_free, status, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

export function insertSite(site: Site): void {
  insertSiteStmt().run(
    site.id,
    site.createdAt,
    site.updatedAt,
    site.name,
    site.orgId,
    site.district,
    site.bedsTotal,
    site.bedsFree,
    site.status,
    site.notes,
  );
}

export function getSite(id: string): Site | null {
  const row = db.prepare(`SELECT * FROM sites WHERE id = ?`).get(id);
  return row ? mapSite(row) : null;
}

export function listSites(): Site[] {
  return db
    .prepare(`SELECT * FROM sites ORDER BY updated_at DESC`)
    .all()
    .map(mapSite);
}

/** Update mutable site fields (capacity/status/notes) and bump updated_at so the
 *  freshness signal is honest. */
export function updateSiteCapacity(
  id: string,
  fields: { bedsTotal: number; bedsFree: number; status: string; notes: string },
): void {
  db.prepare(
    `UPDATE sites SET beds_total = ?, beds_free = ?, status = ?, notes = ?, updated_at = ? WHERE id = ?`,
  ).run(fields.bedsTotal, fields.bedsFree, fields.status, fields.notes, nowIso(), id);
}

// --- Needs ----------------------------------------------------------------

const insertNeedStmt = lazyStatement(
  `INSERT INTO needs
     (id, created_at, updated_at, org_id, site_id, district, category, quantity, unit, urgency, status, claimed_by_org_id, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

export function insertNeed(need: Need): void {
  insertNeedStmt().run(
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

export function getNeed(id: string): Need | null {
  const row = db.prepare(`SELECT * FROM needs WHERE id = ?`).get(id);
  return row ? mapNeed(row) : null;
}

export function listNeeds(status?: NeedStatus): Need[] {
  const rows = status
    ? db.prepare(`SELECT * FROM needs WHERE status = ? ORDER BY updated_at DESC`).all(status)
    : db.prepare(`SELECT * FROM needs ORDER BY updated_at DESC`).all();
  return rows.map(mapNeed);
}

/** Transition a need's status (and optionally its claimer). updated_at is bumped
 *  so a stale item reads as stale. The service layer guards which transitions
 *  are legal and who may make them. */
export function setNeedStatus(
  id: string,
  status: NeedStatus,
  claimedByOrgId: string | null,
): void {
  db.prepare(
    `UPDATE needs SET status = ?, claimed_by_org_id = ?, updated_at = ? WHERE id = ?`,
  ).run(status, claimedByOrgId, nowIso(), id);
}

// --- Offers ---------------------------------------------------------------

const insertOfferStmt = lazyStatement(
  `INSERT INTO offers
     (id, created_at, updated_at, org_id, district, category, quantity, unit, status, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

export function insertOffer(offer: Offer): void {
  insertOfferStmt().run(
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

export function listOffers(): Offer[] {
  return db
    .prepare(`SELECT * FROM offers ORDER BY updated_at DESC`)
    .all()
    .map(mapOffer);
}
