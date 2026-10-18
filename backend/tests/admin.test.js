require('./_entorno');
const { test, describe, before, after, mock } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const app = require('../src/app');
const { generarToken } = require('../src/config/jwt');
const { rutaEnStorage } = require('../src/utils/storage');

// Solo casos que se resuelven antes de consultar la base: permisos y validación de entrada.
let servidor;
let base;

const conToken = (role) => ({ Authorization: `Bearer ${generarToken({ id: 'u-1', email: 'x@test.com', role })}` });
const pedir = (metodo, ruta, headers = {}) => fetch(base + ruta, { method: metodo, headers });

const ID_VALIDO = '1cfa6c9c-2d08-4cc3-bc7c-9f3a966cdf73';
const RUTAS = [
  ['GET', '/api/admin/usuarios'],
  ['GET', '/api/admin/casos'],
  ['DELETE', `/api/admin/casos/${ID_VALIDO}`],
  ['DELETE', `/api/admin/casos/${ID_VALIDO}/imagen`],
];

before(async () => {
  mock.method(console, 'warn', () => {});
  mock.method(console, 'error', () => {});
  servidor = app.listen(0);
  await once(servidor, 'listening');
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  mock.restoreAll();
  servidor.closeAllConnections();
  await new Promise((resolver) => servidor.close(resolver));
});

describe('API admin: permisos', () => {
  for (const [metodo, ruta] of RUTAS) {
    test(`${metodo} ${ruta.replace(ID_VALIDO, ':id')} sin token -> 401`, async () => {
      assert.equal((await pedir(metodo, ruta)).status, 401);
    });

    test(`${metodo} ${ruta.replace(ID_VALIDO, ':id')} con paciente o estudiante -> 403`, async () => {
      for (const rol of ['paciente', 'estudiante']) {
        assert.equal((await pedir(metodo, ruta, conToken(rol))).status, 403, rol);
      }
    });
  }
});

describe('API admin: validación de entrada', () => {
  test('filtrar usuarios por un rol inexistente -> 400', async () => {
    const res = await pedir('GET', '/api/admin/usuarios?rol=superadmin', conToken('admin'));
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: 'Rol no válido' });
  });

  test('borrar un caso con un id que no es UUID -> 400', async () => {
    const res = await pedir('DELETE', '/api/admin/casos/no-es-uuid', conToken('admin'));
    assert.equal(res.status, 400);
  });

  test('quitar imagen con un id que no es UUID -> 400', async () => {
    const res = await pedir('DELETE', '/api/admin/casos/1%27%20or%201=1/imagen', conToken('admin'));
    assert.equal(res.status, 400);
  });
});

describe('rutaEnStorage', () => {
  test('extrae bucket y ruta de una URL pública de Supabase', () => {
    const url = 'https://abc.supabase.co/storage/v1/object/public/dental-match/casos/1a2b3c.jpeg';
    assert.deepEqual(rutaEnStorage(url), { bucket: 'dental-match', ruta: 'casos/1a2b3c.jpeg' });
  });

  test('ignora parámetros de consulta y decodifica el nombre', () => {
    const url = 'https://abc.supabase.co/storage/v1/object/public/dental-match/pacientes/foto%20uno.png?t=1';
    assert.deepEqual(rutaEnStorage(url), { bucket: 'dental-match', ruta: 'pacientes/foto uno.png' });
  });

  test('devuelve null si no es una URL de Storage', () => {
    for (const valor of ['https://ejemplo.com/foto.jpg', '', null, undefined, 42]) {
      assert.equal(rutaEnStorage(valor), null, String(valor));
    }
  });
});
