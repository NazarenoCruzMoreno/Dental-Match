require('./_entorno');
const { test, describe, before, after, mock } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const app = require('../src/app');
const { generarToken } = require('../src/config/jwt');

// Integración: se levanta la API real en un puerto libre. Solo se prueban casos que se
// resuelven ANTES de consultar la base (validación, autenticación, permisos).
// Ojo: /api/auth/* limita a 5 intentos fallidos por IP cada 15 min; acá se usan 4.
let servidor;
let base;

const enviarJson = (ruta, cuerpo, headers = {}) =>
  fetch(base + ruta, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: cuerpo });
const conToken = (role) => ({ Authorization: `Bearer ${generarToken({ id: 'u-1', email: 'x@test.com', role })}` });

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

describe('API: disponibilidad y cabeceras', () => {
  test('GET /api/health responde 200 con cabeceras de seguridad y límite de pedidos', async () => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, 'OK');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(res.headers.get('strict-transport-security'));
    assert.equal(res.headers.get('ratelimit-limit'), '100');
  });
});

describe('API: errores del cliente en /api/auth/login', () => {
  test('JSON malformado -> 400 (antes era 500)', async () => {
    const res = await enviarJson('/api/auth/login', '{malformado');
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: 'El cuerpo de la petición no es un JSON válido' });
  });

  test('datos inválidos -> 400 con el detalle de cada campo (antes era 500)', async () => {
    const res = await enviarJson('/api/auth/login', JSON.stringify({ email: 'no-es-mail', password: '1' }));
    assert.equal(res.status, 400);
    const cuerpo = await res.json();
    assert.equal(cuerpo.error, 'Datos inválidos');
    assert.deepEqual(cuerpo.details.map((d) => d.path[0]).sort(), ['email', 'password']);
  });

  test('cuerpo vacío -> 400 indicando los campos obligatorios', async () => {
    const res = await enviarJson('/api/auth/login', '{}');
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, 'Datos inválidos');
  });

  test('cuerpo de más de 10 MB -> 413', async () => {
    const res = await enviarJson('/api/auth/login', JSON.stringify({ relleno: 'x'.repeat(11 * 1024 * 1024) }));
    assert.equal(res.status, 413);
    assert.match((await res.json()).error, /demasiado grande/);
  });
});

describe('API: autenticación', () => {
  test('una ruta privada sin token -> 401 "Token requerido"', async () => {
    const res = await fetch(`${base}/api/profile`);
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: 'Token requerido' });
  });

  test('una ruta privada con un token inválido -> 401', async () => {
    const res = await fetch(`${base}/api/profile`, { headers: { Authorization: 'Bearer basura' } });
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: 'Token inválido' });
  });

  test('el panel admin sin token -> 401', async () => {
    assert.equal((await fetch(`${base}/api/admin/stats`)).status, 401);
  });
});

describe('API: permisos por rol', () => {
  test('el panel admin con un token de paciente o estudiante -> 403', async () => {
    for (const role of ['paciente', 'estudiante']) {
      const res = await fetch(`${base}/api/admin/stats`, { headers: conToken(role) });
      assert.equal(res.status, 403, role);
      assert.deepEqual(await res.json(), { error: 'Acceso denegado' });
    }
  });

  test('un estudiante no puede reservar turnos (solo el paciente) -> 403', async () => {
    const res = await enviarJson('/api/turnos', JSON.stringify({}), conToken('estudiante'));
    assert.equal(res.status, 403);
  });

  test('un paciente no puede proponer turnos (solo el estudiante) -> 403', async () => {
    const res = await enviarJson('/api/turnos/proponer', JSON.stringify({}), conToken('paciente'));
    assert.equal(res.status, 403);
  });
});
