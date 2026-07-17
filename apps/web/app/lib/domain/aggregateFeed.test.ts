import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AGGREGATE_FEED_SCHEMA_VERSION,
  defaultAggregateFeedParams,
  NEED_CATEGORIES,
  toPublicAggregateFeed,
  type AggregateFeedParams,
} from "./aggregateFeed.ts";
import type { Need, NeedCategory, Site, Urgency } from "./coordination.ts";

const REGIONS = ["Catia", "Petare", "La Guaira", "Chacao"] as const;

function params(overrides: Partial<AggregateFeedParams> = {}): AggregateFeedParams {
  return {
    ...defaultAggregateFeedParams("2026-W29", REGIONS, 5),
    ...overrides,
  };
}

let seq = 0;
function need(over: Partial<Need> = {}): Need {
  seq += 1;
  return {
    id: `ND-${seq}`,
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z",
    orgId: "ORG-1",
    siteId: null,
    district: "Catia",
    lat: null,
    lng: null,
    category: "water",
    quantity: 1,
    unit: "u",
    urgency: "normal",
    status: "open",
    claimedByOrgId: null,
    notes: "",
    sourceId: null,
    syncedAt: null,
    ...over,
  };
}

function site(over: Partial<Site> = {}): Site {
  return {
    id: "ST-1",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    name: "Acopio",
    orgId: "ORG-1",
    district: "Catia",
    category: "acopio",
    lat: null,
    lng: null,
    bedsTotal: 0,
    bedsFree: 0,
    status: "active",
    notes: "",
    sourceId: null,
    syncedAt: null,
    announcement: "",
    announcementUntil: null,
    radiusM: null,
    createdByUserId: null,
    createdByEmail: null,
    ...over,
  };
}

function manyNeeds(count: number, over: Partial<Need> = {}): Need[] {
  return Array.from({ length: count }, () => need(over));
}

test("aggregates open needs into district×category cells above the k-threshold", () => {
  const feed = toPublicAggregateFeed(
    [...manyNeeds(6, { district: "Catia", category: "water" })],
    [site()],
    params(),
  );
  assert.equal(feed.schemaVersion, AGGREGATE_FEED_SCHEMA_VERSION);
  assert.equal(feed.cells.length, 1);
  assert.deepEqual(feed.cells[0], {
    district: "Catia",
    category: "water",
    openNeeds: 6,
    criticalNeeds: 0,
  });
  assert.equal(feed.totals.districtsReporting, 1);
  assert.equal(feed.totals.activeSites, 1);
});

test("k-suppression: a cell below the threshold is never emitted", () => {
  const feed = toPublicAggregateFeed(
    manyNeeds(4, { district: "Petare", category: "food" }),
    [],
    params({ kThreshold: 5 }),
  );
  assert.equal(feed.cells.length, 0, "4 < k=5 must be fully suppressed");
  assert.equal(feed.totals.districtsReporting, 0);
});

test("k-suppression is exactly at the boundary (>= k emits, k-1 suppresses)", () => {
  const at = toPublicAggregateFeed(manyNeeds(5, { district: "Chacao", category: "medical" }), [], params());
  assert.equal(at.cells.length, 1);
  const below = toPublicAggregateFeed(manyNeeds(4, { district: "Chacao", category: "medical" }), [], params());
  assert.equal(below.cells.length, 0);
});

test("critical subset is counted, never exceeding the open count", () => {
  const feed = toPublicAggregateFeed(
    [
      ...manyNeeds(5, { district: "La Guaira", category: "rescue", urgency: "critical" as Urgency }),
      ...manyNeeds(2, { district: "La Guaira", category: "rescue", urgency: "normal" as Urgency }),
    ],
    [],
    params(),
  );
  assert.equal(feed.cells.length, 1);
  assert.equal(feed.cells[0].openNeeds, 7);
  assert.equal(feed.cells[0].criticalNeeds, 5);
  assert.ok(feed.cells[0].criticalNeeds <= feed.cells[0].openNeeds);
});

test("only OPEN needs count — claimed/received/cancelled leak cadence and are excluded", () => {
  const feed = toPublicAggregateFeed(
    [
      ...manyNeeds(5, { status: "open" }),
      ...manyNeeds(5, { status: "claimed" }),
      ...manyNeeds(5, { status: "received" }),
      ...manyNeeds(5, { status: "cancelled" }),
    ],
    [],
    params(),
  );
  assert.equal(feed.cells.length, 1);
  assert.equal(feed.cells[0].openNeeds, 5, "non-open statuses must not be counted");
});

test("ALLOWLIST: an off-vocabulary district can never appear in the output", () => {
  // A malicious/dirty need whose district field carries a person's name.
  const poison = "Juan Perez, Calle Real 5, casa azul";
  const feed = toPublicAggregateFeed(
    manyNeeds(20, { district: poison, category: "water" }),
    [],
    params(),
  );
  assert.equal(feed.cells.length, 0, "a district outside params.regions contributes to no cell");
  const wire = JSON.stringify(feed);
  assert.ok(!wire.includes("Juan Perez"), "injected PII must not survive into the payload");
  assert.ok(!wire.includes(poison));
});

test("ALLOWLIST: off-vocabulary categories are excluded", () => {
  const feed = toPublicAggregateFeed(
    manyNeeds(10, { district: "Catia", category: "totally-made-up" as NeedCategory }),
    [],
    params(),
  );
  assert.equal(feed.cells.length, 0);
});

