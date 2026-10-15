const { UMBRALES } = require("./config");

const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const pintar = (codigo, texto) => (COLOR ? `\x1b[${codigo}m${texto}\x1b[0m` : texto);
const verde = (t) => pintar("32", t);
const rojo = (t) => pintar("31", t);
const tenue = (t) => pintar("2", t);
const negrita = (t) => pintar("1", t);

// El criterio 15 (endpoints / vistas) cuenta como uno solo
function resumen(criterios) {
  const grupos = new Map();
  criterios.forEach((c) => {
    const clave = parseInt(c.id, 10);
    grupos.set(clave, (grupos.get(clave) ?? true) && c.ok);
  });
  const cumplidos = [...grupos.values()].filter(Boolean).length;
  return { cumplidos, total: grupos.size, aprobado: cumplidos === grupos.size };
}

const relleno = (texto, ancho) => String(texto).padEnd(ancho);

function lineaSemaforo(c) {
  const estado = c.ok ? verde("[OK]") : rojo("[NO]");
  return ` ${estado}  ${relleno(c.id, 3)} ${relleno(c.clave, 12)} ${relleno(c.valor, 46)} ${tenue(`meta ${c.meta}`)}`;
}

function bloqueDeMejora(c, limite) {
  const lineas = [`\n ${negrita(`${c.id} · ${c.clave}`)} — ${c.titulo}`, `   ${tenue("→ " + c.mejora)}`];
  c.items.slice(0, limite).forEach((item) => lineas.push(`   ${item}`));
  if (c.items.length > limite) lineas.push(`   ${tenue(`… y ${c.items.length - limite} más (usá --detalle)`)}`);
  return lineas.join("\n");
}

function textoIndice({ porTipo, porOcurrencia }) {
  return `Índice estimado: ${negrita(`${porOcurrencia} a ${porTipo}`)} sobre 100 (meta ≥ ${UMBRALES.indice}). ` +
    tenue("El rango depende de cómo cuenta las señales la herramienta oficial: una vez por tipo, o por cada ocurrencia.");
}

function bloqueDeAvisos(criterios) {
  const avisos = criterios.filter((c) => c.ok && c.aviso);
  if (!avisos.length) return "";
  const titulo = `\n${negrita("AVISOS")} ${tenue("(cumplen, pero conviene mirar)")}`;
  return [titulo, ...avisos.map((c) => `   ${c.id} · ${c.clave}: ${c.aviso}`)].join("\n");
}

function armarReporte(medicion, criterios, { detalle }) {
  const r = resumen(criterios);
  const fallan = criterios.filter((c) => !c.ok);
  const limite = detalle ? 20 : 5;
  const veredicto = r.aprobado ? verde("SÍ") : rojo("NO (hay que cumplir todos)");
  return [
    negrita("\nCALIDAD · análisis heurístico (no compila ni ejecuta el código)"),
    tenue(`Archivos: ${medicion.archivos} · líneas de código: ${medicion.loc} · funciones: ${medicion.funciones.total}\n`),
    ...criterios.map(lineaSemaforo),
    `\n Cumple ${negrita(`${r.cumplidos}/${r.total}`)}  ·  Aprobado: ${veredicto}`,
    ` ${textoIndice(medicion.indice)}`,
    fallan.length ? `\n${negrita("QUÉ MEJORAR")} ${tenue("(criterios que fallan)")}` : `\n${verde("Todos los criterios se cumplen.")}`,
    ...fallan.map((c) => bloqueDeMejora(c, limite)),
    bloqueDeAvisos(criterios),
    "",
  ].join("\n");
}

const aJson = (medicion, criterios) =>
  JSON.stringify({ resumen: resumen(criterios), indice: medicion.indice, archivos: medicion.archivos, loc: medicion.loc, criterios: criterios.map(({ mejora, ...c }) => c) }, null, 2);

module.exports = { armarReporte, aJson, resumen };
