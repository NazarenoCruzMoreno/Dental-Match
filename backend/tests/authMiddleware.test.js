require('./_entorno');
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { generarToken } = require('../src/config/jwt');
const { authMiddleware, roleMiddleware, isAdmin } = require('../src/middlewares/auth');

// Respuesta falsa de Express: guarda el status y el cuerpo que se envían
const crearRes = () => ({
  codigo: null,
  cuerpo: null,
  status(c) { this.codigo = c; return this; },
  json(b) { this.cuerpo = b; return this; },
});

// Ejecuta un middleware y dice si llamó a next()
async function ejecutar(middleware, req) {
  const res = crearRes();
  let siguio = false;
  await middleware(req, res, () => { siguio = true; });
  return { res, siguio };
}

describe('authMiddleware: sin credenciales válidas', () => {
  test('sin encabezado Authorization responde 401 "Token requerido"', async () => {
    const { res, siguio } = await ejecutar(authMiddleware, { headers: {} });
    assert.equal(siguio, false);
    assert.equal(res.codigo, 401);
    assert.deepEqual(res.cuerpo, { error: 'Token requerido' });
  });

  test('un encabezado sin el esquema "Bearer <token>" también es "Token requerido"', async () => {
    const { res } = await ejecutar(authMiddleware, { headers: { authorization: 'soloUnToken' } });
    assert.equal(res.codigo, 401);
    assert.deepEqual(res.cuerpo, { error: 'Token requerido' });
  });

  test('un token inválido responde 401 "Token inválido"', async () => {
    const { res, siguio } = await ejecutar(authMiddleware, { headers: { authorization: 'Bearer basura' } });
    assert.equal(siguio, false);
    assert.equal(res.codigo, 401);
    assert.deepEqual(res.cuerpo, { error: 'Token inválido' });
  });
});

describe('authMiddleware: con credenciales válidas', () => {
  test('un token válido deja el usuario en req.user y sigue', async () => {
    const token = generarToken({ id: 'u-1', email: 'a@b.com', role: 'estudiante' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const { siguio } = await ejecutar(authMiddleware, req);
    assert.equal(siguio, true);
    assert.equal(req.user.id, 'u-1');
    assert.equal(req.user.role, 'estudiante');
  });
});

describe('roleMiddleware / isAdmin', () => {
  test('deja pasar a un rol permitido', async () => {
    const { siguio } = await ejecutar(roleMiddleware(['estudiante', 'paciente']), { user: { role: 'paciente' } });
    assert.equal(siguio, true);
  });

  test('bloquea con 403 a un rol no permitido', async () => {
    const { res, siguio } = await ejecutar(roleMiddleware(['estudiante']), { user: { role: 'paciente' } });
    assert.equal(siguio, false);
    assert.equal(res.codigo, 403);
    assert.deepEqual(res.cuerpo, { error: 'Acceso denegado' });
  });

  test('isAdmin solo deja pasar al rol admin', async () => {
    assert.equal((await ejecutar(isAdmin, { user: { role: 'admin' } })).siguio, true);
    for (const role of ['paciente', 'estudiante']) {
      const { res, siguio } = await ejecutar(isAdmin, { user: { role } });
      assert.equal(siguio, false, role);
      assert.equal(res.codigo, 403, role);
    }
  });
});
