import { test } from "node:test";
import assert from "node:assert/strict";
import type { Condition, FoundReport, MatchCandidate, MissingReport } from "@/app/lib/domain/types";

// Use a throwaway in-memory DB. This must be set BEFORE db/client.ts is
// evaluated (it captures the path at import), so every app module below is
// pulled in via dynamic import after the env var is in place. node's test
// runner isolates each file in its own process, so this does not leak.
process.env.HOS_DB_PATH = ":memory:";

const { insertMissing, getMissing } = await import("../repositories/missingReports.ts");
const { insertFound, getFound } = await import("../repositories/foundReports.ts");
const { upsertCandidate } = await import("../repositories/matches.ts");
const { insertNotification, getNotification } = await import("../repositories/notifications.ts");
const { eventsForEntities } = await import("../repositories/events.ts");
const { recordVerification } = await import("./verification.ts");
const { recordFamilyReach, FAMILY_REACH_CHANNEL } = await import("./familyReach.ts");
const { resetAllTablesForTests } = await import("../db/testing.ts");

// Clean slate so this suite is re-runnable against a shared Postgres too.
await resetAllTablesForTests();

const NOW = "2026-06-30T00:00:00Z";

/** Seed a pending candidate ready to confirm. Unique suffix per test so the
 *  shared in-memory DB does not collide across tests. */
async function seedPair(suffix: string, condition: Condition = "alive") {
  const missing: MissingReport = {
    id: `MP-${suffix}`,
    createdAt: NOW,
    updatedAt: NOW,
    fullName: "Carlos Perez",
    givenName: "Carlos",
    age: 34,
    sex: "M",
    lastSeenLocation: "",
    city: "Caracas",
    lastSeenAt: null,
    description: "",
    sensitiveNotes: "",
    reporterName: "Ana",
    reporterRelationship: "madre",
    reporterContact: "+58 412 555 1942",
    consent: true,
    status: "candidate",
    source: "test",
    photoUrl: null,
  };
  const found: FoundReport = {
    id: `FP-${suffix}`,
    createdAt: NOW,
    updatedAt: NOW,
    fullName: "Carlos Perez",
    givenName: "Carlos",
    age: 35,
    sex: "M",
    foundLocation: "Refugio 12",
    city: "Caracas",
    foundAt: null,
    condition,
    description: "",
    reporterOrg: "Refugio 12",
    reporterName: "",
    reporterContact: "",
    status: "open",
    source: "test",
    photoUrl: null,
  };
  const candidate: MatchCandidate = {
    id: `MC-${suffix}`,
    createdAt: NOW,
    updatedAt: NOW,
    missingId: missing.id,
    foundId: found.id,
    score: 90,
    factors: [],
    status: "pending",
    model: "rule-engine@v1",
  };
  await insertMissing(missing);
  await insertFound(found);
  await upsertCandidate(candidate);
  return { missing, found, candidate };
}

function confirm(candidateId: string) {
  return recordVerification({
    candidateId,
    decision: "confirmed",
    verifierOrg: "Cruz Roja",
    verifierName: "",
    evidence: "documento de identidad",
    confidence: null,
  });
}

test("confirm creates a 'matched' case and a queued obligation, NOT resolved", async () => {
  const { missing, found, candidate } = await seedPair("A");
  const result = await confirm(candidate.id);

  assert.equal(result.confirmed, true);
  assert.equal(result.resolved, false, "a confirm must not resolve the case");
  assert.ok(result.notificationId);

  assert.equal((await getMissing(missing.id))?.status, "matched");
  assert.equal((await getFound(found.id))?.status, "matched");

  const obligation = await getNotification(result.notificationId!);
  assert.equal(obligation?.channel, FAMILY_REACH_CHANNEL);
  assert.equal(obligation?.status, "queued");
});

test("reaching the family resolves the case and writes the real receipt", async () => {
  const { missing, found, candidate } = await seedPair("B");
  const { notificationId } = await confirm(candidate.id);

  const reach = await recordFamilyReach({
    notificationId: notificationId!,
    outcome: "reached",
    coordinatorOrg: "Cruz Roja",
    note: "contacto telefónico con la madre",
  });

  assert.equal(reach.resolved, true);
  assert.equal(reach.status, "delivered");
  assert.equal((await getNotification(notificationId!))?.status, "delivered");
  assert.equal((await getMissing(missing.id))?.status, "resolved");
  assert.equal((await getFound(found.id))?.status, "resolved");

  const types = (await eventsForEntities([notificationId!])).map((e) => e.type);
  assert.ok(types.includes("family.reached"), "a real receipt event is written");
});

test("an unreachable attempt is tracked and leaves the case matched", async () => {
  const { missing, candidate } = await seedPair("C");
  const { notificationId } = await confirm(candidate.id);

  const reach = await recordFamilyReach({
    notificationId: notificationId!,
    outcome: "unreachable",
    coordinatorOrg: "Cruz Roja",
    note: "sin respuesta",
  });

  assert.equal(reach.resolved, false);
  assert.equal((await getNotification(notificationId!))?.status, "queued", "obligation stays open for retry");
  assert.equal((await getMissing(missing.id))?.status, "matched", "case is not resolved by a failed attempt");

  const types = (await eventsForEntities([notificationId!])).map((e) => e.type);
  assert.ok(types.includes("family.reach_attempted"));
});

test("recordFamilyReach rejects a notification that is not an obligation", async () => {
  await insertNotification({
    id: "NT-NOTOBLIG",
    createdAt: NOW,
    missingId: "MP-A",
    candidateId: null,
    channel: "in_app",
    recipient: "x",
    status: "queued",
    subject: "s",
    body: "b",
  });
  await assert.rejects(
    recordFamilyReach({
      notificationId: "NT-NOTOBLIG",
      outcome: "reached",
      coordinatorOrg: "Cruz Roja",
      note: "",
    }),
  );
});
