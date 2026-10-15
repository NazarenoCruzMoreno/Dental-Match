const { test, describe, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const errorHandler = require('../src/middlewares/errorHandler');

const crearRes = (headersSent = false) => ({
  headersSent,
  codigo: null,
  cuerpo: null,
  status(c) { this.codigo = c; return this; },
  json(b) { this.cuerpo = b; return this; },
});

const req = { method: 'POST', originalUrl: '/api/x' };

// Errores con la forma que tienen los de body-parser / multer
const errorDeBody = (type, status) => Object.assign(new SyntaxError('Unexpected token } in JSON at position 1'), { type, status, expose: true });
const errorDeMulter = (code) => Object.assign(new Error('mensaje interno de multer'), { name: 'MulterError', code });

function manejar(err, res = crearRes()) {
  let delegado = null;
  errorHandler(err, req, res, (e) => { delegado = e; });
  return { res, delegado };
}

// El manejador loguea cada error: se silencia la consola mientras corre cada test del bloque
function silenciarConsola() {
  beforeEach(() => {
    mock.method(console, 'warn', () => {});
    mock.method(console, 'error', () => {});
  });
  afterEach(() => mock.restoreAll());
}

describe('errorHandler: errores del cuerpo de la petición', () => {
  silenciarConsola();

  test('JSON malformado -> 400 con mensaje en español (sin filtrar el texto interno)', () => {
    const { res } = manejar(errorDeBody('entity.parse.failed', 400));
    assert.equal(res.codigo, 400);
    assert.deepEqual(res.cuerpo, { error: 'El cuerpo de la petición no es un JSON válido' });
  });

  test('cuerpo demasiado grande -> 413', () => {
    assert.equal(manejar(errorDeBody('entity.too.large', 413)).res.codigo, 413);
  });

  test('charset no soportado -> 415', () => {
    assert.equal(manejar(errorDeBody('charset.unsupported', 415)).res.codigo, 415);
  });
});

describe('errorHandler: errores de subida de archivos (multer)', () => {
  silenciarConsola();

  test('imagen que supera el límite -> 413', () => {
    const { res } = manejar(errorDeMulter('LIMIT_FILE_SIZE'));
    assert.equal(res.codigo, 413);
    assert.match(res.cuerpo.error, /10 MB/);
  });

  test('otro error de multer -> 400 "Archivo inválido"', () => {
    const { res } = manejar(errorDeMulter('LIMIT_UNEXPECTED_FILE'));
    assert.equal(res.codigo, 400);
    assert.deepEqual(res.cuerpo, { error: 'Archivo inválido' });
  });
});

describe('errorHandler: errores pensados para el usuario', () => {
  silenciarConsola();

  test('un error marcado como clientError muestra su mensaje tal cual', () => {
    const { res } = manejar(Object.assign(new Error('Solo se permiten imágenes'), { clientError: true }));
    assert.equal(res.codigo, 400);
    assert.deepEqual(res.cuerpo, { error: 'Solo se permiten imágenes' });
  });

  test('un 4xx genérico responde "Solicitud inválida" sin exponer el mensaje', () => {
    const { res } = manejar(Object.assign(new Error('detalle interno'), { status: 404 }));
    assert.equal(res.codigo, 404);
    assert.deepEqual(res.cuerpo, { error: 'Solicitud inválida' });
  });

  test('ValidationError -> 400 con detalles', () => {
    const { res } = manejar(Object.assign(new Error('campo requerido'), { name: 'ValidationError' }));
    assert.equal(res.codigo, 400);
    assert.deepEqual(res.cuerpo, { error: 'Datos inválidos', details: 'campo requerido' });
  });
});

describe('errorHandler: fallos del servidor', () => {
  silenciarConsola();

  test('un fallo real -> 500 genérico, sin filtrar detalles', () => {
    const { res } = manejar(new TypeError("Cannot read properties of undefined (reading 'x')"));
    assert.equal(res.codigo, 500);
    assert.deepEqual(res.cuerpo, { error: 'Error interno del servidor' });
  });

  test('un error con status 500 no filtra su mensaje (podría traer credenciales)', () => {
    const { res } = manejar(Object.assign(new Error('conexión rechazada: password=abc'), { status: 500 }));
    assert.equal(res.codigo, 500);
    assert.doesNotMatch(JSON.stringify(res.cuerpo), /password/);
  });

  test('si la respuesta ya se envió, delega a Express en vez de responder dos veces', () => {
    const res = crearRes(true);
    const error = new Error('x');
    const { delegado } = manejar(error, res);
    assert.equal(delegado, error);
    assert.equal(res.codigo, null);
  });
});
