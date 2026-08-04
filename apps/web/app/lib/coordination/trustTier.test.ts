import { test } from "node:test";
import assert from "node:assert/strict";
import { trustTierFromPayload, trustTierOf } from "./trustTier.ts";

test("a signed-in coordinator (attested identity) is verified", () => {
  assert.equal(trustTierOf({ isCoordinator: true, userId: "u-123" }), "verified");
});

test("a shared-token coordinator (no userId) is only honor — it names no person", () => {
  assert.equal(trustTierOf({ isCoordinator: true, userId: null }), "honor");
});

test("a self-signup contributor is honor even with an attested identity (not coordinator-vouched)", () => {
  assert.equal(trustTierOf({ isCoordinator: false, userId: "u-456" }), "honor");
});

test("an anonymous / system write is honor", () => {
  assert.equal(trustTierOf({ isCoordinator: false, userId: null }), "honor");
});

test("trustTierFromPayload reads back the two known tiers", () => {
  assert.equal(trustTierFromPayload({ trust: "verified" }), "verified");
  assert.equal(trustTierFromPayload({ trust: "honor" }), "honor");
});

test("trustTierFromPayload never invents a tier: missing or malformed reads as null (never upgraded)", () => {
  assert.equal(trustTierFromPayload({}), null); // legacy write, before the tier existed
  assert.equal(trustTierFromPayload({ trust: "bogus" }), null);
  assert.equal(trustTierFromPayload({ trust: true }), null);
});
