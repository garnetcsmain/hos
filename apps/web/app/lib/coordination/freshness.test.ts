import { test } from "node:test";
import assert from "node:assert/strict";

import {
  confirmationFreshnessOf,
  freshnessOf,
  hoursSince,
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

test("confirmation freshness: never-confirmed is 'unconfirmed', not 'stale'", () => {
  // A site never confirmed operativo is a distinct "needs a look" state — it was
  // never fresh, so it must NOT be collapsed into 'stale' (which implies decay
  // from a prior confirmation). Silence is never read as confirmation.
  assert.equal(confirmationFreshnessOf(null, NOW), "unconfirmed");
});

test("confirmation freshness: a recent confirmation is fresh", () => {
  assert.equal(confirmationFreshnessOf("2026-07-01T11:30:00Z", NOW), "fresh");
});

test("confirmation freshness: decays with age exactly like row freshness once confirmed", () => {
  const aging = new Date(Date.parse(NOW) - (AGING_HOURS + 1) * 3_600_000).toISOString();
  const stale = new Date(Date.parse(NOW) - (STALE_HOURS + 1) * 3_600_000).toISOString();
  assert.equal(confirmationFreshnessOf(aging, NOW), "aging");
  assert.equal(confirmationFreshnessOf(stale, NOW), "stale");
});
