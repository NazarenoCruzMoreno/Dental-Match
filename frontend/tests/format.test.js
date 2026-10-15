import { test, describe, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { timeAgo, inferSintomas } from "../src/utils/format.js";

const AHORA = new Date("2026-10-14T12:00:00Z").getTime();
const haceDias = (n) => new Date(AHORA - n * 86400000 - 3600000); // -1 h para no caer justo en el límite

describe("timeAgo", () => {
  beforeEach(() => mock.method(Date, "now", () => AHORA));
  afterEach(() => mock.restoreAll());

  test('hoy -> "Hoy"', () => {
    assert.equal(timeAgo(new Date(AHORA - 3600000)), "Hoy");
  });

  test('ayer -> "Ayer"', () => {
    assert.equal(timeAgo(haceDias(1)), "Ayer");
  });

  test("entre 2 y 6 días -> Hace N días", () => {
    assert.equal(timeAgo(haceDias(2)), "Hace 2 días");
    assert.equal(timeAgo(haceDias(6)), "Hace 6 días");
  });

  test("desde 7 días muestra la fecha (día y mes)", () => {
    // El separador (espacio o guion) depende de los datos de idioma del sistema: "07 oct" o "07-oct"
    const formatoFecha = /^\d{2}[ -]\p{L}+\.?$/u;
    assert.match(timeAgo(haceDias(7)), formatoFecha);
    assert.match(timeAgo(haceDias(40)), formatoFecha);
  });

  test("acepta también strings ISO, como los que devuelve la API", () => {
    assert.equal(timeAgo("2026-10-14T10:00:00Z"), "Hoy");
  });
});

describe("inferSintomas", () => {
  test("detecta síntomas a partir de palabras clave, sin importar mayúsculas", () => {
    assert.deepEqual(inferSintomas("DOLOR fuerte y sangrado"), ["Dolor", "Sangrado"]);
  });

  test("reconoce raíces de palabra (inflamada -> Inflamación)", () => {
    assert.deepEqual(inferSintomas("la encía está inflamada"), ["Inflamación", "Encías"]);
  });

  test("devuelve como máximo 4 síntomas", () => {
    const todos = "dolor inflamación sangrado sensibilidad caries ortodoncia muela encía";
    assert.equal(inferSintomas(todos).length, 4);
  });

  test("sin texto o sin coincidencias devuelve una lista vacía", () => {
    assert.deepEqual(inferSintomas(), []);
    assert.deepEqual(inferSintomas("consulta de rutina"), []);
  });
});