test("STRUCTURAL: the payload shape carries no name/free-text/coordinate/id/timestamp field", () => {
  const feed = toPublicAggregateFeed(
    manyNeeds(6, {
      district: "Catia",
      category: "water",
      notes: "contacto: +58 412 555 1942, María en Av. Sucre",
      lat: 10.516,
      lng: -66.95,
    }),
    [site({ notes: "secret", lat: 10.5, lng: -66.9 })],
    params(),
  );
  const cellKeys = Object.keys(feed.cells[0]).sort();
  assert.deepEqual(cellKeys, ["category", "criticalNeeds", "district", "openNeeds"]);
  const wire = JSON.stringify(feed);
  // No coordinate, contact, or free-text leaked from the inputs.
  for (const leak of ["10.516", "-66.95", "412 555", "María", "Av. Sucre", "secret", "ND-"]) {
    assert.ok(!wire.includes(leak), `payload must not contain "${leak}"`);
  }
});

test("output district/category values come from the vocabulary, not from need data", () => {
  const feed = toPublicAggregateFeed(manyNeeds(6, { district: "Chacao", category: "food" }), [], params());
  for (const cell of feed.cells) {
    assert.ok(REGIONS.includes(cell.district as (typeof REGIONS)[number]));
    assert.ok((NEED_CATEGORIES as readonly string[]).includes(cell.category));
  }
});

test("deterministic ordering follows the declared vocabulary, not insertion order", () => {
  const feed = toPublicAggregateFeed(
    [
      ...manyNeeds(5, { district: "Chacao", category: "food" }),
      ...manyNeeds(5, { district: "Catia", category: "water" }),
      ...manyNeeds(5, { district: "Catia", category: "food" }),
    ],
    [],
    params(),
  );
  // Catia precedes Chacao in REGIONS; water precedes food in NEED_CATEGORIES.
  assert.deepEqual(
    feed.cells.map((c) => [c.district, c.category]),
    [
      ["Catia", "water"],
      ["Catia", "food"],
      ["Chacao", "food"],
    ],
  );
});

test("params are echoed into the payload (self-describing release)", () => {
  const p = params({ kThreshold: 7, bucket: "2026-W30" });
  const feed = toPublicAggregateFeed([], [], p);
  assert.equal(feed.params.kThreshold, 7);
  assert.equal(feed.params.bucket, "2026-W30");
  assert.deepEqual(feed.params.regions, REGIONS);
  assert.deepEqual(feed.params.categories, NEED_CATEGORIES);
});

test("a k-threshold below 1 is floored to 1 (never emits a zero-count cell)", () => {
  const feed = toPublicAggregateFeed(manyNeeds(1, { district: "Catia", category: "water" }), [], params({ kThreshold: 0 }));
  assert.equal(feed.params.kThreshold, 1);
  assert.equal(feed.cells.length, 1);
  assert.equal(feed.cells[0].openNeeds, 1);
});

// Deterministic pseudo-random fuzz: no matter the input, the invariants hold.
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

test("FUZZ: invariants hold across 400 randomized inputs", () => {
  const rand = lcg(0xC0FFEE);
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
  // A vocabulary of districts, plus off-vocab poison districts carrying PII.
  const poisonDistricts = ["<script>", "Ana Gómez tel 04141234567", "", "PETARE "];
  const districts = [...REGIONS, ...poisonDistricts];
  const cats = [...NEED_CATEGORIES, "junk" as NeedCategory];
  const statuses: Need["status"][] = ["open", "claimed", "received", "cancelled"];
  const urgencies: Urgency[] = ["low", "normal", "high", "critical"];

  for (let iter = 0; iter < 400; iter += 1) {
    const k = 1 + Math.floor(rand() * 6);
    const p = params({ kThreshold: k });
    const n = Math.floor(rand() * 60);
    const needs = Array.from({ length: n }, () =>
      need({
        district: pick(districts),
        category: pick(cats),
        status: pick(statuses),
        urgency: pick(urgencies),
        notes: pick(["", "María +58 412 555 1942", "dirección exacta"]),
      }),
    );
    const feed = toPublicAggregateFeed(needs, [], p);
    const wire = JSON.stringify(feed);

    // 1. Every emitted district/category is from the declared vocabulary.
    for (const cell of feed.cells) {
      assert.ok((REGIONS as readonly string[]).includes(cell.district), `district in vocab (iter ${iter})`);
      assert.ok((NEED_CATEGORIES as readonly string[]).includes(cell.category), `category in vocab (iter ${iter})`);
      // 2. k-suppression: no emitted cell is below threshold.
      assert.ok(cell.openNeeds >= Math.max(1, k), `cell >= k (iter ${iter})`);
      // 3. Counts are consistent, non-negative integers.
      assert.ok(Number.isInteger(cell.openNeeds) && cell.openNeeds >= 0);
      assert.ok(Number.isInteger(cell.criticalNeeds) && cell.criticalNeeds >= 0);
      assert.ok(cell.criticalNeeds <= cell.openNeeds, `critical <= open (iter ${iter})`);
    }
    // 4. No injected PII ever survives into the wire.
    for (const leak of ["María", "412 555", "<script>", "Ana Gómez", "dirección"]) {
      assert.ok(!wire.includes(leak), `no PII leak "${leak}" (iter ${iter})`);
    }
    // 5. districtsReporting equals the count of distinct emitted districts.
    assert.equal(feed.totals.districtsReporting, new Set(feed.cells.map((c) => c.district)).size);
  }
});
