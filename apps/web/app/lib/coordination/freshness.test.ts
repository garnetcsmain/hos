import { test } from "node:test";
import assert from "node:assert/strict";

import {
  freshnessOf,
  hoursSince,
  siteConfirmationFreshness,
  AGING_HOURS,
  STALE_HOURS,
} from "./freshness.ts";

const NOW = "2026-07-01T12:00:00Z";

test("freshness: recent updates are fresh", () => {
  assert.equal(freshnessOf("2026-07-01T11:30:00Z", NOW), "fresh");
});

test("freshness: crosses to aging at the aging threshold", () => {
  const justOver = new Date(Date.parse(NOW) - (AGING_HOURS + 1) * 3_600_000).toISOString();
  assert.equal(freshnessOf(justOver, NOW), "aging");
});

test("freshness: crosses to stale at the stale threshold", () => {
  const justOver = new Date(Date.parse(NOW) - (STALE_HOURS + 1) * 3_600_000).toISOString();
  assert.equal(freshnessOf(justOver, NOW), "stale");
});

test("freshness: an unparseable timestamp is treated as stale, never fresh", () => {
  assert.equal(freshnessOf("not-a-date", NOW), "stale");
  assert.equal(hoursSince("not-a-date", NOW), Infinity);
});

test("freshness: a future timestamp clamps to 0 hours (fresh)", () => {
  assert.equal(hoursSince("2026-07-01T13:00:00Z", NOW), 0);
});

// --- Site operational-confirmation freshness (HOS-2026-014-01) --------------

test("site confirmation: a recent confirmation is fresh regardless of an older createdAt", () => {
  const created = new Date(Date.parse(NOW) - 72 * 3_600_000).toISOString(); // 3 days ago
  const confirmed = new Date(Date.parse(NOW) - 1 * 3_600_000).toISOString(); // 1h ago
  assert.equal(siteConfirmationFreshness(confirmed, created, NOW), "fresh");
});

test("site confirmation: an old confirmation reads stale even though the row was just edited", () => {
  // createdAt is recent (simulating a fresh updated_at bump from a bed edit) but
  // the last *confirmation* is 2 days old — the site must still read stale.
  const created = NOW; // an unrelated edit would bump updated_at to ~now
  const confirmed = new Date(Date.parse(NOW) - 48 * 3_600_000).toISOString();
  assert.equal(siteConfirmationFreshness(confirmed, created, NOW), "stale");
});

test("site confirmation: never confirmed (null) decays from createdAt, not treated as fresh", () => {
  const oldCreated = new Date(Date.parse(NOW) - (STALE_HOURS + 1) * 3_600_000).toISOString();
  assert.equal(siteConfirmationFreshness(null, oldCreated, NOW), "stale");
  assert.equal(siteConfirmationFreshness(null, NOW, NOW), "fresh");
});
