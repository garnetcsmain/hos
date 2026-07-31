// Coordination service (HOS-2026-007). All writes are atomic and audited, and
// the honest-state rules the Judge required live here:
//  - a need moves open -> claimed -> received; "received" is a human confirming
//    real receipt, never written optimistically;
//  - terminal states (received/cancelled) cannot be re-transitioned;
//  - every transition appends an attributable event to the shared event store.
//
// Nothing here auto-fulfills anything: the needs<->offer match is advisory only.
//
// Attribution (HOS-2026-001-08 Phase 1): event `actor` stays the acting ORG
// (the accountable entity); the authenticated human/caller behind the request
// is recorded in the payload as `by` (see actorTag in http/auth.ts). Under the
// shared token `by` is honestly "coordinator:token", never a fabricated name.

import {
  getNeed,
  getOrg,
  getSite,
  hasActiveSiteGrant,
  insertNeed,
  insertOffer,
  insertOrg,
  insertSite,
  listNeeds,
  listOffers,
  listOrgs,
  listSiteGrants,
  listSites,
  listSitesManagedBy,
  revokeSiteGrant,
  setNeedStatus,
  updateSiteAnnouncement as repoUpdateSiteAnnouncement,
  updateSiteCapacity as repoUpdateSiteCapacity,
  upsertSiteGrant,
  type SiteGrant,
} from "../repositories/coordination.ts";
import { appendEvent } from "../repositories/events.ts";
import { transaction } from "../db/client.ts";
import { newNeedId, newOfferId, newOrgId, newSiteId } from "../domain/ids.ts";
import { nowIso } from "../domain/time.ts";
import { badRequest, forbidden, notFound } from "../errors.ts";
import { approxKm } from "../coordination/classify.ts";
import { confirmFreshnessOf, freshnessOf } from "../coordination/freshness.ts";
import { trustTierOf } from "../coordination/trustTier.ts";
import { rankOffersForNeed } from "../coordination/match.ts";
import type { Need, Offer, Org, OrgKind, Site } from "@/app/lib/domain/coordination";
import type { CoordinationView, SiteView } from "@/app/lib/domain/coordinationViews";
import type {
  NeedCreateInput,
  NeedTransitionInput,
  OfferCreateInput,
  SiteAnnouncementInput,
  SiteCreateInput,
  SiteUpdateInput,
} from "../validation/coordination.ts";

async function requireOrg(orgId: string): Promise<Org> {
  const org = await getOrg(orgId);
  if (!org) throw badRequest(`unknown org ${orgId}`);
  return org;
}

/** Who is acting on a site. `by` is the audit label; `userId`/`email` identify
 *  a signed-up person (the responsable when they create a site); `isCoordinator`
 *  is the invite-only trusted tier. */
export interface SiteActor {
  by: string;
  userId: string | null;
  email: string | null;
  isCoordinator: boolean;
}

// Default for system/seed/legacy callers and tests that don't exercise
// per-user authorization: coordinator-equivalent. Routes ALWAYS pass a real
// actor, so contributor authorization is enforced on the live path.
const SYSTEM_ACTOR: SiteActor = { by: "unattributed", userId: null, email: null, isCoordinator: true };

/** May this actor modify this site? A coordinator always; otherwise the
 *  responsable (creator) or someone holding an active delegated grant on their
 *  verified email. */
export async function canManageSite(site: Site, actor: SiteActor): Promise<boolean> {
  if (actor.isCoordinator) return true;
  if (!actor.userId) return false;
  if (site.createdByUserId && site.createdByUserId === actor.userId) return true;
  return actor.email ? hasActiveSiteGrant(site.id, actor.email.toLowerCase()) : false;
}

async function assertCanManageSite(site: Site, actor: SiteActor): Promise<void> {
  if (!(await canManageSite(site, actor))) {
    throw forbidden("No tiene permiso para modificar este sitio. Pídale acceso al responsable del sitio.");
  }
}

// --- Orgs -----------------------------------------------------------------

