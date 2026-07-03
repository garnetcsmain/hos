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
    "coordinator:test@hos",
  );
  assert.equal(withAviso.announcement, "Hoy entregan comida 2-5pm");
  assert.ok(withAviso.announcementUntil, "expiry is set");

  // Display rule: visible now, hidden after the expiry instant.
  const { activeAnnouncement } = await import("../domain/coordination.ts");
  assert.equal(activeAnnouncement(withAviso, new Date().toISOString()), "Hoy entregan comida 2-5pm");
  const afterExpiry = new Date(Date.parse(withAviso.announcementUntil!) + 60_000).toISOString();
  assert.equal(activeAnnouncement(withAviso, afterExpiry), null);

  const cleared = await svc.setSiteAnnouncement({ siteId: site.id, message: "", hoursValid: 24 }, "coordinator:test@hos");
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

  // Far away is never a duplicate.
  await svc.createSite({
    name: "Acopio Lejano", orgId: orgB.id, district: "Catia", category: "acopio",
    lat: 10.5300, lng: -66.9500, bedsTotal: 0, bedsFree: 0, notes: "",
  });
});
