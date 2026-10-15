const { UMBRALES, CAPAS } = require("./config");

const COMENTARIO = /^\s*(\/\/|\*|\/\*)/;
const SECRETO = /(password|passwd|pwd|secret|api[_-]?key|token|private[_-]?key)["']?\s*[:=]\s*["'`][^"'`$]{4,}["'`]/i;
const CLAVE_REAL = /ghp_[A-Za-z0-9]{20,}|sk_live_|AIza[0-9A-Za-z_-]{20,}|AKIA[0-9A-Z]{12,}|BEGIN (RSA |EC )?PRIVATE KEY/;
const DESDE_ENTORNO = /process\.env|os\.environ|getenv|\$\{/;
const SQL = /["'`][^"'`]*\b(select\s+.+\s+from|insert\s+into|update\s+\w+\s+set|delete\s+from)\b[^"'`]*(\$\{|["'`]\s*\+)/i;
const DEPURACION = /console\.(log|debug|info)\(|\bdebugger;|\bprint\(|pprint\(|pdb\.set_trace|binding\.pry|System\.out\.print/;
const HTTP = /\bfetch\(|\baxios(\.|\()/;
const ENDPOINT = /\b(router|app)\.(get|post|put|patch|delete)\(/;
const ANY = /:\s*any\b|\bas any\b|<any>/g;

// Una entrada por línea que cumple el patrón (se ignoran comentarios y, por defecto, los tests)
function buscar(archivos, regex, { incluirTests = false } = {}) {
  const hallazgos = [];
  for (const archivo of archivos) {
    if (archivo.esTest && !incluirTests) continue;
    archivo.texto.split(/\r?\n/).forEach((linea, i) => {
      if (COMENTARIO.test(linea) || !regex.test(linea)) return;
      hallazgos.push({ rel: archivo.rel, linea: i + 1, texto: linea.trim().slice(0, 100) });
    });
  }
  return hallazgos;
}

// Un valor con espacios suele ser un mensaje ("Las contraseñas no coinciden"), no una credencial
const pareceMensaje = (texto) => /\s/.test((texto.match(/["'`]([^"'`$]{4,})["'`]/) || [])[1] || "");

function secretos(archivos) {
  const asignaciones = buscar(archivos, SECRETO).filter((h) => !DESDE_ENTORNO.test(h.texto));
  const claves = buscar(archivos, CLAVE_REAL);
  return [...claves, ...asignaciones].map((h) => ({ ...h, dudoso: pareceMensaje(h.texto) && !CLAVE_REAL.test(h.texto) }));
}

const sqlConcatenado = (archivos) => buscar(archivos.filter((a) => a.parte === "backend"), SQL);
const depuracion = (archivos) => buscar(archivos, DEPURACION);
const httpEnComponentes = (archivos) => buscar(archivos.filter((a) => a.esComponente), HTTP);

function endpoints(archivos) {
  return buscar(archivos.filter((a) => a.parte === "backend"), ENDPOINT);
}

function anyTypes(archivos) {
  return archivos
    .filter((a) => /\.tsx?$/.test(a.rel) && !a.esTest)
    .map((a) => ({ rel: a.rel, usos: (a.texto.match(ANY) || []).length }))
    .filter((a) => a.usos >= UMBRALES.anyPorArchivo);
}

function componentesGrandes(archivos) {
  return archivos
    .filter((a) => a.esComponente && a.lineas >= UMBRALES.componenteLineas)
    .map((a) => ({ rel: a.rel, lineas: a.lineas }))
    .sort((a, b) => b.lineas - a.lineas);
}

const vistas = (archivos) => archivos.filter((a) => a.esComponente && !a.esTest);
const tests = (archivos) => archivos.filter((a) => a.esTest);

// Capas reconocidas por nombre de carpeta. Se evalúa cada parte (backend/frontend) con su propio código.
function capasDe(archivos, parte) {
  const propios = archivos.filter((a) => a.parte === parte && !a.esTest);
  const carpetas = new Set(propios.flatMap((a) => a.rel.split("/").slice(0, -1)));
  const capas = Object.entries(CAPAS[parte]).map(([nombre, nombres]) => ({ nombre, presente: nombres.some((n) => carpetas.has(n)) }));
  const loc = propios.reduce((suma, a) => suma + a.loc, 0);
  return { parte, loc, capas, cantidad: capas.filter((c) => c.presente).length };
}

const capas = (archivos) => ["backend", "frontend"].map((parte) => capasDe(archivos, parte)).filter((c) => c.loc > 0);

module.exports = { secretos, sqlConcatenado, depuracion, httpEnComponentes, endpoints, anyTypes, componentesGrandes, vistas, tests, capas };