export async function createOrg(
  input: { name: string; kind: OrgKind },
  by = "unattributed",
): Promise<Org> {
  const org: Org = { id: newOrgId(), createdAt: nowIso(), name: input.name, kind: input.kind };
  await transaction(async () => {
    await insertOrg(org);
    await appendEvent({
      entityType: "org",
      entityId: org.id,
      type: "org.registered",
      actor: `org:${org.name}`,
      payload: { kind: org.kind, by },
    });
  });
  return org;
}

// --- Sites ----------------------------------------------------------------

/** Two records for the same physical point (within this distance) are a
 *  duplicate — UNLESS their support area differs (human rule, 2026-07-03):
 *  a different district, or a materially different coverage radius, both mean
 *  more than one group is legitimately covering the zone. */
const DUPLICATE_SITE_KM = 0.1;
const RADIUS_MATCH_TOLERANCE_M = 100;

async function assertNotDuplicateLocation(input: SiteCreateInput): Promise<void> {
  if (input.lat === null || input.lng === null) return;
  const pin = { lat: input.lat, lng: input.lng };
  for (const site of await listSites()) {
    if (site.status !== "active" || site.lat === null || site.lng === null) continue;
    if (approxKm(pin, { lat: site.lat, lng: site.lng }) > DUPLICATE_SITE_KM) continue;
    if (site.district !== input.district) continue; // different support area: allowed
    // Different declared coverage → different support area → allowed.
    const sameRadius =
      Math.abs((site.radiusM ?? 0) - (input.radiusM ?? 0)) <= RADIUS_MATCH_TOLERANCE_M;
    if (!sameRadius) continue;
    const owner = (await getOrg(site.orgId))?.name ?? site.orgId;
    throw badRequest(
      `Ya existe un punto en esa ubicación con la misma cobertura: "${site.name}" (${owner}). ` +
        `Si es el mismo punto, coordine con ellos en vez de duplicarlo; ` +
        `si su grupo atiende otra zona, elija otro distrito o un radio de cobertura distinto.`,
    );
  }
}

export async function createSite(input: SiteCreateInput, actor: SiteActor = SYSTEM_ACTOR): Promise<Site> {
  const org = await requireOrg(input.orgId);
  await assertNotDuplicateLocation(input);
  const now = nowIso();
  const site: Site = {
    id: newSiteId(),
    createdAt: now,
    updatedAt: now,
    name: input.name,
    orgId: org.id,
    district: input.district,
    category: input.category,
    lat: input.lat,
    lng: input.lng,
    bedsTotal: input.bedsTotal,
    bedsFree: Math.min(input.bedsFree, input.bedsTotal),
    status: "active",
    notes: input.notes,
    sourceId: null,
    syncedAt: null,
    announcement: "",
    announcementUntil: null,
    radiusM: input.radiusM ?? null,
    // Whoever creates the site is its responsable (human direction 2026-07-03).
    createdByUserId: actor.userId,
    createdByEmail: actor.email,
    // Creating a site asserts it is operational now, so seed the liveness clock
    // (HOS-2026-014-01, Judge D3) — otherwise a brand-new site reads "sin
    // confirmar" the instant it is added.
    lastConfirmedAt: now,
  };
  await transaction(async () => {
    await insertSite(site);
    await appendEvent({
      entityType: "site",
      entityId: site.id,
      type: "site.created",
      actor: `org:${org.name}`,
      // otherLabel: when category is "otro", the free text the person typed —
      // kept in the audit log so recurring answers can become real categories.
      payload: {
        district: site.district,
        category: site.category,
        radiusM: site.radiusM,
        bedsFree: site.bedsFree,
        bedsTotal: site.bedsTotal,
        by: actor.by,
        ...(site.category === "otro" && input.otherLabel ? { otherLabel: input.otherLabel } : {}),
      },
    });
  });
  return site;
}

