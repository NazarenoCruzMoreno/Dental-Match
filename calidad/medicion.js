const { UMBRALES } = require("./config");
const { parsear, funciones } = require("./ast");
const { clases } = require("./clases");
const duplicacion = require("./duplicacion");
const senales = require("./senales");
const { calcularIndice } = require("./indice");

const ES_JS = /\.(js|jsx|mjs|cjs)$/;
const por1000 = (cantidad, loc) => (loc ? +((cantidad / loc) * 1000).toFixed(2) : 0);

// Métricas por función y por clase (solo JS/JSX, que es lo que el parser entiende)
function analizarEstructura(archivos) {
  const todasFunciones = [];
  const todasClases = [];
  for (const archivo of archivos.filter((a) => ES_JS.test(a.rel))) {
    const ast = parsear(archivo.texto);
    if (!ast) continue;
    funciones(ast).forEach((f) => todasFunciones.push({ ...f, rel: archivo.rel }));
    clases(ast).forEach((c) => todasClases.push({ ...c, rel: archivo.rel }));
  }
  return { funciones: todasFunciones, clases: todasClases };
}

function clasificarFunciones(lista) {
  const largas = lista.filter((f) => f.lineas >= UMBRALES.funcionLineas);
  return {
    total: lista.length,
    largas,
    metodosLargos: largas.filter((f) => f.esMetodo),
    conMuchosParametros: lista.filter((f) => f.params > UMBRALES.parametrosMax),
    complejas: lista.filter((f) => f.cc >= UMBRALES.complejidadMin),
  };
}

function clasificarClases(lista) {
  return {
    total: lista.length,
    pocoCohesivas: lista.filter((c) => c.metodos >= UMBRALES.cohesionMinMetodos && c.campos >= UMBRALES.cohesionMinCampos && c.cohesionPct < UMBRALES.cohesionPct),
    muyAcopladas: lista.filter((c) => c.cbo >= UMBRALES.cboMin),
  };
}

const sinCapasSuficientes = (capas) => capas.filter((c) => c.loc >= UMBRALES.capasMinLoc && c.cantidad < UMBRALES.capasMin);

function contarSenales(m) {
  const funcionesLargas = m.funciones.largas.length - m.funciones.metodosLargos.length;
  return {
    secreto: m.secretos.length,
    sql: m.sql.length,
    capas: sinCapasSuficientes(m.capas).length,
    cohesion: m.clases.pocoCohesivas.length,
    acoplamiento: m.clases.muyAcopladas.length,
    componenteGrande: m.grandes.length,
    metodoLargo: m.funciones.metodosLargos.length,
    complejidad: m.funciones.complejas.length,
    funcionLarga: funcionesLargas,
    parametros: m.funciones.conMuchosParametros.length,
    http: m.http.length,
    any: m.any.length,
    depuracion: m.depuracion.length,
  };
}

// Reúne todas las métricas del repo en un solo objeto (la evaluación contra las metas está en criterios.js)
function medir(archivos) {
  const loc = archivos.reduce((suma, a) => suma + a.loc, 0);
  const estructura = analizarEstructura(archivos);
  const m = {
    archivos: archivos.length,
    loc,
    funciones: clasificarFunciones(estructura.funciones),
    clases: clasificarClases(estructura.clases),
    secretos: senales.secretos(archivos),
    sql: senales.sqlConcatenado(archivos),
    depuracion: senales.depuracion(archivos),
    http: senales.httpEnComponentes(archivos),
    grandes: senales.componentesGrandes(archivos),
    any: senales.anyTypes(archivos),
    endpoints: senales.endpoints(archivos),
    vistas: senales.vistas(archivos),
    tests: senales.tests(archivos),
    capas: senales.capas(archivos),
    duplicacion: {
      identica: duplicacion.medir(archivos),
      similar: duplicacion.medir(archivos, { normalizada: true }),
    },
  };
  m.por1000 = {
    complejidad: por1000(m.funciones.complejas.length, loc),
    tamano: por1000(m.funciones.largas.length + m.funciones.conMuchosParametros.length, loc),
    acoplamiento: por1000(m.clases.muyAcopladas.length, loc),
  };
  m.indice = calcularIndice(contarSenales(m), m.duplicacion.similar.pct, loc);
  return m;
}

module.exports = { medir };
