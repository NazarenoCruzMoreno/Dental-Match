// Umbrales y pesos del "perfil exigente" de la consigna de Programación III.
// Es un análisis heurístico (regex + métricas): sirve para priorizar, no es una nota.

const UMBRALES = {
  indice: 60,
  duplicacionPct: 15,
  ventanaDuplicacion: 6,
  complejidadMin: 6,          // CC >= 6 cuenta como "alta"
  complejidadPor1000: 5,
  funcionLineas: 30,          // función >= 30 líneas cuenta como larga
  parametrosMax: 4,
  tamanoPor1000: 10,
  componenteLineas: 150,
  componentesGrandesMax: 1,
  cohesionPct: 50,
  cohesionMinMetodos: 4,
  cohesionMinCampos: 3,
  cboMin: 8,
  acoplamientoPor1000: 2,
  anyMax: 2,
  anyPorArchivo: 3,
  tests: 5,
  endpoints: 10,
  vistas: 8,
  capasMinLoc: 150,
  capasMin: 2,
};

const PESOS = {
  secreto: 20, sql: 15, capas: 10, cohesion: 8, acoplamiento: 8, componenteGrande: 6,
  metodoLargo: 5, complejidad: 5, funcionLarga: 4, parametros: 4, http: 3, any: 2, depuracion: 2,
};

// Capas que se reconocen por nombre de carpeta
const CAPAS = {
  backend: {
    presentacion: ["routes", "controllers", "api", "endpoints", "handlers"],
    logica: ["services", "use-cases", "domain", "business", "core"],
    datos: ["models", "repositories", "dao", "entities", "db", "persistence"],
  },
  frontend: {
    vistas: ["components", "views", "pages", "layouts", "ui"],
    servicios: ["services", "api", "clients", "http"],
    estado: ["store", "state", "context", "redux", "pinia", "hooks", "composables"],
  },
};

const EXTENSIONES_CODIGO = /\.(js|jsx|mjs|cjs|ts|tsx|vue|svelte)$/;
const EXTENSIONES_COMPONENTE = /\.(jsx|tsx|vue|svelte)$/;

// El medidor no se mide a sí mismo
const EXCLUIR = ["node_modules/", "dist/", "build/", "coverage/", "calidad/"];

module.exports = { UMBRALES, PESOS, CAPAS, EXTENSIONES_CODIGO, EXTENSIONES_COMPONENTE, EXCLUIR };