export async function updateSiteCapacity(input: SiteUpdateInput, actor: SiteActor = SYSTEM_ACTOR): Promise<Site> {
  const site = await getSite(input.siteId);
  if (!site) throw notFound(`site ${input.siteId} not found`);
  await assertCanManageSite(site, actor);
  const org = await getOrg(site.orgId);
  const bedsFree = Math.min(input.bedsFree, input.bedsTotal);
  // A one-tap "confirmar operativo" (HOS-2026-014-01, Judge D1) is a distinct
  // liveness signal, not a capacity edit — it gets its own event type so the
  // append-only log can tell "still operating" apart from "beds changed". Every
  // stewardship write records the trust tier of who made it (trustTierOf):
  // append-only means this is stamp-now-or-never.
  const trust = trustTierOf(actor);
  const now = nowIso();
  const isConfirm = input.intent === "confirm";
  // Judge D3: the two freshness clocks are independent. `updated_at` tracks the
  // bed-count / data edit; `last_confirmed_at` tracks the operational-liveness
  // confirmation. A bare confirm advances ONLY last_confirmed_at (never
  // updated_at), so it can never launder a stale bed count into reading fresh. A
  // capacity edit that leaves the site active also asserts it is operating, so it
  // advances both; closing a site confirms no operation, so it advances neither
  // liveness clock (only updated_at, the data edit).
  const confirmsOperational = isConfirm || input.status === "active";
  const nextUpdatedAt = isConfirm ? site.updatedAt : now;
  const nextConfirmedAt = confirmsOperational ? now : site.lastConfirmedAt;
  await transaction(async () => {
    await repoUpdateSiteCapacity(site.id, {
      bedsTotal: input.bedsTotal,
      bedsFree,
      status: input.status,
      notes: input.notes,
      updatedAt: isConfirm ? null : now,
      lastConfirmedAt: confirmsOperational ? now : null,
    });
    await appendEvent({
      entityType: "site",
      entityId: site.id,
      type: isConfirm ? "site.confirmed" : "site.capacity_updated",
      actor: `org:${org?.name ?? site.orgId}`,
      payload: { bedsFree, bedsTotal: input.bedsTotal, status: input.status, by: actor.by, trust },
    });
  });
  return { ...site, ...input, bedsFree, updatedAt: nextUpdatedAt, lastConfirmedAt: nextConfirmedAt };
}

/** Set or clear a site's broadcast ("hoy entregan comida 2-5pm"). Allowed for
 *  the site's responsable, a delegated site-coordinator, or a coordinator. An
 *  empty message clears. Audited like every other write. */
export async function setSiteAnnouncement(
  input: SiteAnnouncementInput,
  actor: SiteActor = SYSTEM_ACTOR,
): Promise<Site> {
  const site = await getSite(input.siteId);
  if (!site) throw notFound(`site ${input.siteId} not found`);
  await assertCanManageSite(site, actor);
  const org = await getOrg(site.orgId);
  const message = input.message;
  const until = message
    ? new Date(Date.parse(nowIso()) + input.hoursValid * 3_600_000).toISOString()
    : null;
  await transaction(async () => {
    await repoUpdateSiteAnnouncement(site.id, message, until);
    await appendEvent({
      entityType: "site",
      entityId: site.id,
      type: message ? "site.announcement_set" : "site.announcement_cleared",
      actor: `org:${org?.name ?? site.orgId}`,
      payload: { message, until, by: actor.by, trust: trustTierOf(actor) },
    });
  });
  return { ...site, announcement: message, announcementUntil: until, updatedAt: nowIso() };
}

// --- Needs ----------------------------------------------------------------

export async function createNeed(input: NeedCreateInput, by = "unattributed"): Promise<Need> {
  const org = await requireOrg(input.orgId);
  if (input.siteId && !(await getSite(input.siteId))) throw badRequest(`unknown site ${input.siteId}`);
  const now = nowIso();
  const need: Need = {
    id: newNeedId(),
    createdAt: now,
    updatedAt: now,
    orgId: org.id,
    siteId: input.siteId,
    district: input.district,
    lat: input.lat,
    lng: input.lng,
    category: input.category,
    quantity: input.quantity,
    unit: input.unit,
    urgency: input.urgency,
    status: "open",
    claimedByOrgId: null,
    notes: input.notes,
    sourceId: null,
    syncedAt: null,
  };
  await transaction(async () => {
    await insertNeed(need);
    await appendEvent({
      entityType: "need",
      entityId: need.id,
      type: "need.posted",
      actor: `org:${org.name}`,
      payload: {
        category: need.category,
        quantity: need.quantity,
        district: need.district,
        urgency: need.urgency,
        by,
        ...(need.category === "other" && input.otherLabel ? { otherLabel: input.otherLabel } : {}),
      },
    });
  });
  return need;
}

