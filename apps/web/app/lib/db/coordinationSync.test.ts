import { test } from "node:test";
import assert from "node:assert/strict";

// In-memory DB; set before db/client.ts is imported (see familyReach.flow.test.ts).
process.env.HOS_DB_PATH = ":memory:";

const { runCoordinationSync } = await import("./coordinationSync.ts");
const { db } = await import("./client.ts");
const { resetAllTablesForTests } = await import("../db/testing.ts");
const svc = await import("../services/coordination.ts");

import type { SourcePunto } from "./coordinationSync.ts";

const T0 = "2026-07-01T00:00:00+00:00";
const T1 = "2026-07-02T00:00:00+00:00";

function punto(over: Partial<SourcePunto> = {}): SourcePunto {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    nombre: "Acopio Prueba",
    categoria: "acopio",
    tipo: "ayuda",
    lat: 10.6,
    lng: -66.93,
    direccion: "La Guaira, calle 1",
    horario: null,
    telefono: null,
    descripcion: "Recibe agua y alimentos",
    necesitan: null,
    ofrecen: null,
    estado: "verified",
    created_at: T0,
    updated_at: T0,
    ...over,
  };
}

function needPunto(over: Partial<SourcePunto> = {}): SourcePunto {
  return punto({
    id: "00000000-0000-0000-0000-000000000002",
    nombre: "Familia atrapada",
    categoria: "comida", // unreliable on purpose — text must win
    tipo: "necesidad",
    descripcion: "Urgencia: alta — personas atrapadas en Maiquetía, necesitan rescate",
    direccion: null,
    ...over,
  });
}

async function needRow(sourceId: string) {
  return (await db
    .prepare(`SELECT * FROM needs WHERE source_id = ?`)
    .get(sourceId)) as Record<string, unknown> | undefined;
}

test("sync: inserts source rows with text-first classification", async () => {
  await resetAllTablesForTests();
  const summary = await runCoordinationSync(async () => [punto(), needPunto()]);

  assert.equal(summary.sitesInserted, 1);
  assert.equal(summary.needsInserted, 1);

  const need = await needRow("00000000-0000-0000-0000-000000000002");
  assert.ok(need);
  assert.equal(need.category, "rescue"); // NOT "comida" — text wins
  assert.equal(need.urgency, "critical");
  assert.equal(need.district, "Maiquetía");
  // Pin (La Guaira) is ~2 km from the Maiquetía centroid -> kept as exact.
  assert.equal(Number(need.lat), 10.6);
});

test("sync: untouched imported rows refresh; locally-edited rows are preserved", async () => {
  await resetAllTablesForTests();
  await runCoordinationSync(async () => [punto(), needPunto()]);

  // The protection predicate is updated_at > synced_at at millisecond grain.
  // This test can otherwise run fast enough to land the local edit in the
  // SAME millisecond as the sync stamp (impossible at human/cron timescales),
  // so step past it explicitly.
  await new Promise((r) => setTimeout(r, 5));

  // A coordinator receives the need in HOS (local edit bumps updated_at).
  const before = await needRow("00000000-0000-0000-0000-000000000002");
  await svc.transitionNeed(
    { needId: String(before!.id), action: "receive", byOrgId: null, note: "" },
    "coordinator:test@hos",
  );

  // The source later edits BOTH rows.
  const summary = await runCoordinationSync(async () => [
    punto({ nombre: "Acopio Prueba Renombrado", updated_at: T1 }),
    needPunto({ descripcion: "texto nuevo del origen", updated_at: T1 }),
  ]);

  // Site (untouched locally) refreshed; need (received locally) preserved.
  assert.equal(summary.sitesUpdated, 1);
  assert.equal(summary.needsUpdated, 0);
  assert.equal(summary.preservedLocalEdits, 1);

  const site = (await db
    .prepare(`SELECT name FROM sites WHERE source_id = ?`)
    .get("00000000-0000-0000-0000-000000000001")) as { name: string };
  assert.equal(site.name, "Acopio Prueba Renombrado");

  const need = await needRow("00000000-0000-0000-0000-000000000002");
  assert.equal(need!.status, "received"); // the local decision survived the sync
  assert.notEqual(need!.notes, "texto nuevo del origen");
});

test("sync: rows created directly in HOS are never touched", async () => {
  await resetAllTablesForTests();
  await runCoordinationSync(async () => [punto()]);

  const org = await svc.createOrg({ name: "Org Local", kind: "ngo" }, "coordinator:test@hos");
  const local = await svc.createNeed(
    {
      orgId: org.id,
      siteId: null,
      district: "Catia",
      lat: null,
      lng: null,
      category: "water",
      quantity: 10,
      unit: "L",
      urgency: "high",
      notes: "creado directamente en HOS",
    },
    "coordinator:test@hos",
  );

  await runCoordinationSync(async () => [punto({ updated_at: T1 })]);

  const row = (await db.prepare(`SELECT * FROM needs WHERE id = ?`).get(local.id)) as Record<
    string,
    unknown
  >;
  assert.equal(row.notes, "creado directamente en HOS");
  assert.equal(row.source_id, null);
});

test("sync: refuses a DB seeded before provenance existed", async () => {
  await resetAllTablesForTests();
  // Simulate the old seed: a site with no source_id.
  const org = await svc.createOrg({ name: "Org Vieja", kind: "other" }, "coordinator:test@hos");
  await svc.createSite(
    {
      name: "Sitio sin provenance",
      orgId: org.id,
      district: "Catia",
      category: "acopio",
      lat: null,
      lng: null,
      bedsTotal: 0,
      bedsFree: 0,
      notes: "",
    },
    { by: "coordinator:test@hos", userId: null, email: "test@hos", isCoordinator: true },
  );
  await assert.rejects(
    () => runCoordinationSync(async () => [punto()]),
    /seed:coordination/,
  );
});

test("sync: skips out-of-scope and community-flagged rows", async () => {
  await resetAllTablesForTests();
  const summary = await runCoordinationSync(async () => [
    punto({ id: "00000000-0000-0000-0000-00000000000a", estado: "old" }),
    // necesidad far outside the corridor with no text locality
    needPunto({ id: "00000000-0000-0000-0000-00000000000b", descripcion: "ayuda", lat: 8.6, lng: -70.2 }),
    // ayuda that is not a physical aid point
    punto({ id: "00000000-0000-0000-0000-00000000000c", categoria: "voluntarios", descripcion: "grupo" }),
  ]);
  assert.equal(summary.skippedFlaggedOld, 1);
  assert.equal(summary.skippedOutOfScope, 2);
  assert.equal(summary.sitesInserted, 0);
  assert.equal(summary.needsInserted, 0);
});
