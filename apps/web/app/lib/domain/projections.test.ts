import { test } from "node:test";
import assert from "node:assert/strict";

import { toPublicFound, toPublicMissing } from "./projections.ts";
import type { FoundReport, MissingReport } from "./types.ts";

function foundWith(condition: FoundReport["condition"]): FoundReport {
  return {
    id: "FP-VE-TEST01",
    createdAt: "2026-07-07T00:00:00.000Z",
    updatedAt: "2026-07-07T00:00:00.000Z",
    fullName: "Maria Jose Perez",
    givenName: "Maria",
    age: 34,
    sex: "F",
    foundLocation: "Refugio San Jose, sala 3",
    city: "Caracas",
    foundAt: "2026-07-06T00:00:00.000Z",
    condition,
    description: "Ingresó consciente, sin documentos.",
    reporterOrg: "Cruz Roja",
    reporterName: "Dr. Ramirez",
    reporterContact: "+58 412 555 1942",
    status: "open",
    source: "test",
    photoUrl: null,
  };
}

const missing: MissingReport = {
  id: "MP-VE-TEST01",
  createdAt: "2026-07-07T00:00:00.000Z",
  updatedAt: "2026-07-07T00:00:00.000Z",
  fullName: "Carlos Alberto Gomez",
  givenName: "Carlos",
  age: 9,
  sex: "M",
  lastSeenLocation: "Av. Sucre, frente a la panadería",
  city: "La Guaira",
  lastSeenAt: "2026-07-01T00:00:00.000Z",
  description: "Camisa azul, mochila roja.",
  sensitiveNotes: "Toma medicación para el asma.",
  reporterName: "Ana Gomez",
  reporterRelationship: "madre",
  reporterContact: "ana@example.com",
  consent: true,
  status: "open",
  source: "test",
  photoUrl: null,
};

test("public found withholds the deceased condition — no bare 'Fallecida' before a human reaches the family (Board D4)", () => {
  const projected = toPublicFound(foundWith("deceased"));
  assert.equal(projected.condition, "unknown");
  assert.notEqual(projected.condition, "deceased");
});

test("public found preserves reassuring/neutral conditions", () => {
  for (const condition of ["alive", "injured", "hospitalized", "unknown"] as const) {
    assert.equal(toPublicFound(foundWith(condition)).condition, condition);
  }
});

test("public found projection carries no server-only PII", () => {
  const projected = toPublicFound(foundWith("alive")) as unknown as Record<string, unknown>;
  for (const leaked of ["fullName", "foundLocation", "description", "reporterOrg", "reporterName", "reporterContact"]) {
    assert.equal(leaked in projected, false, `public found must not expose ${leaked}`);
  }
});

test("public missing projection carries no server-only PII", () => {
  const projected = toPublicMissing(missing) as unknown as Record<string, unknown>;
  for (const leaked of ["fullName", "lastSeenLocation", "description", "sensitiveNotes", "reporterName", "reporterContact"]) {
    assert.equal(leaked in projected, false, `public missing must not expose ${leaked}`);
  }
});
