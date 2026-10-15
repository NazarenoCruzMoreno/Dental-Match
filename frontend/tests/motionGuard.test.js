import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { fpsDeFrames } from "../src/components/AuroraBackground/useMotionGuard.js";

// Timestamps de requestAnimationFrame simulados a una frecuencia dada
const marcas = (hz, ms = 1200) => {
  const paso = 1000 / hz;
  const lista = [];
  for (let t = 0; t <= ms; t += paso) lista.push(1000 + t);
  return lista;
};

// El detector apaga las animaciones decorativas por debajo de 20 fps
describe("fpsDeFrames", () => {
  test("calcula los cuadros por segundo a partir de los timestamps", () => {
    assert.ok(Math.abs(fpsDeFrames(marcas(60)) - 60) < 0.5);
    assert.ok(Math.abs(fpsDeFrames(marcas(30)) - 30) < 0.5);
    assert.ok(Math.abs(fpsDeFrames(marcas(10)) - 10) < 0.5);
  });

  test("distingue un navegador fluido (60 fps) de uno limitado (~2.5 fps, como la vista previa embebida)", () => {
    assert.ok(fpsDeFrames(marcas(60)) >= 20);
    assert.ok(fpsDeFrames(marcas(2.5)) < 20);
  });

  test("con menos de 2 cuadros no puede medir y devuelve 0", () => {
    assert.equal(fpsDeFrames([]), 0);
    assert.equal(fpsDeFrames([1234]), 0);
  });

  test("un tirón aislado no alcanza para bajar el promedio de un navegador sano", () => {
    const sano = marcas(60);
    const conTiron = [...sano.slice(0, 30), ...sano.slice(30).map((t) => t + 150)];
    assert.ok(fpsDeFrames(conTiron) >= 20);
  });
});
