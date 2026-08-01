import { test } from "node:test";
import assert from "node:assert/strict";

// In-memory DB; set before db/client.ts is imported (see familyReach.flow.test.ts).
process.env.HOS_DB_PATH = ":memory:";

const svc = await import("./coordination.ts");
const { eventsFor } = await import("../repositories/events.ts");
const { resetAllTablesForTests } = await import("../db/testing.ts");

// Clean slate so this suite is re-runnable against a shared Postgres too.
await resetAllTablesForTests();

function seedOrg(name = "Cruz Roja") {
  return svc.createOrg({ name, kind: "ngo" });
}

// A coordinator actor for site mutations that now take a SiteActor.
const COORD = { by: "coordinator:test@hos", userId: null, email: "test@hos", isCoordinator: true };
// A self-signup contributor (owns nothing until they create it).
const contributor = (userId: string, email: string) => ({
  by: `user:${email}`,
  userId,
  email,
  isCoordinator: false,
});

test("create org -> site -> need; a need starts open", async () => {
  const org = await seedOrg("Refugio A");
  const site = await svc.createSite({
    name: "Refugio A", orgId: org.id, district: "Maiquetía", category: "refugio", lat: null, lng: null,
    bedsTotal: 50, bedsFree: 10, notes: "",
  });
  assert.equal(site.bedsFree, 10);
  const need = await svc.createNeed({
    orgId: org.id, siteId: site.id, district: "Maiquetía", lat: null, lng: null, category: "water",
    quantity: 500, unit: "L", urgency: "high", notes: "",
  });
  assert.equal(need.status, "open");
});

test("bedsFree can never exceed bedsTotal", async () => {
  const org = await seedOrg("Refugio B");
  const site = await svc.createSite({
    name: "Refugio B", orgId: org.id, district: "La Guaira", category: "refugio", lat: null, lng: null,
    bedsTotal: 20, bedsFree: 999, notes: "",
  });
  assert.equal(site.bedsFree, 20);
});

test("claim then receive: honest lifecycle with attributable events", async () => {
  const requester = await seedOrg("Refugio C");
  const claimer = await svc.createOrg({ name: "Protección Civil", kind: "government" });
  const need = await svc.createNeed({
    orgId: requester.id, siteId: null,
    lat: null,
    lng: null, district: "Caracas", category: "food",
    quantity: 200, unit: "raciones", urgency: "normal", notes: "",
  });

  const claimed = await svc.transitionNeed({ needId: need.id, action: "claim", byOrgId: claimer.id, note: "" });
  assert.equal(claimed.status, "claimed");
  assert.equal(claimed.claimedByOrgId, claimer.id);

  const received = await svc.transitionNeed({ needId: need.id, action: "receive", byOrgId: null, note: "entregado" });
  assert.equal(received.status, "received");

  const types = (await eventsFor("need", need.id)).map((e) => e.type);
  assert.ok(types.includes("need.posted"));
  assert.ok(types.includes("need.claimed"));
  assert.ok(types.includes("need.received"));
});

test("a received need is terminal and cannot be transitioned again", async () => {
  const org = await seedOrg("Refugio D");
  const need = await svc.createNeed({
    orgId: org.id, siteId: null,
    lat: null,
    lng: null, district: "Caracas", category: "medical",
    quantity: 10, unit: "dosis", urgency: "high", notes: "",
  });
  await svc.transitionNeed({ needId: need.id, action: "receive", byOrgId: null, note: "" });
  await assert.rejects(svc.transitionNeed({ needId: need.id, action: "cancel", byOrgId: null, note: "" }));
});

test("only an open need can be claimed", async () => {
  const org = await seedOrg("Refugio E");
  const need = await svc.createNeed({
    orgId: org.id, siteId: null,
    lat: null,
    lng: null, district: "Caracas", category: "water",
    quantity: 1, unit: "L", urgency: "low", notes: "",
  });
  await svc.transitionNeed({ needId: need.id, action: "cancel", byOrgId: null, note: "" });
  await assert.rejects(svc.transitionNeed({ needId: need.id, action: "claim", byOrgId: org.id, note: "" }));
});

test("coordinationView suggests a same-category, same-district offer for an open need", async () => {
  const org = await seedOrg("Refugio F");
  await svc.createNeed({
    orgId: org.id, siteId: null,
    lat: null,
    lng: null, district: "Vargas", category: "hygiene",
    quantity: 100, unit: "kits", urgency: "normal", notes: "",
  });
  await svc.createOffer({ orgId: org.id, district: "Vargas", category: "hygiene", quantity: 150, unit: "kits", notes: "" });

  const view = await svc.coordinationView();
  const need = view.needs.find((n) => n.need.category === "hygiene" && n.need.district === "Vargas");
  assert.ok(need);
  assert.ok(need!.matches.length >= 1, "an advisory match is suggested");
  assert.equal(need!.matches[0].offer.category, "hygiene");
});

