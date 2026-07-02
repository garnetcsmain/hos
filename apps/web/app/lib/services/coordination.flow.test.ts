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
    orgId: org.id, siteId: site.id, district: "Maiquetía", category: "water",
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
    orgId: requester.id, siteId: null, district: "Caracas", category: "food",
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
    orgId: org.id, siteId: null, district: "Caracas", category: "medical",
    quantity: 10, unit: "dosis", urgency: "high", notes: "",
  });
  await svc.transitionNeed({ needId: need.id, action: "receive", byOrgId: null, note: "" });
  await assert.rejects(svc.transitionNeed({ needId: need.id, action: "cancel", byOrgId: null, note: "" }));
});

test("only an open need can be claimed", async () => {
  const org = await seedOrg("Refugio E");
  const need = await svc.createNeed({
    orgId: org.id, siteId: null, district: "Caracas", category: "water",
    quantity: 1, unit: "L", urgency: "low", notes: "",
  });
  await svc.transitionNeed({ needId: need.id, action: "cancel", byOrgId: null, note: "" });
  await assert.rejects(svc.transitionNeed({ needId: need.id, action: "claim", byOrgId: org.id, note: "" }));
});

test("coordinationView suggests a same-category, same-district offer for an open need", async () => {
  const org = await seedOrg("Refugio F");
  await svc.createNeed({
    orgId: org.id, siteId: null, district: "Vargas", category: "hygiene",
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
      orgId: "ORG-DOESNOTEXIST", siteId: null, district: "X", category: "water",
      quantity: 1, unit: "L", urgency: "low", notes: "",
    }),
  );
});
