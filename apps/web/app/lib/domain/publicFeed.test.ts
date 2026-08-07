import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildPublicFeed,
  DEFAULT_K_THRESHOLD,
  PUBLIC_FEED_SCHEMA_VERSION,
} from "./publicFeed.ts";
import type { Need, NeedCategory, Site } from "./coordination.ts";

// --- Fixtures ---------------------------------------------------------------
// Every fixture is loaded with the sensitive fields the feed must NOT leak:
// a real-looking name and phone in `notes`, precise lat/lng, an org id, an
// exact timestamp. If any of these reach the wire, the fuzz test below fails.

const SECRET_NOTE = "Contacto Maria Perez +58 412 555 1942, Av. Sucre casa 14";
const SECRET_LAT = 10.5061234;
const SECRET_LNG = -66.9146789;

function need(over: Partial<Need>): Need {
  return {
    id: "ND-VE-SECRET1",
    createdAt: "2026-07-19T13:45:12.000Z",
    updatedAt: "2026-07-19T13:45:12.000Z",
    orgId: "ORG-SECRET-9",
    siteId: null,
    district: "Catia",
    lat: SECRET_LAT,
    lng: SECRET_LNG,
    category: "water",
    quantity: 200,
    unit: "botellones",
    urgency: "critical",
    status: "open",
    claimedByOrgId: null,
    notes: SECRET_NOTE,
    sourceId: null,
    syncedAt: null,
    ...over,
  };
}

function site(over: Partial<Site>): Site {
  return {
    id: "ST-VE-SECRET1",
    createdAt: "2026-07-19T13:45:12.000Z",
    updatedAt: "2026-07-19T13:45:12.000Z",
    name: "Refugio Maria Perez",
    orgId: "ORG-SECRET-9",
    district: "Catia",
    category: "refugio",
    lat: SECRET_LAT,
    lng: SECRET_LNG,
    bedsTotal: 40,
    bedsFree: 5,
    status: "active",
    notes: SECRET_NOTE,
    sourceId: null,
    syncedAt: null,
    announcement: "",
    announcementUntil: null,
    radiusM: null,
    createdByUserId: "USER-SECRET-9",
    createdByEmail: "maria@example.com",
    lastConfirmedAt: "2026-07-19T13:45:12.000Z",
    ...over,
  };
}

/** N open needs in one (district, category) cell. */
function needCell(district: string, category: NeedCategory, n: number): Need[] {
  return Array.from({ length: n }, (_, i) =>
    need({ id: `ND-${district}-${category}-${i}`, district, category }),
  );
}

const NOW = "2026-07-19T13:45:12.000Z";

// --- k-suppression ----------------------------------------------------------

test("cells below k are never emitted; emitted cells are all >= k", () => {
  const needs = [
    ...needCell("Catia", "water", 7), // emitted
    ...needCell("Petare", "food", 4), // suppressed (< 5)
    ...needCell("Chacao", "medical", 5), // emitted (exactly k)
    ...needCell("Sucre", "rescue", 1), // suppressed
  ];
  const feed = buildPublicFeed({ needs, sites: [], nowIso: NOW });

  for (const cell of feed.cells) {
    assert.ok(cell.openNeeds >= DEFAULT_K_THRESHOLD, `${cell.district}/${cell.category} below k`);
  }
  const keys = feed.cells.map((c) => `${c.district}/${c.category}`);
  assert.deepEqual(keys.sort(), ["Catia/water", "Chacao/medical"]);
  assert.equal(feed.suppressedCells, 2);
});

test("k threshold cannot be lowered below the floor", () => {
  const needs = needCell("Catia", "water", 4);
  // A caller asking for k=1 must not get sub-floor cells.
  const feed = buildPublicFeed({ needs, sites: [], nowIso: NOW }, { kThreshold: 1 });
  assert.equal(feed.params.kThreshold, DEFAULT_K_THRESHOLD);
  assert.equal(feed.cells.length, 0);
  assert.equal(feed.suppressedCells, 1);
});

test("a higher k threshold is honored", () => {
  const needs = needCell("Catia", "water", 8);
  const feed = buildPublicFeed({ needs, sites: [], nowIso: NOW }, { kThreshold: 10 });
  assert.equal(feed.params.kThreshold, 10);
  assert.equal(feed.cells.length, 0);
  assert.equal(feed.suppressedCells, 1);
});

// --- PII-free by construction (adversarial fuzz) ----------------------------

test("no sensitive field survives serialization, even when every input carries one", () => {
  const needs = [
    ...needCell("Catia", "water", 6),
    ...needCell("Petare", "food", 9),
  ];
  const sites = [site({}), site({ id: "ST-2", district: "Petare" })];
  const feed = buildPublicFeed({ needs, sites, nowIso: NOW });

  const wire = JSON.stringify(feed);
  // Names, contacts, addresses, precise coordinates, org/user ids, and exact
  // event timestamps must be structurally absent from the wire form.
  for (const secret of [
    "Maria",
    "Perez",
    "412 555 1942",
    "Av. Sucre",
    "ORG-SECRET-9",
    "USER-SECRET-9",
    "maria@example.com",
    "Refugio",
    String(SECRET_LAT),
    String(SECRET_LNG),
    "10.506", // any precise-coordinate prefix
    "-66.914",
    "13:45:12", // exact event time
    "ND-", // internal record ids
    "ST-",
  ]) {
    assert.ok(!wire.includes(secret), `feed leaked sensitive token: ${secret}`);
  }
});