test("createNeed with an unknown org is rejected", async () => {
  await assert.rejects(
    svc.createNeed({
      orgId: "ORG-DOESNOTEXIST", siteId: null,
    lat: null,
    lng: null, district: "X", category: "water",
      quantity: 1, unit: "L", urgency: "low", notes: "",
    }),
  );
});

test("site announcement: set, display window, clear — all audited", async () => {
  const org = await seedOrg("Refugio G");
  const site = await svc.createSite({
    name: "Refugio G", orgId: org.id, district: "Macuto", category: "refugio", lat: null, lng: null,
    bedsTotal: 20, bedsFree: 5, notes: "",
  });

  const withAviso = await svc.setSiteAnnouncement(
    { siteId: site.id, message: "Hoy entregan comida 2-5pm", hoursValid: 6 },
    COORD,
  );
  assert.equal(withAviso.announcement, "Hoy entregan comida 2-5pm");
  assert.ok(withAviso.announcementUntil, "expiry is set");

  // Display rule: visible now, hidden after the expiry instant.
  const { activeAnnouncement } = await import("../domain/coordination.ts");
  assert.equal(activeAnnouncement(withAviso, new Date().toISOString()), "Hoy entregan comida 2-5pm");
  const afterExpiry = new Date(Date.parse(withAviso.announcementUntil!) + 60_000).toISOString();
  assert.equal(activeAnnouncement(withAviso, afterExpiry), null);

  const cleared = await svc.setSiteAnnouncement({ siteId: site.id, message: "", hoursValid: 24 }, COORD);
  assert.equal(cleared.announcement, "");
  assert.equal(cleared.announcementUntil, null);

  const events = await eventsFor("site", site.id);
  const types = events.map((e) => e.type);
  assert.ok(types.includes("site.announcement_set"));
  assert.ok(types.includes("site.announcement_cleared"));
  const setEvent = events.find((e) => e.type === "site.announcement_set");
  assert.equal((setEvent!.payload as { by?: string }).by, "coordinator:test@hos");
});

test("duplicate-location guard: same spot + same district rejected; different district allowed", async () => {
  const orgA = await seedOrg("Org A");
  const orgB = await seedOrg("Org B");
  await svc.createSite({
    name: "Acopio Plaza", orgId: orgA.id, district: "Catia", category: "acopio",
    lat: 10.5160, lng: -66.9500, bedsTotal: 0, bedsFree: 0, notes: "",
  });

  // ~40m away, same district, different org -> duplicate of the same point.
  await assert.rejects(
    svc.createSite({
      name: "Acopio Plaza Bis", orgId: orgB.id, district: "Catia", category: "acopio",
      lat: 10.51635, lng: -66.9500, bedsTotal: 0, bedsFree: 0, notes: "",
    }),
    /Ya existe un punto en esa ubicación/,
  );

  // Same spot but declared for a DIFFERENT support area -> two groups covering
  // the zone, allowed by design.
  const other = await svc.createSite({
    name: "Acopio Plaza — apoyo La Guaira", orgId: orgB.id, district: "La Guaira", category: "acopio",
    lat: 10.51635, lng: -66.9500, bedsTotal: 0, bedsFree: 0, notes: "",
  });
  assert.equal(other.district, "La Guaira");

  // Same spot, same district, but a DIFFERENT coverage radius -> a different
  // support area -> allowed (radius is how two groups share one address).
  const wideArea = await svc.createSite({
    name: "Cobertura amplia Catia", orgId: orgB.id, district: "Catia", category: "acopio",
    lat: 10.5160, lng: -66.9500, radiusM: 1500, bedsTotal: 0, bedsFree: 0, notes: "",
  });
  assert.equal(wideArea.radiusM, 1500);

  // Far away is never a duplicate.
  await svc.createSite({
    name: "Acopio Lejano", orgId: orgB.id, district: "Catia", category: "acopio",
    lat: 10.5300, lng: -66.9500, bedsTotal: 0, bedsFree: 0, notes: "",
  });
});

