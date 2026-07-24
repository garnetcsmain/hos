import { test } from "node:test";
import assert from "node:assert/strict";

import {
  haystackMatches,
  needMatchesQuery,
  needMatchesTriage,
  normalizeText,
  siteMatchesQuery,
  TRIAGE_PRESETS,
} from "./boardSearch.ts";
import type { NeedView, SiteView } from "@/app/lib/domain/coordinationViews";
import type { NeedCategory, SiteCategory } from "@/app/lib/domain/coordination";

const NOW = "2026-07-24T12:00:00Z";

const CATEGORY_LABEL: Record<NeedCategory, string> = {
  rescue: "Rescate",
  water: "Agua",
  food: "Comida",
  formula: "Fórmula",
  medical: "Médico",
  shelter: "Refugio",
  hygiene: "Higiene",
  clothing: "Ropa",
  other: "Otro",
};

const SITE_CATEGORY_LABEL: Record<SiteCategory, string> = {
  acopio: "Acopio",
  refugio: "Refugio",
  medico: "Atención médica",
  internet: "Internet / carga",
  mascotas: "Mascotas",
  otro: "Otro",
};

function needView(over: Partial<NeedView["need"]> = {}, orgName?: string): NeedView {
  return {
    need: {
      id: "ND-1",
      createdAt: NOW,
      updatedAt: NOW,
      orgId: "ORG-1",
      siteId: null,
      district: "Maiquetía",
      lat: null,
      lng: null,
      category: "water",
      quantity: 100,
      unit: "L",
      urgency: "high",
      status: "open",
      claimedByOrgId: null,
      notes: "",
      sourceId: null,
      syncedAt: null,
      ...over,
    },
    org: orgName ? { id: "ORG-1", createdAt: NOW, name: orgName, kind: "ngo" } : null,
    claimedByOrg: null,
    freshness: "fresh",
    matches: [],
  };
}

function siteView(over: Partial<SiteView["site"]> = {}): SiteView {
  return {
    site: {
      id: "ST-1",
      createdAt: NOW,
      updatedAt: NOW,
      name: "Refugio Central",
      orgId: "ORG-1",
      district: "La Guaira",
      category: "refugio",
      lat: null,
      lng: null,
      bedsTotal: 10,
      bedsFree: 4,
      status: "active",
      notes: "",
      sourceId: null,
      syncedAt: null,
      announcement: "",
      announcementUntil: null,
      radiusM: null,
      createdByUserId: null,
      createdByEmail: null,
      ...over,
    },
    org: null,
    freshness: "fresh",
  };
}

// --- normalizeText / haystackMatches ---

test("normalizeText folds accents and case so phone typing matches", () => {
  assert.equal(normalizeText("Maiquetía"), "maiquetia");
  assert.equal(normalizeText("  MÉDICO "), "medico");
});

test("haystackMatches: blank query matches everything (search never hides on its own)", () => {
  assert.equal(haystackMatches("cualquier cosa", ""), true);
  assert.equal(haystackMatches("cualquier cosa", "   "), true);
});

test("haystackMatches: all tokens must be present (AND semantics)", () => {
  assert.equal(haystackMatches("agua en Maiquetía urgente", "agua maiquetia"), true);
  assert.equal(haystackMatches("agua en Maiquetía", "agua caracas"), false);
});

// --- needMatchesQuery ---

test("needMatchesQuery matches the Spanish category label without diacritics", () => {
  const v = needView({ category: "medical" });
  assert.equal(needMatchesQuery(v, "medico", CATEGORY_LABEL), true);
});

test("needMatchesQuery matches district, unit, notes and org name", () => {
  const v = needView({ notes: "entrega tarde", unit: "botellones" }, "Cruz Roja");
  assert.equal(needMatchesQuery(v, "maiquetia", CATEGORY_LABEL), true);
  assert.equal(needMatchesQuery(v, "botellones", CATEGORY_LABEL), true);
  assert.equal(needMatchesQuery(v, "tarde", CATEGORY_LABEL), true);
  assert.equal(needMatchesQuery(v, "cruz roja", CATEGORY_LABEL), true);
  assert.equal(needMatchesQuery(v, "hospital", CATEGORY_LABEL), false);
});

test("needMatchesQuery never leaks the id or coordinates into search", () => {
  const v = needView({ id: "ND-SECRET", lat: 10.6, lng: -66.9 });
  assert.equal(needMatchesQuery(v, "ND-SECRET", CATEGORY_LABEL), false);
  assert.equal(needMatchesQuery(v, "10.6", CATEGORY_LABEL), false);
});

// --- siteMatchesQuery ---

test("siteMatchesQuery matches name, district and category label", () => {
  const v = siteView({ name: "Escuela Bolívar", district: "Catia", category: "acopio" });
  assert.equal(siteMatchesQuery(v, "bolivar", SITE_CATEGORY_LABEL), true);
  assert.equal(siteMatchesQuery(v, "catia acopio", SITE_CATEGORY_LABEL), true);
  assert.equal(siteMatchesQuery(v, "refugio", SITE_CATEGORY_LABEL), false);
});

// --- triage presets ---

test("TRIAGE_PRESETS lead with the neutral 'todas' escape hatch", () => {
  assert.equal(TRIAGE_PRESETS[0].id, "todas");
  assert.equal(TRIAGE_PRESETS.length, 4);
});

test("triage 'todas' keeps every need including resolved ones", () => {
  assert.equal(needMatchesTriage(needView({ status: "received" }), "todas", NOW), true);
});

test("triage 'criticas' = critical urgency and still actionable", () => {
  assert.equal(needMatchesTriage(needView({ urgency: "critical", status: "open" }), "criticas", NOW), true);
  assert.equal(needMatchesTriage(needView({ urgency: "critical", status: "claimed" }), "criticas", NOW), true);
  assert.equal(needMatchesTriage(needView({ urgency: "high", status: "open" }), "criticas", NOW), false);
  assert.equal(needMatchesTriage(needView({ urgency: "critical", status: "received" }), "criticas", NOW), false);
});

test("triage 'sin_asignar' = open and unclaimed", () => {
  assert.equal(needMatchesTriage(needView({ status: "open", claimedByOrgId: null }), "sin_asignar", NOW), true);
  assert.equal(
    needMatchesTriage(needView({ status: "claimed", claimedByOrgId: "ORG-2" }), "sin_asignar", NOW),
    false,
  );
});

test("triage 'vencidas' = actionable and stale (>24h since update)", () => {
  const stale = needView({ status: "open", updatedAt: "2026-07-22T00:00:00Z" }); // ~60h old
  const fresh = needView({ status: "open", updatedAt: "2026-07-24T09:00:00Z" }); // 3h old
  assert.equal(needMatchesTriage(stale, "vencidas", NOW), true);
  assert.equal(needMatchesTriage(fresh, "vencidas", NOW), false);
  // A stale but already-resolved need is not pending work, so it drops out.
  const staleResolved = needView({ status: "received", updatedAt: "2026-07-22T00:00:00Z" });
  assert.equal(needMatchesTriage(staleResolved, "vencidas", NOW), false);
});
