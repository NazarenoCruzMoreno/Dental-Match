const acorn = require("acorn");
const jsx = require("acorn-jsx");

const Parser = acorn.Parser.extend(jsx());
const OPCIONES = { ecmaVersion: "latest", locations: true, allowReturnOutsideFunction: true, allowHashBang: true };

const FUNCIONES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);
const DECISION = new Set([
  "IfStatement", "ForStatement", "ForInStatement", "ForOfStatement",
  "WhileStatement", "DoWhileStatement", "CatchClause", "ConditionalExpression",
]);
const LOGICOS = new Set(["&&", "||", "??"]);

// Solo JS/JSX: los .ts/.vue/.svelte no se pueden parsear acá y quedan fuera de las métricas por función
function parsear(texto) {
  for (const sourceType of ["module", "script"]) {
    try { return Parser.parse(texto, { ...OPCIONES, sourceType }); } catch { /* probar el otro modo */ }
  }
  return null;
}

const esNodo = (valor) => valor && typeof valor.type === "string";

function hijos(nodo) {
  const salida = [];
  for (const valor of Object.values(nodo)) {
    if (Array.isArray(valor)) valor.forEach((x) => esNodo(x) && salida.push(x));
    else if (esNodo(valor)) salida.push(valor);
  }
  return salida;
}

// Recorrido sin recursión. visitar(nodo, padre) devuelve false para no entrar en los hijos.
function recorrer(raiz, visitar) {
  const pila = [[raiz, null]];
  while (pila.length) {
    const [nodo, padre] = pila.pop();
    if (visitar(nodo, padre) === false) continue;
    hijos(nodo).forEach((h) => pila.push([h, nodo]));
  }
}

function puntosDeDecision(nodo) {
  if (DECISION.has(nodo.type)) return 1;
  if (nodo.type === "LogicalExpression") return LOGICOS.has(nodo.operator) ? 1 : 0;
  if (nodo.type === "SwitchCase") return nodo.test ? 1 : 0;
  return 0;
}

// Complejidad ciclomatica: 1 + puntos de decisión; las funciones anidadas se miden por separado
function complejidad(funcion) {
  let cc = 1;
  recorrer(funcion.body, (nodo) => {
    if (FUNCIONES.has(nodo.type)) return false;
    cc += puntosDeDecision(nodo);
    return true;
  });
  return cc;
}

function nombreDe(funcion, padre) {
  if (funcion.id) return funcion.id.name;
  if (!padre) return "(anónima)";
  if (padre.type === "VariableDeclarator" && padre.id.name) return padre.id.name;
  if (padre.type === "Property" || padre.type === "MethodDefinition") return padre.key.name || "(prop)";
  if (padre.type === "AssignmentExpression" && padre.left.property) return padre.left.property.name;
  return padre.type === "CallExpression" ? "(callback)" : "(anónima)";
}

function funciones(ast) {
  const lista = [];
  recorrer(ast, (nodo, padre) => {
    if (!FUNCIONES.has(nodo.type)) return true;
    lista.push({
      nombre: nombreDe(nodo, padre),
      linea: nodo.loc.start.line,
      lineas: nodo.loc.end.line - nodo.loc.start.line + 1,
      params: nodo.params.length,
      cc: complejidad(nodo),
      esMetodo: !!padre && padre.type === "MethodDefinition",
    });
    return true;
  });
  return lista;
}

module.exports = { parsear, recorrer, funciones };
