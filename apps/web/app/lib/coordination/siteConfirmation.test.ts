import { test } from "node:test";
import assert from "node:assert/strict";

import { confirmationsBySite, confirmationFrom } from "./siteConfirmation.ts";
import { STALE_HOURS } from "./freshness.ts";
import type { HosEvent } from "../domain/types.ts";

const NOW = "2026-07-01T12:00:00Z";

function ev(partial: Partial<HosEvent>): HosEvent {
  return {
    id: 1,
    occurredAt: NOW,
    entityType: "site",
    entityId: "site-1",
    type: "site.confirmed",
    actor: "org:test",
    payload: {},
    ...partial,
  };
}

test("confirmationsBySite: picks the most recent site.confirmed per site", () => {
  const map = confirmationsBySite([
    ev({ entityId: "site-1", occurredAt: "2026-07-01T08:00:00Z" }),
    ev({ entityId: "site-1", occurredAt: "2026-07-01T11:00:00Z" }),
    ev({ entityId: "site-2", occurredAt: "2026-07-01T09:00:00Z" }),
  ]);
  assert.equal(map.get("site-1"), "2026-07-01T11:00:00Z");
  assert.equal(map.get("site-2"), "2026-07-01T09:00:00Z");
});

test("confirmationsBySite: a bed-count edit or announcement is NOT a confirmation", () => {
  const map = confirmationsBySite([
    ev({ entityId: "site-1", type: "site.capacity_updated" }),
    ev({ entityId: "site-1", type: "site.announcement_set" }),
  ]);
  assert.equal(map.get("site-1"), undefined);
});

test("confirmationsBySite: ignores events for other entity types sharing the id", () => {
  const map = confirmationsBySite([
    ev({ entityType: "need", entityId: "site-1", type: "site.confirmed" }),
  ]);
  assert.equal(map.get("site-1"), undefined);
});

test("confirmationsBySite: skips unparseable timestamps", () => {
  const map = confirmationsBySite([ev({ entityId: "site-1", occurredAt: "not-a-date" })]);
  assert.equal(map.get("site-1"), undefined);
});

test("confirmationFrom: never-confirmed is null freshness, honestly distinct from stale", () => {
  const c = confirmationFrom(null, NOW);
  assert.equal(c.lastConfirmedAt, null);
  assert.equal(c.freshness, null);
});

test("confirmationFrom: a recent confirmation is fresh; an old one decays to stale", () => {
  const recent = confirmationFrom("2026-07-01T11:30:00Z", NOW);
  assert.equal(recent.freshness, "fresh");
  const old = new Date(Date.parse(NOW) - (STALE_HOURS + 1) * 3_600_000).toISOString();
  assert.equal(confirmationFrom(old, NOW).freshness, "stale");
});