test("site 'otro' free-text label is captured in the audit event", async () => {
  const org = await seedOrg("Org Otro");
  const site = await svc.createSite(
    { name: "Punto raro", orgId: org.id, district: "Catia", category: "otro", lat: null, lng: null, bedsTotal: 0, bedsFree: 0, notes: "", otherLabel: "carga de gas doméstico" },
    COORD,
  );
  const events = await eventsFor("site", site.id);
  const created = events.find((e) => e.type === "site.created");
  assert.equal((created!.payload as { otherLabel?: string }).otherLabel, "carga de gas doméstico");
});

// --- Self-signup / site ownership authorization (the security boundary) ----

test("site ownership: creator becomes responsable and can manage their site", async () => {
  const org = await seedOrg("Org Ownership");
  const ana = contributor("user-ana", "ana@ejemplo.com");
  const site = await svc.createSite(
    { name: "Acopio de Ana", orgId: org.id, district: "Catia", category: "acopio", lat: null, lng: null, bedsTotal: 0, bedsFree: 0, notes: "" },
    ana,
  );
  assert.equal(site.createdByUserId, "user-ana");
  assert.equal(site.createdByEmail, "ana@ejemplo.com");

  // Ana (the responsable) can update her own site.
  const updated = await svc.updateSiteCapacity(
    { siteId: site.id, bedsTotal: 10, bedsFree: 4, status: "active", notes: "" },
    ana,
  );
  assert.equal(updated.bedsFree, 4);
});

test("a contributor CANNOT modify a site they don't own or manage", async () => {
  const org = await seedOrg("Org Foreign");
  const ana = contributor("user-ana2", "ana2@ejemplo.com");
  const beto = contributor("user-beto", "beto@ejemplo.com");
  const site = await svc.createSite(
    { name: "Sitio de Ana", orgId: org.id, district: "Macuto", category: "acopio", lat: null, lng: null, bedsTotal: 0, bedsFree: 0, notes: "" },
    ana,
  );
  await assert.rejects(
    svc.updateSiteCapacity({ siteId: site.id, bedsTotal: 5, bedsFree: 5, status: "active", notes: "" }, beto),
    /No tiene permiso/,
  );
  // ...but a coordinator always can.
  await assert.doesNotReject(
    svc.updateSiteCapacity({ siteId: site.id, bedsTotal: 5, bedsFree: 5, status: "active", notes: "" }, COORD),
  );
});

test("stewardship trust tier (HOS-2026-014-01): confirmar operativo is its own event, and every liveness write records who confirmed it", async () => {
  const org = await seedOrg("Org Trust");
  const verifiedCoord = { by: "coordinator:jefe@hos", userId: "user-jefe", email: "jefe@hos", isCoordinator: true };
  const site = await svc.createSite(
    { name: "Acopio Trust", orgId: org.id, district: "Chacao", category: "acopio", lat: null, lng: null, bedsTotal: 0, bedsFree: 0, notes: "" },
    verifiedCoord,
  );

  // A one-tap "confirmar operativo" by a signed-in coordinator: its own event
  // type, stamped verified (attested identity).
  await svc.updateSiteCapacity(
    { siteId: site.id, bedsTotal: 0, bedsFree: 0, status: "active", notes: "", intent: "confirm" },
    verifiedCoord,
  );
  // A capacity edit by the shared-token coordinator (no userId): honor tier.
  await svc.updateSiteCapacity(
    { siteId: site.id, bedsTotal: 8, bedsFree: 8, status: "active", notes: "", intent: "capacity" },
    COORD,
  );

  const events = await eventsFor("site", site.id);
  const confirmed = events.find((e) => e.type === "site.confirmed");
  const capacity = events.find((e) => e.type === "site.capacity_updated");
  assert.ok(confirmed, "confirmar operativo must emit its own site.confirmed event");
  assert.equal((confirmed!.payload as { trust?: string }).trust, "verified");
  assert.ok(capacity, "a bed-count edit must stay site.capacity_updated");
  assert.equal((capacity!.payload as { trust?: string }).trust, "honor");
});

