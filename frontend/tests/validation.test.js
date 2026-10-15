import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateEmail, validatePassword, validateName, validateForm } from "../src/utils/validation.js";

describe("validateEmail", () => {
  test("acepta emails con formato válido", () => {
    for (const email of ["a@b.com", "pablo.sanchez@test.com.ar", "x+tag@dominio.io"]) {
      assert.deepEqual(validateEmail(email), { valid: true, error: "" }, email);
    }
  });

  test("pide el email cuando falta o son solo espacios", () => {
    for (const vacio of ["", "   ", undefined, null]) {
      assert.deepEqual(validateEmail(vacio), { valid: false, error: "El email es requerido" }, String(vacio));
    }
  });

  test("rechaza formatos inválidos", () => {
    for (const email of ["sin-arroba", "a@b", "a b@c.com", "@dominio.com", "a@.com "]) {
      assert.equal(validateEmail(email).valid, false, email);
      assert.equal(validateEmail(email).error, "Email inválido", email);
    }
  });
});

describe("validatePassword", () => {
  test("exige al menos 6 caracteres", () => {
    assert.deepEqual(validatePassword("123456"), { valid: true, error: "" });
    assert.deepEqual(validatePassword("12345"), { valid: false, error: "Mínimo 6 caracteres" });
  });

  test("pide la contraseña cuando falta", () => {
    assert.deepEqual(validatePassword(""), { valid: false, error: "La contraseña es requerida" });
    assert.deepEqual(validatePassword(undefined), { valid: false, error: "La contraseña es requerida" });
  });
});

describe("validateName", () => {
  test("acepta nombres de 2 o más caracteres e ignora espacios de los costados", () => {
    assert.equal(validateName("Lu").valid, true);
    assert.equal(validateName("  Lucía  ").valid, true);
  });

  test("rechaza vacíos y nombres de una letra", () => {
    assert.deepEqual(validateName("  "), { valid: false, error: "El nombre es requerido" });
    assert.deepEqual(validateName(" a "), { valid: false, error: "Mínimo 2 caracteres" });
  });
});

describe("validateForm", () => {
  test("un formulario correcto es válido y no tiene errores", () => {
    const r = validateForm({ name: "Lucía", email: "lucia@test.com", password: "123456" });
    assert.deepEqual(r, { isValid: true, errors: {} });
  });

  test("junta los errores de cada campo inválido", () => {
    const r = validateForm({ name: "a", email: "mal", password: "1" });
    assert.equal(r.isValid, false);
    assert.deepEqual(r.errors, { name: "Mínimo 2 caracteres", email: "Email inválido", password: "Mínimo 6 caracteres" });
  });

  test("solo valida los campos que se le pasan", () => {
    const r = validateForm({ email: "mal" });
    assert.deepEqual(Object.keys(r.errors), ["email"]);
  });
});
