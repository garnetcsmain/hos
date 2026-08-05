import { test } from "node:test";
import assert from "node:assert/strict";

import {
  confirmationFreshnessOf,
  freshnessOf,
  hoursSince,
  lastConfirmedAt,
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

// --- Confirmation freshness (HOS-2026-014-01) ------------------------------

test("confirmation: picks the most recent confirmation, order-independent", () => {
  const events = [
    { type: "site.confirmed", occurredAt: "2026-07-01T09:00:00Z" },
    { type: "site.created", occurredAt: "2026-06-30T12:00:00Z" },
    { type: "site.confirmed", occurredAt: "2026-07-01T11:30:00Z" },
  ];
  assert.equal(lastConfirmedAt(events), "2026-07-01T11:30:00Z");
});

test("confirmation: site.created counts as the origin operational vouch", () => {
  const events = [{ type: "site.created", occurredAt: "2026-07-01T11:45:00Z" }];
  assert.equal(lastConfirmedAt(events), "2026-07-01T11:45:00Z");
});

test("confirmation: a bed-count edit or aviso is NOT a confirmation", () => {
  // The whole point of the confirm/bed-count split: touching the bed count or
  // posting an aviso must not reset the operational-confirmation clock.
  const events = [
    { type: "site.capacity_updated", occurredAt: "2026-07-01T11:59:00Z" },
    { type: "site.announcement_set", occurredAt: "2026-07-01T11:58:00Z" },
  ];
  assert.equal(lastConfirmedAt(events), null);
});

test("confirmation: no events (feed import) yields null -> unconfirmed, never fresh", () => {
  assert.equal(lastConfirmedAt([]), null);
  assert.equal(confirmationFreshnessOf(null, NOW), null);
});

test("confirmation: a recent confirmation is fresh; a stale edit does not rescue it", () => {
  // A site confirmed 30h ago but bed-edited 1min ago: general freshness is fresh,
  // but the CONFIRMATION axis must read stale — that is the honesty gain.
  const confirmedAt = new Date(Date.parse(NOW) - (STALE_HOURS + 6) * 3_600_000).toISOString();
  assert.equal(confirmationFreshnessOf(confirmedAt, NOW), "stale");
  assert.equal(freshnessOf("2026-07-01T11:59:00Z", NOW), "fresh");
});

test("confirmation: an unparseable timestamp is skipped, not treated as newest", () => {
  const events = [
    { type: "site.confirmed", occurredAt: "not-a-date" },
    { type: "site.confirmed", occurredAt: "2026-07-01T10:00:00Z" },
  ];
  assert.equal(lastConfirmedAt(events), "2026-07-01T10:00:00Z");
});