test("confirm freshness (HOS-2026-014-01): a site's liveness clock advances on confirmar operativo, NOT on a bed-count edit", async () => {
  const org = await seedOrg("Org Confirm Freshness");
  const verifiedCoord = { by: "coordinator:jefa@hos", userId: "user-jefa", email: "jefa@hos", isCoordinator: true };
  const site = await svc.createSite(
    { name: "Acopio Freshness", orgId: org.id, district: "Baruta", category: "acopio", lat: null, lng: null, bedsTotal: 0, bedsFree: 0, notes: "" },
    verifiedCoord,
  );

  // Brand-new site: nobody has confirmed it operational -> honestly "unconfirmed".
  const beforeView = await svc.coordinationView();
  const before = beforeView.sites.find((s) => s.site.id === site.id);
  assert.ok(before, "the site should appear on the board");
  assert.equal(before!.confirmFreshness, "unconfirmed");
  assert.equal(before!.lastConfirmedAt, null);

  // A bed-count edit is NOT a re-confirmation: it must leave the confirm clock
  // untouched (the whole point of the separate signal).
  await svc.updateSiteCapacity(
    { siteId: site.id, bedsTotal: 8, bedsFree: 8, status: "active", notes: "", intent: "capacity" },
    verifiedCoord,
  );
  const afterEditView = await svc.coordinationView();
  const afterEdit = afterEditView.sites.find((s) => s.site.id === site.id);
  assert.equal(afterEdit!.confirmFreshness, "unconfirmed", "a bed-count edit must not confirm the site");
  assert.equal(afterEdit!.lastConfirmedAt, null);

  // A one-tap confirmar operativo advances the confirm clock (recent -> fresh).
  await svc.updateSiteCapacity(
    { siteId: site.id, bedsTotal: 8, bedsFree: 8, status: "active", notes: "", intent: "confirm" },
    verifiedCoord,
  );
  const afterConfirmView = await svc.coordinationView();
  const afterConfirm = afterConfirmView.sites.find((s) => s.site.id === site.id);
  assert.equal(afterConfirm!.confirmFreshness, "fresh");
  assert.ok(afterConfirm!.lastConfirmedAt, "lastConfirmedAt is derived from the site.confirmed event");
});

test("peer delegation: responsable grants a volunteer manage rights on their site (revocable)", async () => {
  const org = await seedOrg("Org Delegation");
  const ana = contributor("user-ana3", "ana3@ejemplo.com");
  const vol = contributor("user-vol", "voluntario@ejemplo.com");
  const site = await svc.createSite(
    { name: "Refugio de Ana", orgId: org.id, district: "La Guaira", category: "refugio", lat: null, lng: null, bedsTotal: 10, bedsFree: 10, notes: "" },
    ana,
  );

  // Before the grant, the volunteer is blocked.
  await assert.rejects(
    svc.updateSiteCapacity({ siteId: site.id, bedsTotal: 10, bedsFree: 3, status: "active", notes: "" }, vol),
    /No tiene permiso/,
  );

  // A random signed-up user cannot grant access — only the responsable.
  await assert.rejects(
    svc.grantSiteCoordinator({ siteId: site.id, email: "voluntario@ejemplo.com" }, vol),
    /Solo el responsable/,
  );

  // Ana (responsable) grants the volunteer, who can now manage the site.
  await svc.grantSiteCoordinator({ siteId: site.id, email: "Voluntario@Ejemplo.com" }, ana);
  await assert.doesNotReject(
    svc.updateSiteCapacity({ siteId: site.id, bedsTotal: 10, bedsFree: 3, status: "active", notes: "" }, vol),
  );

  // Revoked -> blocked again.
  await svc.revokeSiteCoordinator({ siteId: site.id, email: "voluntario@ejemplo.com" }, ana);
  await assert.rejects(
    svc.updateSiteCapacity({ siteId: site.id, bedsTotal: 10, bedsFree: 1, status: "active", notes: "" }, vol),
    /No tiene permiso/,
  );
});

test("contributor view excludes the sensitive needs board, shows managed sites", async () => {
  const org = await seedOrg("Org Contrib");
  const ana = contributor("user-ana4", "ana4@ejemplo.com");
  const site = await svc.createSite(
    { name: "Acopio Contrib", orgId: org.id, district: "Chacao", category: "acopio", lat: null, lng: null, bedsTotal: 0, bedsFree: 0, notes: "" },
    ana,
  );
  // A sensitive need exists on the board...
  await svc.createNeed(
    { orgId: org.id, siteId: null, district: "Chacao", lat: 10.49, lng: -66.85, category: "rescue", quantity: 1, unit: "", urgency: "critical", notes: "familia atrapada, contacto 0412..." },
    "user:ana4@ejemplo.com",
  );
  const view = await svc.contributorView("user-ana4", "ana4@ejemplo.com");
  // The contributor view has NO needs field at all (needs stay coordinator-only).
  assert.equal((view as { needs?: unknown }).needs, undefined);
  // Ana sees her own site among the public aid points and may manage it.
  assert.ok(view.sites.some((s) => s.site.id === site.id));
  assert.ok(view.managedSiteIds.includes(site.id));
});
