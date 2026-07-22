import { test } from "node:test";
import assert from "node:assert/strict";

import {
  normalize,
  tokenize,
  matchesTokens,
  needHaystack,
  siteHaystack,
  filterNeeds,
  filterSites,
} from "./search.ts";
import type { NeedCategory, SiteCategory } from "../domain/coordination.ts";
import type { NeedView, SiteView } from "../domain/coordinationViews.ts";

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

function needView(over: Partial<NeedView["need"]> & { orgName?: string }): NeedView {
  const { orgName, ...need } = over;
  return {
    need: {
      id: "n1",
      createdAt: "2026-07-01T00:00:00Z",
      updatedAt: "2026-07-01T00:00:00Z",
      orgId: "o1",
      siteId: null,
      district: "Chacao",
      lat: null,
      lng: null,
      category: "water",
      quantity: 100,
      unit: "botellones",
      urgency: "high",
      status: "open",
      claimedByOrgId: null,
      notes: "",
      sourceId: null,
      syncedAt: null,
      ...need,
    },
    org: orgName ? { id: "o1", createdAt: "2026-07-01T00:00:00Z", name: orgName, kind: "ngo" } : null,
    claimedByOrg: null,
    freshness: "fresh",
    matches: [],
  };
}

function siteView(over: Partial<SiteView["site"]> & { orgName?: string }): SiteView {
  const { orgName, ...site } = over;
  return {
    site: {
      id: "s1",
      createdAt: "2026-07-01T00:00:00Z",
      updatedAt: "2026-07-01T00:00:00Z",
      name: "Refugio Central",
      orgId: "o1",
      district: "Petare",
      category: "refugio",
      lat: null,
      lng: null,
      bedsTotal: 20,
      bedsFree: 5,
      status: "active",
      notes: "",
      sourceId: null,
      syncedAt: null,
      announcement: "",
      announcementUntil: null,
      radiusM: null,
      createdByUserId: null,
      createdByEmail: null,
      ...site,
    },
    org: orgName ? { id: "o1", createdAt: "2026-07-01T00:00:00Z", name: orgName, kind: "shelter" } : null,
    freshness: "fresh",
  };
}

test("normalize strips accents and lowercases", () => {
  assert.equal(normalize("Maiquetía"), "maiquetia");
  assert.equal(normalize("  FÓRMULA  "), "formula");
});

test("tokenize splits on whitespace and drops empties", () => {
  assert.deepEqual(tokenize("  agua   petare "), ["agua", "petare"]);
  assert.deepEqual(tokenize("   "), []);
});

test("matchesTokens requires every token (AND), order-independent", () => {
  assert.equal(matchesTokens("Agua potable en Petare", tokenize("petare agua")), true);
  assert.equal(matchesTokens("Agua potable en Chacao", tokenize("petare agua")), false);
});

test("an empty query matches everything (not a filter)", () => {
  assert.equal(matchesTokens("cualquier cosa", tokenize("")), true);
});

test("needHaystack includes the Spanish category label so 'agua' finds a water need", () => {
  const h = needHaystack(needView({ category: "water" }), CATEGORY_LABEL);
  assert.match(normalize(h), /agua/);
});

test("filterNeeds: accent-insensitive district match", () => {
  const needs = [
    needView({ district: "Maiquetía", category: "water" }),
    needView({ district: "Chacao", category: "food" }),
  ];
  const out = filterNeeds(needs, "maiquetia", CATEGORY_LABEL);
  assert.equal(out.length, 1);
  assert.equal(out[0].need.district, "Maiquetía");
});

test("filterNeeds: multi-token narrows across fields (category + district)", () => {
  const needs = [
    needView({ district: "Petare", category: "water" }),
    needView({ district: "Petare", category: "food" }),
    needView({ district: "Chacao", category: "water" }),
  ];
  const out = filterNeeds(needs, "agua petare", CATEGORY_LABEL);
  assert.equal(out.length, 1);
  assert.equal(out[0].need.district, "Petare");
  assert.equal(out[0].need.category, "water");
});

test("filterNeeds: matches on the requesting org name", () => {
  const needs = [
    needView({ orgName: "Cruz Roja" }),
    needView({ orgName: "Bomberos" }),
  ];
  assert.equal(filterNeeds(needs, "cruz", CATEGORY_LABEL).length, 1);
});

test("filterNeeds: empty query returns the same list reference (no-op)", () => {
  const needs = [needView({})];
  assert.equal(filterNeeds(needs, "  ", CATEGORY_LABEL), needs);
});

test("filterSites: matches on site name and is accent-insensitive", () => {
  const sites = [
    siteView({ name: "Refugio Petare Norte" }),
    siteView({ name: "Acopio Chacao", district: "Chacao", category: "acopio" }),
  ];
  assert.equal(filterSites(sites, "petare", SITE_CATEGORY_LABEL).length, 1);
});

test("filterSites: matches on the announcement text", () => {
  const sites = [
    siteView({ name: "A", announcement: "Hoy entregan agua 2-5pm" }),
    siteView({ name: "B" }),
  ];
  const out = filterSites(sites, "agua", SITE_CATEGORY_LABEL);
  assert.equal(out.length, 1);
  assert.equal(out[0].site.name, "A");
});

test("siteHaystack includes the Spanish category label", () => {
  const h = siteHaystack(siteView({ category: "medico" }), SITE_CATEGORY_LABEL);
  assert.match(normalize(h), /atencion medica/);
});
