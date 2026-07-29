import { test } from "node:test";
import assert from "node:assert/strict";

import {
  INTAKE_NUDGE,
  detectIntakePii,
  hasIntakePii,
  intakePiiCaution,
} from "./intakeMinimization.ts";

test("clean structured text is not flagged", () => {
  assert.deepEqual(detectIntakePii(""), []);
  assert.deepEqual(detectIntakePii("   "), []);
  assert.deepEqual(detectIntakePii("Se necesitan 40 litros de agua en Maiquetía"), []);
  assert.deepEqual(detectIntakePii("Refugio con 20 camas, urgente"), []);
});

test("quantities and large numbers do not false-positive as PII", () => {
  // The exact failure mode we must avoid: a donation of 2 million bolivars, a
  // 500-litre delivery, an amount range — none of these are identifiers.
  assert.equal(hasIntakePii("Tenemos 2.000.000 en insumos"), false);
  assert.equal(hasIntakePii("500 litros para 300 personas"), false);
  assert.equal(hasIntakePii("entre 1000 y 2000 unidades"), false);
});

test("Venezuelan mobile numbers are flagged as phone", () => {
  for (const s of [
    "llamar al 0414-1234567",
    "contacto 04241234567",
    "wsp 0412 123 4567",
    "tel: +58 414 1234567",
  ]) {
    const flags = detectIntakePii(s);
    assert.ok(
      flags.some((f) => f.kind === "phone"),
      `expected a phone flag in: ${s}`,
    );
  }
});

test("Caracas landline is flagged", () => {
  assert.ok(detectIntakePii("0212-5551234").some((f) => f.kind === "phone"));
});

test("cedula forms are flagged as id", () => {
  for (const s of ["V-12345678", "V12.345.678", "cédula 12345678", "CI: E-9876543"]) {
    const flags = detectIntakePii(s);
    assert.ok(flags.some((f) => f.kind === "id"), `expected an id flag in: ${s}`);
  }
});

test("email is flagged", () => {
  assert.ok(detectIntakePii("escriba a ana.perez@correo.com").some((f) => f.kind === "email"));
});

test("multiple identifiers each produce one flag, deduped by kind", () => {
  const flags = detectIntakePii("Maria, tel 0414-1234567, otro 0424-7654321, ci 12345678");
  const kinds = flags.map((f) => f.kind);
  assert.equal(kinds.filter((k) => k === "phone").length, 1);
  assert.equal(kinds.filter((k) => k === "id").length, 1);
});

test("caution line reads naturally for one and many flags", () => {
  assert.equal(intakePiiCaution([]), "");
  const one = intakePiiCaution(detectIntakePii("0414-1234567"));
  assert.match(one, /un teléfono/);
  assert.match(one, /no hace falta/);
  const many = intakePiiCaution(detectIntakePii("0414-1234567 y la cédula V-12345678"));
  assert.match(many, /un teléfono y una cédula/);
});

test("standing nudge names the three things not to write", () => {
  assert.match(INTAKE_NUDGE, /nombres/);
  assert.match(INTAKE_NUDGE, /tel[eé]fonos/);
  assert.match(INTAKE_NUDGE, /direcciones/);
});
