import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isOverdueSite,
  overdueSites,
  publicStalenessBand,
  STALENESS_BAND_LABEL,
  BAND_HOURS,
} from "./siteTriage.ts";
import type { Freshness } from "./freshness.ts";
import type { SiteView } from "../domain/coordinationViews.ts";
import type { Site } from "../domain/coordination.ts";

const NOW = "2026-07-01T12:00:00Z";

function hoursAgo(h: number): string {
  return new Date(Date.parse(NOW) - h * 3_600_000).toISOString();
}

function siteView(over: {
  id: string;
  status?: Site["status"];
  freshness: Freshness;
  updatedAt: string;
}): SiteView {
  const site = {
    id: over.id,
    name: `Sitio ${over.id}`,
    orgId: "org-1",
    district: "Libertador",
    category: "refugio",
    lat: null,
    lng: null,
    bedsTotal: 0,
    bedsFree: 0,
    status: over.status ?? "active",
    notes: "",
    announcement: "",
    announcementUntil: null,
    radiusM: null,
    createdAt: over.updatedAt,
    updatedAt: over.updatedAt,
  } as unknown as Site;
  return { site, org: null, freshness: over.freshness };
}

// --- D1: overdue triage -----------------------------------------------------

test("overdue: an active, stale site is overdue", () => {
  assert.equal(
    isOverdueSite(siteView({ id: "a", freshness: "stale", updatedAt: hoursAgo(30) })),
    true,
  );
});

test("overdue: a fresh or aging active site is NOT overdue", () => {
  assert.equal(
    isOverdueSite(siteView({ id: "a", freshness: "fresh", updatedAt: hoursAgo(1) })),
    false,
  );
  assert.equal(
    isOverdueSite(siteView({ id: "b", freshness: "aging", updatedAt: hoursAgo(10) })),
    false,
  );
});

test("overdue: a closed/inactive site is never in the triage list, however stale", () => {
  // A site a coordinator already closed is not an unattended-but-live risk.
  assert.equal(
    isOverdueSite(siteView({ id: "a", status: "closed", freshness: "stale", updatedAt: hoursAgo(200) })),
    false,
  );
});

test("overdue: list keeps only active+stale, most overdue (oldest) first", () => {
  const views = [
    siteView({ id: "fresh", freshness: "fresh", updatedAt: hoursAgo(1) }),
    siteView({ id: "stale-30", freshness: "stale", updatedAt: hoursAgo(30) }),
    siteView({ id: "closed", status: "closed", freshness: "stale", updatedAt: hoursAgo(500) }),
    siteView({ id: "stale-90", freshness: "stale", updatedAt: hoursAgo(90) }),
    siteView({ id: "aging", freshness: "aging", updatedAt: hoursAgo(8) }),
  ];
  const out = overdueSites(views);
  assert.deepEqual(
    out.map((v) => v.site.id),
    ["stale-90", "stale-30"],
  );
});

test("overdue: does not mutate the input array", () => {
  const views = [
    siteView({ id: "stale-30", freshness: "stale", updatedAt: hoursAgo(30) }),
    siteView({ id: "stale-90", freshness: "stale", updatedAt: hoursAgo(90) }),
  ];
  const before = views.map((v) => v.site.id);
  overdueSites(views);
  assert.deepEqual(
    views.map((v) => v.site.id),
    before,
  );
});

// --- D5: public staleness band (anti-routine timing coarsening) -------------

test("band: buckets by coarse boundaries, never a precise hour", () => {
  assert.equal(publicStalenessBand(hoursAgo(2), NOW), "recent");
  assert.equal(publicStalenessBand(hoursAgo(23), NOW), "recent");
  assert.equal(publicStalenessBand(hoursAgo(30), NOW), "days");
  assert.equal(publicStalenessBand(hoursAgo(24 * 4), NOW), "week");
  assert.equal(publicStalenessBand(hoursAgo(24 * 10), NOW), "old");
});

test("band: the anti-routine property — distinct precise times within a band are indistinguishable", () => {
  // The whole point of the band: a steward who confirms at 08:00 one day and
  // 20:00 the next must look identical on a public surface, so cadence can't be
  // assembled into a presence schedule. Every sub-24h confirmation is "recent".
  const morning = publicStalenessBand(hoursAgo(2), NOW);
  const evening = publicStalenessBand(hoursAgo(14), NOW);
  assert.equal(morning, evening);
  assert.equal(STALENESS_BAND_LABEL[morning], STALENESS_BAND_LABEL[evening]);
});

test("band: labels are coarse ranges and never say 'responsable'", () => {
  for (const label of Object.values(STALENESS_BAND_LABEL)) {
    assert.doesNotMatch(label, /responsable/i);
    // No precise "hace N h/min" elapsed count leaks through the label.
    assert.doesNotMatch(label, /hace \d/i);
  }
});

test("band: boundaries are monotonic and align with BAND_HOURS", () => {
  assert.equal(publicStalenessBand(hoursAgo(BAND_HOURS.recent - 0.1), NOW), "recent");
  assert.equal(publicStalenessBand(hoursAgo(BAND_HOURS.recent + 0.1), NOW), "days");
  assert.equal(publicStalenessBand(hoursAgo(BAND_HOURS.days + 0.1), NOW), "week");
  assert.equal(publicStalenessBand(hoursAgo(BAND_HOURS.week + 0.1), NOW), "old");
});

test("band: an unparseable timestamp reads as the oldest band, never 'recent'", () => {
  assert.equal(publicStalenessBand("not-a-date", NOW), "old");
});
