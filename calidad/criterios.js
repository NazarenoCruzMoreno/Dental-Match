const { UMBRALES: U, CAPAS } = require("./config");

const hallazgo = (h) => `${h.rel}:${h.linea}  ${h.texto}`;
const funcion = (f) => `${f.rel}:${f.linea}  ${f.nombre}  [CC ${f.cc} · ${f.lineas} líneas · ${f.params} parám.]`;
const masComplejas = (lista) => [...lista].sort((a, b) => b.cc - a.cc);
const masLargas = (lista) => [...lista].sort((a, b) => b.lineas - a.lineas);

function criterio(id, clave, titulo, ok, valor, meta, items = [], mejora = "", aviso = "") {
  return { id, clave, titulo, ok, valor, meta, items, mejora, aviso };
}

function indice(m) {
  const { porTipo, porOcurrencia } = m.indice;
  const ok = porTipo >= U.indice && porOcurrencia >= U.indice;
  return criterio("1", "ÍNDICE", "Puntaje global", ok, `${porOcurrencia}–${porTipo} (estimado)`, `≥ ${U.indice}`, [],
    "Bajar duplicación y señales pesadas (secretos, SQL, capas, componentes grandes).");
}

function duplicacion(m) {
  const { identica, similar } = m.duplicacion;
  const ok = similar.pct <= U.duplicacionPct;
  const items = similar.ranking.slice(0, 15).map((r) => `${r.rel}  ${r.lineas} líneas similares (${r.pct}% del archivo)`);
  const aviso = ok && similar.pct > 10 ? `Cerca del límite: la lectura "similar" marca ${similar.pct}% (tope ${U.duplicacionPct}%).` : "";
  return criterio("2", "DUPLICACIÓN", "Líneas en bloques repetidos", ok, `${identica.pct}% idéntica · ${similar.pct}% similar`, `≤ ${U.duplicacionPct}%`, items,
    "Extraer helpers, utilidades o componentes reutilizables.", aviso);
}

function secretos(m) {
  const dudosos = m.secretos.filter((s) => s.dudoso).length;
  const valor = m.secretos.length ? `${m.secretos.length}${dudosos ? ` (${dudosos} dudoso${dudosos > 1 ? "s" : ""}: parecen mensajes)` : ""}` : "0";
  const items = m.secretos.map((s) => `${hallazgo(s)}${s.dudoso ? "   (¿falso positivo?)" : ""}`);
  return criterio("3", "SEC", "Credenciales en el código", m.secretos.length === 0, valor, "0", items,
    "Variables de entorno (.env fuera del repo) y rotar las claves expuestas.");
}

const sql = (m) => criterio("4", "SQL", "SQL por concatenación", m.sql.length === 0, String(m.sql.length), "0", m.sql.map(hallazgo), "Consultas parametrizadas u ORM.");

function capas(m) {
  const faltantes = m.capas.flatMap((c) => c.capas.filter((x) => !x.presente).map((x) => `${c.parte}: falta la capa de ${x.nombre} (carpetas: ${CAPAS[c.parte][x.nombre].join("/")})`));
  const incumplen = m.capas.filter((c) => c.loc >= U.capasMinLoc && c.cantidad < U.capasMin);
  const detalle = m.capas.map((c) => `${c.parte} ${c.cantidad}/${c.capas.length}`);
  const aviso = incumplen.length === 0 && faltantes.length ? `Cumple por nombres de carpeta, pero ${faltantes.join("; ")}.` : "";
  return criterio("5", "CAPAS", "Separación en capas", incumplen.length === 0, detalle.join(" · "), `≥ ${U.capasMin} capas`, faltantes,
    "Backend: routes + services + models. Frontend: components + services + store|hooks.", aviso);
}

const http = (m) => criterio("6", "HTTP", "fetch/axios en componentes", m.http.length === 0, String(m.http.length), "0", m.http.map(hallazgo), "Mover las llamadas a una capa de servicios.");

function depuracion(m) {
  const porArchivo = {};
  m.depuracion.forEach((d) => { porArchivo[d.rel] = (porArchivo[d.rel] || 0) + 1; });
  const items = Object.entries(porArchivo).sort((a, b) => b[1] - a[1]).map(([rel, n]) => `${rel}  ${n} salida(s)`);
  return criterio("7", "DBG", "console.log / debugger olvidados", m.depuracion.length === 0, String(m.depuracion.length), "0", items,
    "Borrarlas o usar un logger (console.error y console.warn no cuentan).");
}

