import { test } from "node:test";
import assert from "node:assert/strict";

import { isAllowedCoordinator, parseAllowlist } from "./allowlist.ts";

test("parseAllowlist splits on commas/whitespace and normalizes case", () => {
  assert.deepEqual(parseAllowlist("A@x.org, b@y.org\n  C@z.org"), ["a@x.org", "b@y.org", "c@z.org"]);
  assert.deepEqual(parseAllowlist(undefined), []);
  assert.deepEqual(parseAllowlist(""), []);
});

test("invite-only: an empty allowlist admits nobody (fail closed)", () => {
  assert.equal(isAllowedCoordinator("a@x.org", []), false);
});

test("allowlist match is case-insensitive", () => {
  const al = parseAllowlist("Coord@Example.org");
  assert.equal(isAllowedCoordinator("coord@example.org", al), true);
  assert.equal(isAllowedCoordinator("COORD@EXAMPLE.ORG", al), true);
});

test("a non-listed email is rejected", () => {
  assert.equal(isAllowedCoordinator("intruder@x.org", parseAllowlist("a@x.org")), false);
});

test("null/empty email is rejected", () => {
  assert.equal(isAllowedCoordinator(null, parseAllowlist("a@x.org")), false);
  assert.equal(isAllowedCoordinator("", parseAllowlist("a@x.org")), false);
});
