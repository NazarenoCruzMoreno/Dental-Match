const { UMBRALES } = require("./config");

const PALABRAS_CLAVE = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while", "await", "async", "try", "catch", "throw",
  "new", "import", "from", "export", "default", "true", "false", "null", "undefined", "switch", "case", "break", "continue", "of", "in", "typeof",
]);

// "Similar": ignora nombres y literales, para detectar bloques que hacen lo mismo con otros nombres
function normalizar(linea) {
  return linea
    .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g, "S")
    .replace(/\b\d+(?:\.\d+)?\b/g, "N")
    .replace(/[A-Za-z_$][\w$]*/g, (palabra) => (PALABRAS_CLAVE.has(palabra) ? palabra : "I"));
}

function lineasSignificativas(texto, normalizada) {
  let enBloque = false;
  const lineas = [];
  for (const cruda of texto.split(/\r?\n/)) {
    let linea = cruda.trim().replace(/\s+/g, " ");
    if (enBloque) {
      if (!linea.includes("*/")) continue;
      enBloque = false;
      linea = linea.slice(linea.indexOf("*/") + 2).trim();
    }
    if (!linea || linea.startsWith("//")) continue;
    if (linea.startsWith("/*")) { enBloque = !linea.includes("*/"); continue; }
    lineas.push(normalizada ? normalizar(linea) : linea);
  }
  return lineas;
}

// Descarta ventanas hechas casi solo de llaves y paréntesis
const esVentanaUtil = (ventana) => ventana.filter((l) => l.length >= 6).length >= Math.ceil(ventana.length * 0.6);

function indexarVentanas(fuentes, ventana) {
  const indice = new Map();
  fuentes.forEach((f, fi) => {
    for (let i = 0; i + ventana <= f.lineas.length; i++) {
      const bloque = f.lineas.slice(i, i + ventana);
      if (!esVentanaUtil(bloque)) continue;
      const clave = bloque.join("\n");
      if (!indice.has(clave)) indice.set(clave, []);
      indice.get(clave).push([fi, i]);
    }
  });
  return indice;
}

// Una ventana cuenta como repetida si aparece en otro lugar (en otro archivo o lejos en el mismo)
const repetidas = (posiciones, ventana) =>
  posiciones.filter(([fi, i], k) => posiciones.some(([fj, j], m) => m !== k && (fi !== fj || Math.abs(i - j) >= ventana)));

function medir(archivos, { ventana = UMBRALES.ventanaDuplicacion, normalizada = false } = {}) {
  const fuentes = archivos.map((a) => ({ rel: a.rel, lineas: lineasSignificativas(a.texto, normalizada) }));
  const total = fuentes.reduce((suma, f) => suma + f.lineas.length, 0);
  const marcadas = new Set();
  for (const posiciones of indexarVentanas(fuentes, ventana).values()) {
    const iguales = repetidas(posiciones, ventana);
    if (iguales.length < 2) continue;
    iguales.forEach(([fi, i]) => { for (let k = 0; k < ventana; k++) marcadas.add(`${fi}:${i + k}`); });
  }
  const porArchivo = new Map();
  marcadas.forEach((m) => { const rel = fuentes[+m.split(":")[0]].rel; porArchivo.set(rel, (porArchivo.get(rel) || 0) + 1); });
  const pct = total ? (marcadas.size / total) * 100 : 0;
  const lineasDe = (rel) => fuentes.find((f) => f.rel === rel).lineas.length;
  const ranking = [...porArchivo].map(([rel, n]) => ({ rel, lineas: n, pct: Math.round((n / lineasDe(rel)) * 100) }));
  return { pct: +pct.toFixed(1), ranking: ranking.sort((a, b) => b.lineas - a.lineas) };
}

module.exports = { medir };
