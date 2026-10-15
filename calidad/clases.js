const { recorrer } = require("./ast");

const esThisMiembro = (n) =>
  n.type === "MemberExpression" && n.object.type === "ThisExpression" && !n.computed && n.property.type === "Identifier";

function camposUsadosPor(nodo) {
  const campos = new Set();
  recorrer(nodo, (n) => { if (esThisMiembro(n)) campos.add(n.property.name); return true; });
  return campos;
}

// Nombres que el archivo trae de afuera (import / require): sirven para estimar el acoplamiento
function nombresImportados(ast) {
  const nombres = new Set();
  recorrer(ast, (n) => {
    if (n.type === "ImportDeclaration") n.specifiers.forEach((s) => nombres.add(s.local.name));
    const esRequire = n.type === "VariableDeclarator" && n.init && n.init.type === "CallExpression" && n.init.callee.name === "require";
    if (esRequire && n.id.type === "Identifier") nombres.add(n.id.name);
    if (esRequire && n.id.type === "ObjectPattern") n.id.properties.forEach((p) => p.value && p.value.name && nombres.add(p.value.name));
    return true;
  });
  return nombres;
}

function acoplamiento(clase, importados) {
  const usados = new Set();
  recorrer(clase, (n) => { if (n.type === "Identifier" && importados.has(n.name)) usados.add(n.name); return true; });
  return usados.size;
}

// Cohesión aproximada: promedio, por campo, de qué fracción de los métodos lo usa
function cohesionPct(metodos, campos) {
  if (!metodos.length || !campos.size) return 100;
  const usosPorCampo = [...campos].map((c) => metodos.filter((m) => camposUsadosPor(m).has(c)).length / metodos.length);
  return Math.round((usosPorCampo.reduce((a, b) => a + b, 0) / campos.size) * 100);
}

const METODOS_HEREDADOS = new Set(["setState", "forceUpdate"]);
const esFuncion = (n) => !!n && (n.type === "ArrowFunctionExpression" || n.type === "FunctionExpression");

// Una propiedad que guarda una función (handleX = () => ...) es un método, no un campo de datos
function miembrosDe(nodo) {
  const cuerpo = nodo.body.body;
  const metodos = cuerpo.filter((m) => m.type === "MethodDefinition" || (m.type === "PropertyDefinition" && esFuncion(m.value)));
  const nombresMetodos = new Set(metodos.map((m) => m.key.name).filter(Boolean));
  const campos = camposUsadosPor(nodo);
  [...nombresMetodos, ...METODOS_HEREDADOS].forEach((n) => campos.delete(n));
  cuerpo.filter((m) => m.type === "PropertyDefinition" && !esFuncion(m.value) && m.key.name).forEach((m) => campos.add(m.key.name));
  return { metodos, campos };
}

function analizarClase(nodo, importados) {
  const { metodos, campos } = miembrosDe(nodo);
  return {
    nombre: nodo.id ? nodo.id.name : "(anónima)",
    linea: nodo.loc.start.line,
    metodos: metodos.length,
    campos: campos.size,
    cohesionPct: cohesionPct(metodos, campos),
    cbo: acoplamiento(nodo, importados),
  };
}

function clases(ast) {
  const importados = nombresImportados(ast);
  const lista = [];
  recorrer(ast, (n) => {
    if (n.type === "ClassDeclaration" || n.type === "ClassExpression") lista.push(analizarClase(n, importados));
    return true;
  });
  return lista;
}

module.exports = { clases };
