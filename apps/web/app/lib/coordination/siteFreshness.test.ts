import { test } from "node:test";
import assert from "node:assert/strict";

import { livenessLabel, siteLiveness, sitesNeedingConfirmation } from "./siteFreshness.ts";
import type { Site } from "../domain/coordination.ts";

function mkSite(over: Partial<Site> = {}): Site {
  return {
    id: "ST-1",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
    name: "Refugio Uno",
    orgId: "ORG-1",
    district: "Catia",
    category: "refugio",
    lat: null,
    lng: null,
    bedsTotal: 10,
    bedsFree: 3,
    status: "active",
    notes: "",
    sourceId: null,
    syncedAt: null,
    announcement: "",
    announcementUntil: null,
    radiusM: null,
    createdByUserId: null,
    createdByEmail: null,
    lastConfirmedAt: null,
    ...over,
  };
}

const NOW = "2026-07-21T12:00:00.000Z";

test("never-confirmed site reads 'unconfirmed', never 'fresh'", () => {
  const l = siteLiveness(mkSite({ lastConfirmedAt: null }), NOW);
  assert.equal(l.band, "unconfirmed");
  assert.equal(l.hoursSinceConfirmed, null);
  assert.equal(l.confirmedAt, null);
  assert.match(livenessLabel(l), /Sin confirmar/);
});

test("bands decay: confirmed -> aging -> stale as time passes", () => {
  // confirmed 2h ago -> fresh band
  assert.equal(siteLiveness(mkSite({ lastConfirmedAt: "2026-07-21T10:00:00.000Z" }), NOW).band, "confirmed");
  // 8h ago -> aging (>= AGING_HOURS 6, < STALE_HOURS 24)
  assert.equal(siteLiveness(mkSite({ lastConfirmedAt: "2026-07-21T04:00:00.000Z" }), NOW).band, "aging");
  // 2 days ago -> stale (>= STALE_HOURS 24)
  assert.equal(siteLiveness(mkSite({ lastConfirmedAt: "2026-07-19T12:00:00.000Z" }), NOW).band, "stale");
});

test("liveness derives from lastConfirmedAt, NOT updatedAt (the D3-c split)", () => {
  // A site edited seconds ago (fresh updatedAt) but never confirmed operational
  // must still read unconfirmed — a one-tap-free edit cannot fake liveness, and
  // an edit cannot launder liveness onto the bed-count timestamp either.
  const l = siteLiveness(mkSite({ updatedAt: NOW, lastConfirmedAt: null }), NOW);
  assert.equal(l.band, "unconfirmed");
});

test("labels never name a person (Judge D2 — no ownership reassurance)", () => {
  for (const at of [null, "2026-07-21T11:00:00.000Z", "2026-07-21T02:00:00.000Z", "2026-07-18T12:00:00.000Z"]) {
    const label = livenessLabel(siteLiveness(mkSite({ lastConfirmedAt: at }), NOW));
    assert.doesNotMatch(label, /responsable|por\s+\w+@|confirmado por/i);
  }
});

test("triage: worst-first, excludes confirmed + closed sites", () => {
  const sites = [
    mkSite({ id: "fresh", lastConfirmedAt: "2026-07-21T11:30:00.000Z" }), // confirmed -> excluded
    mkSite({ id: "aging", lastConfirmedAt: "2026-07-21T04:00:00.000Z" }), // aging
    mkSite({ id: "stale", lastConfirmedAt: "2026-07-19T00:00:00.000Z" }), // stale
    mkSite({ id: "never", lastConfirmedAt: null }), // unconfirmed
    mkSite({ id: "closed", status: "closed", lastConfirmedAt: null }), // closed -> excluded
  ];
  const triage = sitesNeedingConfirmation(sites, NOW);
  assert.deepEqual(triage.map((t) => t.site.id), ["never", "stale", "aging"]);
});

test("triage: within a band, oldest confirmation surfaces first", () => {
  const sites = [
    mkSite({ id: "stale-recent", lastConfirmedAt: "2026-07-20T00:00:00.000Z" }), // ~36h
    mkSite({ id: "stale-old", lastConfirmedAt: "2026-07-18T00:00:00.000Z" }), // ~84h
  ];
  const triage = sitesNeedingConfirmation(sites, NOW);
  assert.deepEqual(triage.map((t) => t.site.id), ["stale-old", "stale-recent"]);
});
