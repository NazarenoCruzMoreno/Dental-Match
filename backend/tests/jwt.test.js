require('./_entorno');
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { generarToken, verificarToken } = require('../src/config/jwt');

const usuario = { id: 'u-1', email: 'pablo@test.com', role: 'paciente' };
const enBase64Url = (objeto) => Buffer.from(JSON.stringify(objeto)).toString('base64url');

describe('JWT: tokens válidos', () => {
  test('un token generado se verifica y devuelve el mismo payload', () => {
    const decodificado = verificarToken(generarToken(usuario));
    assert.equal(decodificado.id, usuario.id);
    assert.equal(decodificado.email, usuario.email);
    assert.equal(decodificado.role, usuario.role);
  });

  test('el token vence a los 7 días', () => {
    const { iat, exp } = verificarToken(generarToken(usuario));
    assert.equal(exp - iat, 7 * 24 * 60 * 60);
  });
});

describe('JWT: tokens que se rechazan', () => {
  test('firmado con otro secreto', () => {
    assert.throws(() => verificarToken(jwt.sign(usuario, 'otro-secreto')), { name: 'JsonWebTokenError' });
  });

  test('alterado (cambiar el rol sin volver a firmar)', () => {
    const [cabecera, , firma] = generarToken(usuario).split('.');
    const cargaFalsa = enBase64Url({ ...usuario, role: 'admin' });
    assert.throws(() => verificarToken(`${cabecera}.${cargaFalsa}.${firma}`), { name: 'JsonWebTokenError' });
  });

  test('vencido', () => {
    const vencido = jwt.sign(usuario, process.env.JWT_SECRET, { expiresIn: -10 });
    assert.throws(() => verificarToken(vencido), { name: 'TokenExpiredError' });
  });

  test('sin firma (algoritmo none)', () => {
    const sinFirma = `${enBase64Url({ alg: 'none', typ: 'JWT' })}.${enBase64Url(usuario)}.`;
    assert.throws(() => verificarToken(sinFirma));
  });
});
