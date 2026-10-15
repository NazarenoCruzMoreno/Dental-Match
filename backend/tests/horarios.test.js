const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { aMinutos, seSolapan } = require('../src/utils/horarios');

describe('aMinutos', () => {
  test('convierte HH:MM a minutos desde medianoche', () => {
    assert.equal(aMinutos('00:00'), 0);
    assert.equal(aMinutos('09:30'), 570);
    assert.equal(aMinutos('23:59'), 1439);
  });

  test('acepta el formato HH:MM:SS que devuelve Postgres para un TIME', () => {
    assert.equal(aMinutos('10:00:00'), 600);
    assert.equal(aMinutos('10:00:00'), aMinutos('10:00'));
  });
});

const diez = 600;

describe('seSolapan: casos en que SÍ chocan (inicio y duración en minutos)', () => {
  test('dos turnos en el mismo horario se solapan', () => {
    assert.equal(seSolapan(diez, 60, diez, 60), true);
  });

  test('un turno que empieza a mitad de otro se solapa', () => {
    assert.equal(seSolapan(diez, 60, diez + 30, 30), true);
    assert.equal(seSolapan(diez + 30, 30, diez, 60), true);
  });

  test('un turno contenido dentro de otro se solapa', () => {
    assert.equal(seSolapan(diez, 120, diez + 30, 30), true);
  });

  test('el choque que el viejo chequeo por strings no veía ("10:00:00" vs "10:00")', () => {
    const desdeLaBase = aMinutos('10:00:00');
    const desdeElCliente = aMinutos('10:00');
    assert.equal(seSolapan(desdeElCliente, 60, desdeLaBase, 60), true);
  });
});

describe('seSolapan: casos en que NO chocan', () => {
  test('turnos consecutivos (uno termina cuando empieza el otro) NO se solapan', () => {
    assert.equal(seSolapan(diez, 60, diez + 60, 60), false);
    assert.equal(seSolapan(diez + 60, 60, diez, 60), false);
  });

  test('turnos separados no se solapan', () => {
    assert.equal(seSolapan(diez, 60, diez + 180, 60), false);
  });
});
