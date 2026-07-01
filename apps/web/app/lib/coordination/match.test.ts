import { test } from "node:test";
import assert from "node:assert/strict";

import { rankOffersForNeed } from "./match.ts";
import type { Need, Offer } from "@/app/lib/domain/coordination";

const NOW = "2026-07-01T00:00:00Z";

function need(over: Partial<Need> = {}): Need {
  return {
    id: "ND-1",
    createdAt: NOW,
    updatedAt: NOW,
    orgId: "ORG-1",
    siteId: null,
    district: "La Guaira",
    category: "water",
    quantity: 100,
    unit: "L",
    urgency: "high",
    status: "open",
    claimedByOrgId: null,
    notes: "",
    ...over,
  };
}

function offer(over: Partial<Offer> = {}): Offer {
  return {
    id: "OF-1",
    createdAt: NOW,
    updatedAt: NOW,
    orgId: "ORG-2",
    district: "La Guaira",
    category: "water",
    quantity: 200,
    unit: "L",
    status: "available",
    notes: "",
    ...over,
  };
}

test("match: only same-category offers are suggested", () => {
  const matches = rankOffersForNeed(need({ category: "water" }), [
    offer({ id: "OF-food", category: "food" }),
    offer({ id: "OF-water", category: "water" }),
  ]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].offer.id, "OF-water");
});

test("match: same district + sufficient quantity scores highest", () => {
  const [best] = rankOffersForNeed(need(), [offer()]);
  assert.equal(best.score, 100);
  assert.ok(best.reasons.some((r) => /Mismo distrito/.test(r)));
  assert.ok(best.reasons.some((r) => /suficiente/.test(r)));
});

test("match: a different district scores lower and says why", () => {
  const [m] = rankOffersForNeed(need(), [offer({ district: "Caracas" })]);
  assert.ok(m.score < 100);
  assert.ok(m.reasons.some((r) => /transporte/.test(r)));
});

test("match: partial quantity is flagged, not hidden", () => {
  const [m] = rankOffersForNeed(need({ quantity: 500 }), [offer({ quantity: 100 })]);
  assert.ok(m.reasons.some((r) => /parcial/i.test(r)));
});

test("match: unavailable offers are never suggested", () => {
  assert.equal(rankOffersForNeed(need(), [offer({ status: "depleted" })]).length, 0);
});

test("match: results are sorted best-first", () => {
  const matches = rankOffersForNeed(need(), [
    offer({ id: "far", district: "Caracas" }),
    offer({ id: "near", district: "La Guaira" }),
  ]);
  assert.deepEqual(matches.map((m) => m.offer.id), ["near", "far"]);
});