function usoDeAny(m) {
  const sinTs = m.archivos === 0 || !m.any.length;
  const total = m.any.reduce((suma, a) => suma + a.usos, 0);
  return criterio("8", "ANY", "Tipado débil (any)", total <= U.anyMax, sinTs ? "0 (sin TypeScript o sin usos)" : String(total), `≤ ${U.anyMax}`,
    m.any.map((a) => `${a.rel}  ${a.usos} usos`), "Definir interface/type y activar strict.");
}

function componentesGrandes(m) {
  const items = m.grandes.slice(0, 20).map((g) => `${g.rel}  ${g.lineas} líneas`);
  return criterio("9", "BigC", `Componentes ≥ ${U.componenteLineas} líneas`, m.grandes.length <= U.componentesGrandesMax, String(m.grandes.length), `≤ ${U.componentesGrandesMax}`, items,
    "Dividir en componentes más chicos y extraer hooks.");
}

function cohesion(m) {
  const items = m.clases.pocoCohesivas.map((c) => `${c.rel}:${c.linea}  ${c.nombre}  (cohesión ${c.cohesionPct}%)`);
  return criterio("10", "Coh", "Clases poco cohesivas", m.clases.pocoCohesivas.length === 0, `${m.clases.pocoCohesivas.length} de ${m.clases.total} clases`, "0", items,
    "Una clase = una responsabilidad.");
}

function complejidad(m) {
  const items = masComplejas(m.funciones.complejas).slice(0, 20).map(funcion);
  return criterio("11", "Compl", `Funciones con CC ≥ ${U.complejidadMin}`, m.por1000.complejidad <= U.complejidadPor1000,
    `${m.funciones.complejas.length} funciones (${m.por1000.complejidad} cada 1000 LOC)`, `≤ ${U.complejidadPor1000} cada 1000 LOC`, items,
    "Early returns, extraer funciones, tablas de variantes en vez de if encadenados.");
}

function tamano(m) {
  const items = [...masLargas(m.funciones.largas).slice(0, 15), ...m.funciones.conMuchosParametros].map(funcion);
  const cantidad = m.funciones.largas.length + m.funciones.conMuchosParametros.length;
  return criterio("12", "Tam", `Funciones ≥ ${U.funcionLineas} líneas o > ${U.parametrosMax} parámetros`, m.por1000.tamano <= U.tamanoPor1000,
    `${cantidad} funciones (${m.por1000.tamano} cada 1000 LOC)`, `≤ ${U.tamanoPor1000} cada 1000 LOC`, items,
    "Extraer funciones y agrupar parámetros en objetos.");
}

function acoplamiento(m) {
  const items = m.clases.muyAcopladas.map((c) => `${c.rel}:${c.linea}  ${c.nombre}  (CBO ${c.cbo})`);
  return criterio("13", "Acop", `Clases con CBO ≥ ${U.cboMin}`, m.por1000.acoplamiento <= U.acoplamientoPor1000,
    `${m.clases.muyAcopladas.length} clases (${m.por1000.acoplamiento} cada 1000 LOC)`, `≤ ${U.acoplamientoPor1000} cada 1000 LOC`, items,
    "Inyectar dependencias y depender de interfaces.");
}

function tests(m) {
  return criterio("14", "TESTS", "Archivos de test", m.tests.length >= U.tests, String(m.tests.length), `≥ ${U.tests}`, m.tests.map((t) => t.rel),
    "Agregar tests en tests/ o como *.test.js (ej. node:test, vitest).");
}

function endpoints(m) {
  return criterio("15a", "EP", "Endpoints HTTP (backend)", m.endpoints.length >= U.endpoints, String(m.endpoints.length), `≥ ${U.endpoints}`, [], "Implementar rutas reales.");
}

function vistas(m) {
  return criterio("15b", "VISTAS", "Componentes/pantallas (frontend)", m.vistas.length >= U.vistas, String(m.vistas.length), `≥ ${U.vistas}`, [], "Agregar vistas o componentes de pantalla.");
}

const evaluar = (m) => [indice, duplicacion, secretos, sql, capas, http, depuracion, usoDeAny, componentesGrandes, cohesion, complejidad, tamano, acoplamiento, tests, endpoints, vistas]
  .map((regla) => regla(m));

module.exports = { evaluar };
