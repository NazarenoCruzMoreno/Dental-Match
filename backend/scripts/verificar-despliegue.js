#!/usr/bin/env node
// Verifica que un despliegue de Dental Match quedó bien armado.
//
//   npm run verificar -- --api=https://mi-api.onrender.com --front=https://mi-sitio.vercel.app
//
// - Con --api (y opcionalmente --front) prueba lo que se ve desde afuera: API, CORS, base, sitio.
// - Si hay SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (en backend/.env o en el entorno),
//   revisa además la base: tablas, columnas, bucket de imágenes y administrador.
// Termina con código 1 si algo FALLA; los AVISOS no hacen fallar.
const fs = require('node:fs');
const path = require('node:path');

const ESQUEMA = path.join(__dirname, '..', 'supabase_schema.sql');
const ESPERA_MS = 60000; // un servidor gratis dormido puede tardar ~50 s en despertar
const BUCKET = 'dental-match';

// ── Esquema: tabla -> columnas (la fuente de verdad es supabase_schema.sql) ──
function columnasDelEsquema(sql) {
  const limpio = sql.replace(/--.*$/gm, '');
  const tablas = {};
  for (const m of limpio.matchAll(/CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(([\s\S]*?)\n\);/gi)) {
    tablas[m[1]] = m[2]
      .split('\n')
      .map((linea) => linea.trim())
      .filter((linea) => /^[a-z_]+\s+[A-Za-z]/.test(linea) && !/^(PRIMARY|UNIQUE|CONSTRAINT|CHECK|FOREIGN)\b/i.test(linea))
      .map((linea) => linea.split(/\s+/)[0]);
  }
  return tablas;
}

// ── Resultados ──────────────────────────────────────────────────────────────
const resultados = [];
const registrar = (estado, titulo, detalle = '') => resultados.push({ estado, titulo, detalle });
const ok = (titulo, detalle) => registrar('OK', titulo, detalle);
const falla = (titulo, detalle) => registrar('FALLA', titulo, detalle);
const aviso = (titulo, detalle) => registrar('AVISO', titulo, detalle);

async function pedir(url, opciones = {}) {
  return fetch(url, { ...opciones, signal: AbortSignal.timeout(ESPERA_MS), redirect: 'follow' });
}

const sinBarra = (url) => url.replace(/\/+$/, '');

// ── Desde afuera: la API ────────────────────────────────────────────────────
async function verificarApi(api, front) {
  try {
    const res = await pedir(`${api}/api/health`);
    const cuerpo = await res.json().catch(() => ({}));
    if (res.status === 200 && cuerpo.status === 'OK') ok('La API responde', `${api}/api/health`);
    else return falla('La API no responde bien', `/api/health devolvió ${res.status}`);
    if (res.headers.get('x-content-type-options') === 'nosniff') ok('Cabeceras de seguridad activas');
    else aviso('Faltan cabeceras de seguridad', 'esperaba helmet en el backend');
  } catch (error) {
    return falla('No se pudo llegar a la API', `${api}: ${error.message}`);
  }
  await verificarBaseDesdeApi(api);
  if (front) await verificarCors(api, front);
}

async function verificarBaseDesdeApi(api) {
  const res = await pedir(`${api}/api/stats`).catch((e) => ({ status: 0, error: e.message }));
  if (res.status === 200) ok('La API llega a la base de datos', '/api/stats consulta las tablas');
  else falla('La API no puede consultar la base', `/api/stats devolvió ${res.status || res.error}: revisá SUPABASE_URL y las claves, y que se haya corrido supabase_schema.sql`);
}

async function verificarCors(api, front) {
  const origen = new URL(front).origin;
  const res = await pedir(`${api}/api/health`, { headers: { Origin: origen } });
  if (res.headers.get('access-control-allow-origin') === origen) ok('CORS permite al sitio', origen);
  else falla('El backend rechaza al sitio (CORS)', `FRONTEND_URL en el backend tiene que incluir ${origen} (varios separados por coma)`);
}

// ── Desde afuera: el sitio ──────────────────────────────────────────────────
async function verificarSitio(front, api) {
  try {
    const inicio = await pedir(front);
    const html = await inicio.text();
    if (inicio.status !== 200 || !/<div id="root"/.test(html)) return falla('El sitio no carga', `${front} devolvió ${inicio.status}`);
    ok('El sitio carga', front);
    const login = await pedir(`${front}/login`);
    if (login.status === 200) ok('Las rutas del sitio funcionan (/login)');
    else falla('Las rutas internas dan error al recargar', `${front}/login devolvió ${login.status}: falta la regla de reescritura (frontend/vercel.json)`);
    await verificarBundle(front, html, api);
  } catch (error) {
    falla('No se pudo cargar el sitio', `${front}: ${error.message}`);
  }
}