const TERMINAL = new Set(["received", "cancelled"]);

export async function transitionNeed(input: NeedTransitionInput, by = "unattributed"): Promise<Need> {
  const need = await getNeed(input.needId);
  if (!need) throw notFound(`need ${input.needId} not found`);
  if (TERMINAL.has(need.status)) {
    throw badRequest(`need ${need.id} is already ${need.status} and cannot change`);
  }

  let status = need.status;
  let claimedByOrgId = need.claimedByOrgId;
  let eventType = "";
  let actor = "coordinator";

  if (input.action === "claim") {
    if (need.status !== "open") throw badRequest("only an open need can be claimed");
    if (!input.byOrgId) throw badRequest("claiming org is required");
    const claimer = await requireOrg(input.byOrgId);
    status = "claimed";
    claimedByOrgId = claimer.id;
    eventType = "need.claimed";
    actor = `org:${claimer.name}`;
  } else if (input.action === "receive") {
    // Honest state: this is the requesting site confirming REAL receipt — never
    // the claimer, never automatic (Board condition). Attributed to the requester.
    status = "received";
    eventType = "need.received";
    actor = `org:${(await getOrg(need.orgId))?.name ?? need.orgId}`;
  } else {
    status = "cancelled";
    eventType = "need.cancelled";
    actor = `org:${(await getOrg(need.orgId))?.name ?? need.orgId}`;
  }

  await transaction(async () => {
    await setNeedStatus(need.id, status, claimedByOrgId);
    await appendEvent({
      entityType: "need",
      entityId: need.id,
      type: eventType,
      actor,
      // Attribution only in the durable log; the free-text note can carry
      // re-contact detail and is kept out of the append-only event store
      // (Board HOS-2026-008-D3). `by` records who acted (HOS-2026-001-08 Phase 1).
      payload: { from: need.status, to: status, noteProvided: input.note.length > 0, by },
    });
  });
  return { ...need, status, claimedByOrgId, updatedAt: nowIso() };
}

// --- Offers ---------------------------------------------------------------

export async function createOffer(input: OfferCreateInput, by = "unattributed"): Promise<Offer> {
  const org = await requireOrg(input.orgId);
  const now = nowIso();
  const offer: Offer = {
    id: newOfferId(),
    createdAt: now,
    updatedAt: now,
    orgId: org.id,
    district: input.district,
    category: input.category,
    quantity: input.quantity,
    unit: input.unit,
    status: "available",
    notes: input.notes,
  };
  await transaction(async () => {
    await insertOffer(offer);
    await appendEvent({
      entityType: "offer",
      entityId: offer.id,
      type: "offer.posted",
      actor: `org:${org.name}`,
      payload: {
        category: offer.category,
        quantity: offer.quantity,
        district: offer.district,
        by,
        ...(offer.category === "other" && input.otherLabel ? { otherLabel: input.otherLabel } : {}),
      },
    });
  });
  return offer;
}

// --- Read assembly --------------------------------------------------------

/** Assemble the coordinator board: sites + needs (with advisory matches) +
 *  offers, each joined to its org and tagged with a freshness signal. */
export async function coordinationView(): Promise<CoordinationView> {
  const now = nowIso();
  const [orgs, offers, sites, needs] = await Promise.all([
    listOrgs(),
    listOffers(),
    listSites(),
    listNeeds(),
  ]);
  const orgById = new Map(orgs.map((o) => [o.id, o]));

  return {
    orgs,
    offers: offers.map((offer) => ({ offer, org: orgById.get(offer.orgId) ?? null })),
    sites: sites.map((site) => ({
      site,
      org: orgById.get(site.orgId) ?? null,
      freshness: freshnessOf(site.updatedAt, now),
      confirmFreshness: confirmFreshnessOf(site.lastConfirmedAt, now),
    })),
    needs: needs.map((need) => ({
      need,
      org: orgById.get(need.orgId) ?? null,
      claimedByOrg: need.claimedByOrgId ? orgById.get(need.claimedByOrgId) ?? null : null,
      freshness: freshnessOf(need.updatedAt, now),
      matches: need.status === "open" ? rankOffersForNeed(need, offers) : [],
    })),
  };
}

