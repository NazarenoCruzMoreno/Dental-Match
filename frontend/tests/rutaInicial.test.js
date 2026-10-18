import { test } from "node:test";
import assert from "node:assert/strict";
import { rutaInicial } from "../src/utils/rutaInicial.js";

test("el admin entra por su panel", () => {
  assert.equal(rutaInicial({ role: "admin" }), "/admin");
});

test("estudiantes y pacientes entran por el home", () => {
  assert.equal(rutaInicial({ role: "estudiante" }), "/home");
  assert.equal(rutaInicial({ role: "paciente" }), "/home");
});

test("sin usuario cae en el home (los guards se ocupan del resto)", () => {
  assert.equal(rutaInicial(null), "/home");
  assert.equal(rutaInicial(undefined), "/home");
});
