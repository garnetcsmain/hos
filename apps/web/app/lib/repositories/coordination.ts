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
     (id, created_at, updated_at, name, org_id, district, category, lat, lng, beds_total, beds_free, status, notes, source_id, synced_at, announcement, announcement_until, radius_m, created_by_user_id, created_by_email, last_confirmed_at, last_confirmed_tier)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    site.sourceId,
    site.syncedAt,
    site.announcement,
    site.announcementUntil,
    site.radiusM,
    site.createdByUserId,
    site.createdByEmail,
    site.lastConfirmedAt,
    site.lastConfirmedTier,
  );
}

/** Sites a user owns (created) or holds an active delegated grant on (matched by
 *  their verified email) — the contributor's "mis sitios" and the manage check. */
export async function listSitesManagedBy(userId: string, email: string): Promise<Site[]> {
  const rows = await db
    .prepare(
      `SELECT s.* FROM sites s
       WHERE s.created_by_user_id = ?
          OR s.id IN (
            SELECT g.site_id FROM site_grants g
            WHERE g.email = ? AND (g.expires_at IS NULL OR g.expires_at > ?)
          )
       ORDER BY s.updated_at DESC`,
    )
    .all(userId, email, nowIso());
  return rows.map(mapSite);
}

/** True if this email holds an active (non-expired) delegated grant on the site. */
export async function hasActiveSiteGrant(siteId: string, email: string): Promise<boolean> {
  const row = (await db
    .prepare(
      `SELECT 1 AS ok FROM site_grants
       WHERE site_id = ? AND email = ? AND (expires_at IS NULL OR expires_at > ?)`,
    )
    .get(siteId, email, nowIso())) as { ok: number } | undefined;
  return Boolean(row?.ok);
}

// --- Site grants (peer delegation) ----------------------------------------

export interface SiteGrant {
  siteId: string;
  email: string;
  grantedBy: string;
  createdAt: string;
  expiresAt: string | null;
}

export async function upsertSiteGrant(grant: SiteGrant): Promise<void> {
  await db
    .prepare(
      `INSERT INTO site_grants (site_id, email, granted_by, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(site_id, email) DO UPDATE SET granted_by = excluded.granted_by, expires_at = excluded.expires_at`,
    )
    .run(grant.siteId, grant.email, grant.grantedBy, grant.createdAt, grant.expiresAt);
}

export async function revokeSiteGrant(siteId: string, email: string): Promise<void> {
  await db.prepare(`DELETE FROM site_grants WHERE site_id = ? AND email = ?`).run(siteId, email);
}

export async function listSiteGrants(siteId: string): Promise<SiteGrant[]> {
  const rows = (await db
    .prepare(`SELECT * FROM site_grants WHERE site_id = ? ORDER BY created_at ASC`)
    .all(siteId)) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    siteId: String(r.site_id),
    email: String(r.email ?? ""),
    grantedBy: String(r.granted_by ?? ""),
    createdAt: String(r.created_at),
    expiresAt: r.expires_at == null ? null : String(r.expires_at),
  }));
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

/** Record a one-tap "operativo" confirmation (HOS-2026-014-01). Writes ONLY the
 *  liveness columns and DELIBERATELY does NOT touch updated_at: bed-count
 *  freshness reads from updated_at, so leaving it untouched makes it structurally
 *  impossible for a confirm to launder a stale bed number (Judge D3). The sync
 *  never touches these columns, so the confirmation survives a source reconcile. */
export async function confirmSiteOperativo(
  id: string,
  fields: { at: string; tier: string },
): Promise<void> {
  await db.prepare(
    `UPDATE sites SET last_confirmed_at = ?, last_confirmed_tier = ? WHERE id = ?`,
  ).run(fields.at, fields.tier, id);
}

/** Set or clear (empty message) a site's broadcast. Bumps updated_at: an
 *  announcement is a live signal from the site, so freshness reads honest —
 *  and the bump marks the row locally-modified, which protects it from the
 *  nightly source sync (local edits win). */
export async function updateSiteAnnouncement(
  id: string,
  announcement: string,
  announcementUntil: string | null,
): Promise<void> {
  await db.prepare(
    `UPDATE sites SET announcement = ?, announcement_until = ?, updated_at = ? WHERE id = ?`,
  ).run(announcement, announcementUntil, nowIso(), id);
}

// --- Needs ----------------------------------------------------------------

const insertNeedStmt = lazyStatement(
  `INSERT INTO needs
     (id, created_at, updated_at, org_id, site_id, district, lat, lng, category, quantity, unit, urgency, status, claimed_by_org_id, notes, source_id, synced_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

export async function insertNeed(need: Need): Promise<void> {
  await insertNeedStmt().run(
    need.id,
    need.createdAt,
    need.updatedAt,
    need.orgId,
    need.siteId,
    need.district,
    need.lat,
    need.lng,
    need.category,
    need.quantity,
    need.unit,
    need.urgency,
    need.status,
    need.claimedByOrgId,
    need.notes,
    need.sourceId,
    need.syncedAt,
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
