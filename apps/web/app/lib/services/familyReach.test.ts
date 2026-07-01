import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FAMILY_REACH_CHANNEL,
  familyReachObligationText,
  isSensitiveOutcome,
} from "./familyReach.ts";
import type { Condition } from "@/app/lib/domain/types";

test("family-reach: deceased is a sensitive outcome; others are not", () => {
  assert.equal(isSensitiveOutcome("deceased"), true);
  for (const c of ["alive", "injured", "hospitalized", "unknown"] as Condition[]) {
    assert.equal(isSensitiveOutcome(c), false);
  }
});

test("family-reach: obligation text names the person and stays honest", () => {
  const { subject, body } = familyReachObligationText("Carlos", "alive");
  assert.match(subject, /Carlos/);
  assert.match(body, /verificación humana/);
  assert.doesNotMatch(body, /fallecid/i);
});

test("family-reach: deceased text adds compassionate, no-automated-channel guidance", () => {
  const { body } = familyReachObligationText("Carlos", "deceased");
  assert.match(body, /fallecid/i);
  assert.match(body, /en persona/i);
  assert.match(body, /[Nn]unca por un canal autom/);
});

test("family-reach: falls back to a neutral name when the given name is blank", () => {
  assert.match(familyReachObligationText("", "alive").subject, /su familiar/);
});

test("family-reach: the obligation channel is the coordinator callback", () => {
  assert.equal(FAMILY_REACH_CHANNEL, "coordinator_callback");
});