test("the only keys a cell exposes are district, category, openNeeds", () => {
  const feed = buildPublicFeed({ needs: needCell("Catia", "water", 5), sites: [], nowIso: NOW });
  assert.equal(feed.cells.length, 1);
  assert.deepEqual(Object.keys(feed.cells[0]).sort(), ["category", "district", "openNeeds"]);
});

// --- cadence / interval dropped, not coarsened ------------------------------

test("asOf is day-granularity only; no finer time reaches the wire", () => {
  const feed = buildPublicFeed({ needs: [], sites: [], nowIso: NOW });
  assert.equal(feed.asOf, "2026-07-19");
  assert.match(feed.asOf, /^\d{4}-\d{2}-\d{2}$/);
});

test("claimed/received/cancelled needs are excluded (no tempo leakage)", () => {
  const needs = [
    ...needCell("Catia", "water", 5), // open -> counts
    ...needCell("Catia", "water", 5).map((n) => ({ ...n, status: "received" as const })),
    ...needCell("Catia", "water", 5).map((n) => ({ ...n, status: "claimed" as const })),
  ];
  const feed = buildPublicFeed({ needs, sites: [], nowIso: NOW });
  assert.equal(feed.cells.length, 1);
  assert.equal(feed.cells[0].openNeeds, 5); // only the open ones
});

// --- suppression-as-signal is a single global scalar, not per-district ------

test("suppressedCells is one scalar; no per-district suppression flag exists", () => {
  const needs = [
    ...needCell("Catia", "water", 2),
    ...needCell("Petare", "food", 3),
  ];
  const feed = buildPublicFeed({ needs, sites: [], nowIso: NOW });
  assert.equal(feed.cells.length, 0);
  assert.equal(feed.suppressedCells, 2);
  // The wire must not name Catia or Petare anywhere (a suppressed district must
  // not be revealed AS suppressed).
  const wire = JSON.stringify(feed);
  assert.ok(!wire.includes("Catia"));
  assert.ok(!wire.includes("Petare"));
});

// --- versioned parameterized contract ---------------------------------------

test("schema version and declared params are echoed in the payload", () => {
  const feed = buildPublicFeed(
    { needs: [], sites: [], nowIso: NOW },
    { region: "VE-Caracas-LaGuaira", categories: ["water", "food"] },
  );
  assert.equal(feed.params.schemaVersion, PUBLIC_FEED_SCHEMA_VERSION);
  assert.equal(feed.params.region, "VE-Caracas-LaGuaira");
  assert.equal(feed.params.timeBucket, "day");
  assert.deepEqual(feed.params.categories, ["water", "food"]);
});

test("category filter restricts cells and totals to scope", () => {
  const needs = [
    ...needCell("Catia", "water", 6),
    ...needCell("Catia", "rescue", 6),
  ];
  const feed = buildPublicFeed({ needs, sites: [], nowIso: NOW }, { categories: ["water"] });
  assert.equal(feed.cells.length, 1);
  assert.equal(feed.cells[0].category, "water");
  assert.equal(feed.totals.openNeeds, 6); // rescue excluded from totals too
});

// --- honest totals + determinism --------------------------------------------

test("totals are whole-population grand totals incl. suppressed cells", () => {
  const needs = [
    ...needCell("Catia", "water", 6), // emitted
    ...needCell("Petare", "food", 3), // suppressed but still counted in totals
  ];
  const sites = [site({}), site({ id: "ST-2", district: "Chacao" }), site({ id: "ST-3", status: "closed" })];
  const feed = buildPublicFeed({ needs, sites, nowIso: NOW });
  assert.equal(feed.totals.openNeeds, 9); // 6 + 3, suppression does not change the grand total
  assert.equal(feed.totals.activeSites, 2); // closed site excluded
  // districts with activity: Catia (needs+site), Petare (needs), Chacao (site)
  assert.equal(feed.totals.districts, 3);
});

test("output is deterministic and cells are stably sorted", () => {
  const needs = [
    ...needCell("Sucre", "food", 5),
    ...needCell("Catia", "water", 5),
    ...needCell("Catia", "food", 5),
  ];
  const a = buildPublicFeed({ needs, sites: [], nowIso: NOW });
  const b = buildPublicFeed({ needs: [...needs].reverse(), sites: [], nowIso: NOW });
  assert.deepEqual(a, b);
  assert.deepEqual(
    a.cells.map((c) => `${c.district}/${c.category}`),
    ["Catia/food", "Catia/water", "Sucre/food"],
  );
});

test("empty input yields an empty, well-formed feed (no throw)", () => {
  const feed = buildPublicFeed({ needs: [], sites: [], nowIso: NOW });
  assert.deepEqual(feed.cells, []);
  assert.deepEqual(feed.totals, { openNeeds: 0, activeSites: 0, districts: 0 });
  assert.equal(feed.suppressedCells, 0);
});

test("an unparseable clock yields an empty asOf rather than throwing", () => {
  const feed = buildPublicFeed({ needs: [], sites: [], nowIso: "not-a-date" });
  assert.equal(feed.asOf, "");
});
