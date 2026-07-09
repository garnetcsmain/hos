import { test } from "node:test";
import assert from "node:assert/strict";

import { draftFromText, matchOrg } from "./draft.ts";

// The free-text box turns a sentence into a form DRAFT the coordinator reviews.
// It reuses the classifier, so "atrapados" is rescue here just as in the sync.

test("draft: fills category, urgency, district, quantity and unit from a sentence", () => {
  const d = draftFromText("Se necesitan 40 litros de agua en Maiquetía, urgente");
  assert.equal(d.category, "water");
  assert.equal(d.urgency, "critical"); // "urgente"
  assert.equal(d.district, "Maiquetía");
  assert.equal(d.quantity, 40);
  assert.equal(d.unit, "L");
});

test("draft: rescue phrasing beats supply keywords (same rule as the sync)", () => {
  const d = draftFromText("Hay personas atrapadas en La Guaira, llevar agua");
  assert.equal(d.category, "rescue");
  assert.equal(d.urgency, "critical");
  assert.equal(d.district, "La Guaira");
});

test("draft: units — botellones, pañales, cajas", () => {
  assert.equal(draftFromText("200 botellones de agua").unit, "botellones");
  assert.equal(draftFromText("necesitamos 50 pañales").unit, "pañales");
  assert.equal(draftFromText("10 cajas de comida").unit, "cajas");
});

test("draft: no district / quantity in text -> those fields stay null", () => {
  const d = draftFromText("hace falta comida");
  assert.equal(d.category, "food");
  assert.equal(d.district, null);
  assert.equal(d.quantity, null);
});

test("matchOrg: links the text to a known org by a distinctive word", () => {
  const orgs = [
    { id: "o1", name: "Cruz Roja Venezolana" },
    { id: "o2", name: "Bomberos de La Guaira" },
    { id: "o3", name: "Comunidad · caracasayuda.com" },
  ];
  assert.equal(matchOrg("donación de la Cruz Roja para Catia", orgs), "o1");
  assert.equal(matchOrg("reporte de bomberos", orgs), "o2");
  // Generic words alone ("comunidad") must not match; the distinctive token does.
  assert.equal(matchOrg("aviso de caracasayuda", orgs), "o3");
  assert.equal(matchOrg("un vecino cualquiera", orgs), null);
});
