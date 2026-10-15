#!/usr/bin/env node
const path = require("path");
const { listarArchivos } = require("./archivos");
const { medir } = require("./medicion");
const { evaluar } = require("./criterios");
const { armarReporte, aJson, resumen } = require("./reporte");

const AYUDA = `
Uso: npm run calidad [-- opciones]

  --detalle        lista hasta 20 casos por criterio que falla (por defecto 5)
  --json           salida en JSON (para guardar o comparar)
  --ci             termina con código 1 si no se cumplen todos los criterios
  --raiz=<ruta>    mide otro repositorio git (por defecto, este)
  --ayuda          muestra esto
`;

const valorDe = (argv, nombre) => (argv.find((a) => a.startsWith(`${nombre}=`)) || "").slice(nombre.length + 1);

function ejecutar(argv) {
  if (argv.includes("--ayuda") || argv.includes("-h")) { process.stdout.write(AYUDA); return 0; }
  const raiz = path.resolve(valorDe(argv, "--raiz") || path.join(__dirname, ".."));
  const archivos = listarArchivos(raiz);
  const medicion = medir(archivos);
  const criterios = evaluar(medicion);
  const salida = argv.includes("--json") ? aJson(medicion, criterios) : armarReporte(medicion, criterios, { detalle: argv.includes("--detalle") });
  process.stdout.write(`${salida}\n`);
  return argv.includes("--ci") && !resumen(criterios).aprobado ? 1 : 0;
}

try {
  process.exitCode = ejecutar(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`No se pudo medir: ${error.message}\n(¿es un repositorio git? el medidor usa "git ls-files")\n`);
  process.exitCode = 2;
}