// --- Contributor read (self-signup tier) ----------------------------------

export interface ContributorView {
  orgs: Org[];
  /** Public aid points (all active sites). Aid points are public by design —
   *  people are meant to find them; the source already publishes them. */
  sites: SiteView[];
  /** Subset of `sites` the contributor may edit (owns or is delegated). */
  managedSiteIds: string[];
}

/** The read a self-signup contributor gets. DELIBERATELY OMITS the needs board:
 *  needs can carry precise locations and contacts of people in danger, which is
 *  the coordinator-only layer (D1). Contributors see public aid points and know
 *  which ones they may manage; they contribute the rest through the forms. */
export async function contributorView(userId: string, email: string): Promise<ContributorView> {
  const now = nowIso();
  const [orgs, sites, managed] = await Promise.all([
    listOrgs(),
    listSites(),
    listSitesManagedBy(userId, email.toLowerCase()),
  ]);
  const orgById = new Map(orgs.map((o) => [o.id, o]));
  const managedIds = new Set(managed.map((s) => s.id));
  return {
    orgs,
    sites: sites
      .filter((s) => s.status === "active")
      .map((site) => ({
        site,
        org: orgById.get(site.orgId) ?? null,
        freshness: freshnessOf(site.updatedAt, now),
        confirmFreshness: confirmFreshnessOf(site.lastConfirmedAt, now),
      })),
    managedSiteIds: [...managedIds],
  };
}

// --- Site coordinator delegation (peer, no central approval) ---------------

/** The responsable of a site (or a coordinator) grants another person, by
 *  email, the right to manage THAT site — after vetting them onsite. Revocable,
 *  optionally time-boxed. Only the owner or a coordinator may grant. */
export async function grantSiteCoordinator(
  input: { siteId: string; email: string; hoursValid?: number | null },
  actor: SiteActor,
): Promise<void> {
  const site = await getSite(input.siteId);
  if (!site) throw notFound(`site ${input.siteId} not found`);
  const isOwner = Boolean(site.createdByUserId && site.createdByUserId === actor.userId);
  if (!actor.isCoordinator && !isOwner) {
    throw forbidden("Solo el responsable del sitio puede dar acceso a otra persona.");
  }
  const email = input.email.trim().toLowerCase();
  if (!email) throw badRequest("Falta el correo de la persona.");
  const expiresAt =
    input.hoursValid && input.hoursValid > 0
      ? new Date(Date.parse(nowIso()) + input.hoursValid * 3_600_000).toISOString()
      : null;
  await transaction(async () => {
    await upsertSiteGrant({ siteId: site.id, email, grantedBy: actor.email ?? actor.by, createdAt: nowIso(), expiresAt });
    await appendEvent({
      entityType: "site",
      entityId: site.id,
      type: "site.access_granted",
      actor: actorLabel(actor),
      payload: { email, until: expiresAt, by: actor.by },
    });
  });
}

export async function revokeSiteCoordinator(
  input: { siteId: string; email: string },
  actor: SiteActor,
): Promise<void> {
  const site = await getSite(input.siteId);
  if (!site) throw notFound(`site ${input.siteId} not found`);
  const isOwner = Boolean(site.createdByUserId && site.createdByUserId === actor.userId);
  if (!actor.isCoordinator && !isOwner) {
    throw forbidden("Solo el responsable del sitio puede quitar acceso.");
  }
  const email = input.email.trim().toLowerCase();
  await transaction(async () => {
    await revokeSiteGrant(site.id, email);
    await appendEvent({
      entityType: "site",
      entityId: site.id,
      type: "site.access_revoked",
      actor: actorLabel(actor),
      payload: { email, by: actor.by },
    });
  });
}

/** List the active/expired grants on a site — visible to the owner/coordinator. */
export async function siteCoordinators(siteId: string): Promise<SiteGrant[]> {
  return listSiteGrants(siteId);
}

function actorLabel(actor: SiteActor): string {
  if (actor.email) return `${actor.isCoordinator ? "coordinator" : "user"}:${actor.email}`;
  return `coordinator:${actor.by}`;
}
