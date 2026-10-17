const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Guarda contra el problema que ya pasó: tablas que el código usa pero que ningún
// script crea (casos, aplicaciones, messages, reviews, image_hashes). Sin esto, un
// comprador no puede armar la base desde el repo.
const RAIZ = path.join(__dirname, '..');
// Sin comentarios: un "-- CREATE TABLE ..." en un comentario no cuenta como tabla
const esquema = fs.readFileSync(path.join(RAIZ, 'supabase_schema.sql'), 'utf8').replace(/--.*$/gm, '');

function archivosJs(carpeta) {
  return fs.readdirSync(carpeta, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(carpeta, e.name);
    if (e.isDirectory()) return archivosJs(ruta);
    return ruta.endsWith('.js') ? [ruta] : [];
  });
}

const tablasCreadas = new Set([...esquema.matchAll(/CREATE TABLE IF NOT EXISTS\s+(\w+)/gi)].map((m) => m[1]));

const tablasUsadas = new Set(
  [...archivosJs(path.join(RAIZ, 'src')), ...archivosJs(path.join(RAIZ, 'scripts'))]
    .flatMap((f) => [...fs.readFileSync(f, 'utf8').matchAll(/\.from\(\s*['"](\w+)['"]\s*\)/g)])
    .map((m) => m[1])
    .filter((t) => t !== 'dental-match'),
);

describe('supabase_schema.sql', () => {
  test('crea toda tabla que el código consulta', () => {
    const faltan = [...tablasUsadas].filter((t) => !tablasCreadas.has(t));
    assert.deepEqual(faltan, [], `el código usa tablas que el esquema no crea: ${faltan.join(', ')}`);
  });

  test('no define tablas que el código no usa (sería un esquema desactualizado)', () => {
    const sobran = [...tablasCreadas].filter((t) => !tablasUsadas.has(t));
    assert.deepEqual(sobran, [], `el esquema crea tablas que el código no usa: ${sobran.join(', ')}`);
  });

  test('ninguna tabla se define dos veces', () => {
    const todas = [...esquema.matchAll(/CREATE TABLE IF NOT EXISTS\s+(\w+)/gi)].map((m) => m[1]);
    assert.equal(todas.length, tablasCreadas.size);
  });

  test('cada tabla desactiva RLS (la seguridad la hace el backend con la service key)', () => {
    for (const tabla of tablasCreadas) {
      assert.match(esquema, new RegExp(`ALTER TABLE\\s+${tabla}\\s+DISABLE ROW LEVEL SECURITY`, 'i'), tabla);
    }
  });

  test('crea el bucket de Storage que usa el middleware de subida', () => {
    const subida = fs.readFileSync(path.join(RAIZ, 'src', 'middlewares', 'upload.js'), 'utf8');
    const bucket = subida.match(/const BUCKET\s*=\s*['"]([\w-]+)['"]/)[1];
    assert.match(esquema, new RegExp(`INSERT INTO storage\\.buckets[\\s\\S]*'${bucket}'`, 'i'));
  });

  test('el bucket se crea público (el backend guarda la URL pública)', () => {
    assert.match(esquema, /VALUES\s*\(\s*'dental-match'\s*,\s*'dental-match'\s*,\s*TRUE\s*\)/i);
  });
});
