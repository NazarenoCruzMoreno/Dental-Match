const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { EXTENSIONES_CODIGO, EXTENSIONES_COMPONENTE, EXCLUIR } = require("./config");

const MAX_BYTES = 1024 * 1024;
const ES_TEST = /(^|\/)(tests?|__tests__)\/|\.(test|spec)\.[jt]sx?$/;

// Líneas con contenido real: sin vacías ni comentarios puros
function lineasDeCodigo(texto) {
  let enBloque = false;
  let total = 0;
  for (const cruda of texto.split(/\r?\n/)) {
    let linea = cruda.trim();
    if (enBloque) {
      if (!linea.includes("*/")) continue;
      enBloque = false;
      linea = linea.slice(linea.indexOf("*/") + 2).trim();
    }
    if (!linea || linea.startsWith("//")) continue;
    if (linea.startsWith("/*")) { enBloque = !linea.includes("*/"); continue; }
    total++;
  }
  return total;
}

const parteDe = (rel) => (rel.startsWith("backend/") ? "backend" : rel.startsWith("frontend/") ? "frontend" : "otro");

function describir(raiz, rel) {
  const texto = fs.readFileSync(path.join(raiz, rel), "utf8");
  return {
    rel,
    texto,
    parte: parteDe(rel),
    esTest: ES_TEST.test(rel),
    esComponente: EXTENSIONES_COMPONENTE.test(rel),
    lineas: (texto.match(/\n/g) || []).length,
    loc: lineasDeCodigo(texto),
  };
}

const esCodigoAnalizable = (raiz, rel) =>
  EXTENSIONES_CODIGO.test(rel) &&
  !EXCLUIR.some((carpeta) => rel.startsWith(carpeta) || rel.includes(`/${carpeta}`)) &&
  fs.existsSync(path.join(raiz, rel)) &&
  fs.statSync(path.join(raiz, rel)).size <= MAX_BYTES;

// Archivos de código del repo: versionados + nuevos sin ignorar (así cuentan antes de commitear)
function listarArchivos(raiz) {
  const salida = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: raiz, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const rutas = [...new Set(salida.split("\n").filter(Boolean))];
  return rutas.filter((rel) => esCodigoAnalizable(raiz, rel)).map((rel) => describir(raiz, rel));
}

module.exports = { listarArchivos, lineasDeCodigo };
