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
  insertNeed,
  insertOffer,
  insertOrg,
  insertSite,
  listNeeds,
  listOffers,
  listOrgs,
  listSites,
  setNeedStatus,
  updateSiteAnnouncement as repoUpdateSiteAnnouncement,
  updateSiteCapacity as repoUpdateSiteCapacity,
} from "../repositories/coordination.ts";
import { appendEvent } from "../repositories/events.ts";
import { transaction } from "../db/client.ts";
import { newNeedId, newOfferId, newOrgId, newSiteId } from "../domain/ids.ts";
import { nowIso } from "../domain/time.ts";
import { badRequest, notFound } from "../errors.ts";
import { freshnessOf } from "../coordination/freshness.ts";
import { rankOffersForNeed } from "../coordination/match.ts";
import type { Need, Offer, Org, OrgKind, Site } from "@/app/lib/domain/coordination";
import type { CoordinationView } from "@/app/lib/domain/coordinationViews";
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

export async function createSite(input: SiteCreateInput, by = "unattributed"): Promise<Site> {
  const org = await requireOrg(input.orgId);
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
  };
  await transaction(async () => {
    await insertSite(site);
    await appendEvent({
      entityType: "site",
      entityId: site.id,
      type: "site.created",
      actor: `org:${org.name}`,
      payload: { district: site.district, bedsFree: site.bedsFree, bedsTotal: site.bedsTotal, by },
    });
  });
  return site;
}

export async function updateSiteCapacity(input: SiteUpdateInput, by = "unattributed"): Promise<Site> {
  const site = await getSite(input.siteId);
  if (!site) throw notFound(`site ${input.siteId} not found`);
  const org = await getOrg(site.orgId);
  const bedsFree = Math.min(input.bedsFree, input.bedsTotal);
  await transaction(async () => {
    await repoUpdateSiteCapacity(site.id, {
      bedsTotal: input.bedsTotal,
      bedsFree,
      status: input.status,
      notes: input.notes,
    });
    await appendEvent({
      entityType: "site",
      entityId: site.id,
      type: "site.capacity_updated",
      actor: `org:${org?.name ?? site.orgId}`,
      payload: { bedsFree, bedsTotal: input.bedsTotal, status: input.status, by },
    });
  });
  return { ...site, ...input, bedsFree, updatedAt: nowIso() };
}

/** Set or clear a site's broadcast ("hoy entregan comida 2-5pm"). Coordinator
 *  capability today; becomes the site:<id> scope's job when HOS-2026-011
 *  lands. An empty message clears. Audited like every other write. */
export async function setSiteAnnouncement(
  input: SiteAnnouncementInput,
  by = "unattributed",
): Promise<Site> {
  const site = await getSite(input.siteId);
  if (!site) throw notFound(`site ${input.siteId} not found`);
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
      payload: { message, until, by },
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
      payload: { category: need.category, quantity: need.quantity, district: need.district, urgency: need.urgency, by },
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
      payload: { from: need.status, to: status, note: input.note, by },
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
      payload: { category: offer.category, quantity: offer.quantity, district: offer.district, by },
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
