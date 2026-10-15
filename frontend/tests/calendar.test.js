import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL, fileURLToPath } from "node:url";
import { combinarFechaHora, generarLinkGoogleCalendar } from "../src/utils/calendar.js";

const parametros = (link) => new URL(link).searchParams;
const turno = (fecha, hora, duracion) => generarLinkGoogleCalendar("Turno", "Detalle", combinarFechaHora(fecha, hora), duracion);

describe("combinarFechaHora", () => {
  test("arma la fecha en hora local, sin correrse de día (new Date('YYYY-MM-DD') la interpretaría como UTC)", () => {
    const d = combinarFechaHora("2026-03-14", "15:30:00");
    assert.deepEqual(
      [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()],
      [2026, 2, 14, 15, 30],
    );
  });

  test("acepta la hora con y sin segundos", () => {
    assert.equal(combinarFechaHora("2026-03-14", "09:05").getHours(), 9);
    assert.equal(combinarFechaHora("2026-03-14", "09:05:00").getMinutes(), 5);
  });
});

describe("generarLinkGoogleCalendar: contenido del link", () => {
  test("apunta a Google Calendar con el evento y el huso horario de Argentina", () => {
    const link = turno("2026-03-14", "15:30");
    assert.ok(link.startsWith("https://calendar.google.com/calendar/render?"));
    const p = parametros(link);
    assert.equal(p.get("action"), "TEMPLATE");
    assert.equal(p.get("text"), "Turno");
    assert.equal(p.get("details"), "Detalle");
    assert.equal(p.get("ctz"), "America/Argentina/Buenos_Aires");
  });

  test("usa la hora de pared (no UTC): 15:30 queda 15:30", () => {
    assert.equal(parametros(turno("2026-03-14", "15:30")).get("dates"), "20260314T153000/20260314T163000");
  });

  test("la duración se suma al horario de inicio", () => {
    assert.equal(parametros(turno("2026-03-14", "15:30", 1.5)).get("dates"), "20260314T153000/20260314T170000");
    assert.equal(parametros(turno("2026-03-14", "15:30", 0.5)).get("dates"), "20260314T153000/20260314T160000");
  });

  test("un turno que cruza la medianoche termina al día siguiente", () => {
    assert.equal(parametros(turno("2026-12-31", "23:30")).get("dates"), "20261231T233000/20270101T003000");
  });
});

describe("generarLinkGoogleCalendar: casos borde", () => {
  test("escapa los caracteres especiales del título y los detalles", () => {
    const link = generarLinkGoogleCalendar("Turno & más", "a=b&c=d", combinarFechaHora("2026-03-14", "10:00"));
    const p = parametros(link);
    assert.equal(p.get("text"), "Turno & más");
    assert.equal(p.get("details"), "a=b&c=d");
    assert.equal(p.get("c"), null);
  });

  test("devuelve null si la fecha no es válida, para no romper un render", () => {
    assert.equal(generarLinkGoogleCalendar("t", "d", new Date("no es fecha")), null);
    assert.equal(generarLinkGoogleCalendar("t", "d", "2026-03-14"), null);
    assert.equal(generarLinkGoogleCalendar("t", "d", undefined), null);
  });

  test("da el mismo resultado sin importar la zona horaria del navegador", () => {
    const modulo = pathToFileURL(fileURLToPath(new URL("../src/utils/calendar.js", import.meta.url))).href;
    const codigo = `import { combinarFechaHora, generarLinkGoogleCalendar } from ${JSON.stringify(modulo)};
      process.stdout.write(generarLinkGoogleCalendar("T", "D", combinarFechaHora("2026-03-14", "15:30")));`;
    const salidas = ["UTC", "Asia/Tokyo", "America/Los_Angeles", "America/Argentina/Buenos_Aires"].map((TZ) =>
      execFileSync(process.execPath, ["--input-type=module", "-e", codigo], { env: { ...process.env, TZ }, encoding: "utf8" }),
    );
    salidas.forEach((salida) => assert.equal(salida, salidas[0]));
  });
});
