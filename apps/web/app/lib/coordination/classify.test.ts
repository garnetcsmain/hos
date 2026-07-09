import { test } from "node:test";
import assert from "node:assert/strict";

import {
  districtFromText,
  locateNeed,
  needCategoryFromText,
  siteCategoryFromSource,
  urgencyFromText,
} from "./classify.ts";

// The caracasayuda failure mode this module exists to fix: reports tagged
// "comida"/"agua" that are really trapped-people rescues (HOS-2026-007-07:
// ~78% of imported needs), sometimes pinned in the wrong city entirely.

test("classify: rescue text wins over supply keywords", () => {
  assert.equal(
    needCategoryFromText("URGENTE personas atrapadas, necesitan agua y comida"),
    "rescue",
  );
  assert.equal(needCategoryFromText("Se escuchan personas con vida bajo los escombros"), "rescue");
  // Real source phrasings that an earlier rule-set missed (sampled 2026-07-03).
  assert.equal(needCategoryFromText("hay personas vivas en el edificio Coralmar"), "rescue");
  assert.equal(needCategoryFromText("enviar cuadrilla, están vivos en el piso 2"), "rescue");
  assert.equal(needCategoryFromText("Zona sin atender"), "rescue");
  assert.equal(needCategoryFromText("No ha llegado maquinaria, el edificio está por la mitad"), "rescue");
  assert.equal(needCategoryFromText("una persona dio señales de vida hace 2 dias"), "rescue");
  assert.equal(needCategoryFromText("buscan a las hermanas Ángulo Veltri"), "rescue");
  assert.equal(needCategoryFromText("Necesitamos agua potable para 40 familias"), "water");
  assert.equal(needCategoryFromText("Fórmula y pañales para lactantes"), "formula");
  assert.equal(needCategoryFromText("insulina y oxígeno urgentes"), "medical");
  assert.equal(needCategoryFromText("colchonetas y cobijas"), "shelter");
  assert.equal(needCategoryFromText("sin datos"), "other");
});

test("classify: urgency — rescue is always critical; source 'Urgencia:' prefix honored", () => {
  assert.equal(urgencyFromText("personas atrapadas", "rescue"), "critical");
  assert.equal(urgencyFromText("Urgencia: alta — falta comida", "food"), "critical");
  assert.equal(urgencyFromText("Urgencia: media — falta agua", "water"), "high");
  assert.equal(urgencyFromText("Urgencia: baja — ropa usada", "clothing"), "low");
  assert.equal(urgencyFromText("se necesita jabón", "hygiene"), "normal");
});

test("classify: site categories map from source vocabulary (carga -> internet)", () => {
  assert.equal(siteCategoryFromSource("acopio", ""), "acopio");
  assert.equal(siteCategoryFromSource("donaciones", ""), "acopio");
  assert.equal(siteCategoryFromSource("carga", ""), "internet");
  assert.equal(siteCategoryFromSource("medicamentos", ""), "medico");
  assert.equal(siteCategoryFromSource("mascotas", ""), "mascotas");
  // Not a physical aid point -> not a site.
  assert.equal(siteCategoryFromSource("voluntarios", "grupo de voluntarios"), null);
  // Text rescue when the categoria is unknown.
  assert.equal(siteCategoryFromSource("", "Centro de acopio frente a la plaza"), "acopio");
});

test("classify: district comes from text, accents/case-insensitive, longest name first", () => {
  assert.equal(districtFromText("Reporte en MAIQUETIA cerca del aeropuerto"), "Maiquetía");
  assert.equal(districtFromText("sector Catia La Mar, casa azul"), "Catia La Mar");
  assert.equal(districtFromText("en el 23 de enero, bloque 7"), "23 de Enero");
  assert.equal(districtFromText("sin referencia alguna"), null);
});

test("locate: text district wins; pin kept only when it agrees", () => {
  // Pin agrees with the text district (both Maiquetía) -> exact pin kept.
  const agree = locateNeed("derrumbe en Maiquetía", { lat: 10.6, lng: -66.975 });
  assert.equal(agree?.district, "Maiquetía");
  assert.equal(agree?.lat, 10.6);

  // Porlamar-style mis-pin: text says Maiquetía, pin is 300 km away -> pin dropped.
  const conflict = locateNeed("derrumbe en Maiquetía", { lat: 10.95, lng: -63.85 });
  assert.equal(conflict?.district, "Maiquetía");
  assert.equal(conflict?.lat, null);

  // No text district, pin inside the corridor -> nearest centroid + pin kept.
  const pinOnly = locateNeed("familia sin techo", { lat: 10.6, lng: -66.93 });
  assert.equal(pinOnly?.district, "La Guaira");
  assert.equal(pinOnly?.lat, 10.6);

  // No text district, pin outside the corridor -> out of scope for this board.
  assert.equal(locateNeed("familia sin techo", { lat: 10.95, lng: -63.85 }), null);
  assert.equal(locateNeed("familia sin techo", null), null);
});