async function verificarBundle(front, html, api) {
  const src = (html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/) || [])[1];
  if (!src) return aviso('No se encontró el código del sitio para revisar sus variables');
  const js = await (await pedir(new URL(src, front).href)).text();
  if (/localhost:3000/.test(js)) falla('El sitio apunta a localhost', 'falta VITE_API_URL en el build del frontend (hay que redeployar después de cargarla)');
  else if (api && js.includes(new URL(api).host)) ok('El sitio apunta a la API correcta', new URL(api).host);
  else if (api) falla('El sitio no apunta a la API indicada', `VITE_API_URL debería ser ${api}`);
  if (/B[A-Za-z0-9_-]{86}/.test(js)) ok('El sitio trae la clave pública de notificaciones');
  else aviso('El sitio no trae VITE_VAPID_PUBLIC_KEY', 'las notificaciones push no van a funcionar hasta cargarla y redeployar');
}

// ── Desde adentro: la base ──────────────────────────────────────────────────
async function verificarBase(supabase) {
  const tablas = columnasDelEsquema(fs.readFileSync(ESQUEMA, 'utf8'));
  const problemas = [];
  for (const [tabla, columnas] of Object.entries(tablas)) {
    const { error } = await supabase.from(tabla).select(columnas.join(',')).limit(0);
    if (error) problemas.push(`${tabla}: ${error.message}`);
  }
  if (problemas.length) falla('La base no coincide con el esquema', problemas.join(' | '));
  else ok(`La base tiene las ${Object.keys(tablas).length} tablas y todas sus columnas`);
  await verificarBucket(supabase);
  await verificarAdmin(supabase);
}

async function verificarBucket(supabase) {
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (error || !data) return falla(`No existe el bucket "${BUCKET}"`, 'las imágenes no se van a poder subir: correr la última parte de supabase_schema.sql');
  if (data.public) ok(`El bucket "${BUCKET}" existe y es público`);
  else falla(`El bucket "${BUCKET}" es privado`, 'las imágenes no se van a ver: marcarlo como público en Supabase → Storage');
}

async function verificarAdmin(supabase) {
  const { count, error } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin');
  if (error) return;
  if (count > 0) ok('Hay un usuario administrador');
  else aviso('Todavía no hay un administrador', "registrar un usuario y correr: update users set role = 'admin' where email = '...';");
}

async function conectarBase() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const { createClient } = require('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

// ── Salida ──────────────────────────────────────────────────────────────────
const ETIQUETA = { OK: '[ OK  ]', FALLA: '[FALLA]', AVISO: '[AVISO]' };

function imprimir() {
  const lineas = resultados.map((r) => `${ETIQUETA[r.estado]} ${r.titulo}${r.detalle ? `\n         ${r.detalle}` : ''}`);
  const fallas = resultados.filter((r) => r.estado === 'FALLA').length;
  const avisos = resultados.filter((r) => r.estado === 'AVISO').length;
  const cierre = fallas ? `${fallas} FALLA(S): corregilas y volvé a correr este comando.` : `Todo en orden${avisos ? ` (${avisos} aviso/s para revisar)` : ''}.`;
  process.stdout.write(`\n${lineas.join('\n')}\n\n${cierre}\n`);
  return fallas ? 1 : 0;
}

const valorDe = (argv, nombre) => (argv.find((a) => a.startsWith(`${nombre}=`)) || '').slice(nombre.length + 1);

async function main(argv) {
  const api = sinBarra(valorDe(argv, '--api'));
  const front = sinBarra(valorDe(argv, '--front'));
  const supabase = await conectarBase();
  if (!api && !front && !supabase) {
    process.stdout.write('Indicá al menos --api=<url> (y --front=<url>), o configurá SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.\n');
    return 2;
  }
  if (api) await verificarApi(api, front);
  if (front) await verificarSitio(front, api);
  if (supabase) await verificarBase(supabase);
  else aviso('Base de datos sin revisar', 'faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (backend/.env)');
  return imprimir();
}

if (require.main === module) {
  main(process.argv.slice(2)).then((codigo) => { process.exitCode = codigo; });
}

module.exports = { columnasDelEsquema };
