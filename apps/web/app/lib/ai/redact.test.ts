import { test } from "node:test";
import assert from "node:assert/strict";

import { scrubFreeText } from "./redact.ts";

test("scrubs phone, email, and social handle from free text", () => {
  const out = scrubFreeText("Llamar a +58 412-555-1942 o correo ana@x.com, IG @ana_lopez");
  assert.ok(!/\d{4}/.test(out), "phone digits removed");
  assert.ok(!out.includes("ana@x.com"), "email removed");
  assert.ok(!out.includes("@ana_lopez"), "handle removed");
});

test("leaves an ordinary description intact", () => {
  const text = "Camisa azul, cicatriz en el brazo izquierdo";
  assert.equal(scrubFreeText(text), text);
});

test("passes through empty and undefined", () => {
  assert.equal(scrubFreeText(""), "");
  assert.equal(scrubFreeText(undefined), undefined);
});
