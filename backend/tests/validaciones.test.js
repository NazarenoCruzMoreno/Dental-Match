const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const v = require('../src/models/validaciones');

const UUID = '3b9f8f0e-6b0a-4f7e-9f4e-0a1c2d3e4f5a';
const mensajes = (resultado) => resultado.error.issues.map((i) => i.message);
const campos = (resultado) => resultado.error.issues.map((i) => i.path.join('.'));

describe('loginSchema / registerSchema', () => {
  test('acepta credenciales válidas', () => {
    assert.equal(v.loginSchema.safeParse({ email: 'a@b.com', password: '123456' }).success, true);
  });

  test('rechaza email inválido y contraseña corta, con mensajes en español', () => {
    const r = v.loginSchema.safeParse({ email: 'no-es-mail', password: '1' });
    assert.equal(r.success, false);
    assert.deepEqual(mensajes(r), ['Email inválido', 'Mínimo 6 caracteres']);
  });

  test('rechaza campos de tipo incorrecto', () => {
    assert.equal(v.loginSchema.safeParse({ email: 123, password: 456 }).success, false);
  });

  test('register exige un rol conocido', () => {
    assert.equal(v.registerSchema.safeParse({ email: 'a@b.com', password: '123456', role: 'estudiante' }).success, true);
    assert.equal(v.registerSchema.safeParse({ email: 'a@b.com', password: '123456', role: 'paciente' }).success, true);
    const r = v.registerSchema.safeParse({ email: 'a@b.com', password: '123456', role: 'admin' });
    assert.equal(r.success, false);
    assert.deepEqual(mensajes(r), ['Rol debe ser estudiante o paciente']);
  });

  test('no se puede registrar como admin aunque se mande el rol', () => {
    assert.equal(v.registerSchema.safeParse({ email: 'a@b.com', password: '123456', role: 'admin' }).success, false);
  });
});

describe('perfil de estudiante', () => {
  const base = { nombre: 'Lucía', universidad: 'UBA', materias: ['Anatomía'], disponibilidad: ['Lunes'], descripcion: 'Estudiante de segundo año' };

  test('el año de carrera vacío se trata como no informado', () => {
    const r = v.estudianteSchema.parse({ ...base, anio_carrera: '' });
    assert.equal(r.anio_carrera, undefined);
  });

  test('el año de carrera llega como string desde el formulario y se convierte a número', () => {
    assert.equal(v.estudianteSchema.parse({ ...base, anio_carrera: '3' }).anio_carrera, 3);
  });

  test('rechaza años fuera de 1 a 6', () => {
    assert.equal(v.estudianteSchema.safeParse({ ...base, anio_carrera: 7 }).success, false);
    assert.equal(v.estudianteSchema.safeParse({ ...base, anio_carrera: 0 }).success, false);
  });

  test('exige al menos una materia y una disponibilidad', () => {
    const r = v.estudianteSchema.safeParse({ ...base, materias: [], disponibilidad: [] });
    assert.deepEqual(campos(r).sort(), ['disponibilidad', 'materias']);
  });

  test('la actualización es parcial: acepta solo los campos que cambian', () => {
    assert.equal(v.estudianteUpdateSchema.safeParse({ nombre: 'Nuevo nombre' }).success, true);
    assert.equal(v.estudianteUpdateSchema.safeParse({}).success, true);
  });
});

describe('perfil de paciente', () => {
  const base = { nombre: 'Pablo', edad: 28, problemaDental: 'Dolor agudo en una muela' };

  test('la edad es obligatoria y no puede venir vacía', () => {
    const r = v.pacienteSchema.safeParse({ ...base, edad: '' });
    assert.equal(r.success, false);
    assert.deepEqual(mensajes(r), ['La edad es requerida']);
  });

  test('convierte la edad de string a número y valida el rango', () => {
    assert.equal(v.pacienteSchema.parse({ ...base, edad: '28' }).edad, 28);
    assert.equal(v.pacienteSchema.safeParse({ ...base, edad: 130 }).success, false);
  });

  test('el teléfono vacío se descarta; uno muy corto se rechaza', () => {
    assert.equal(v.pacienteSchema.parse({ ...base, telefono: '' }).telefono, undefined);
    assert.equal(v.pacienteSchema.safeParse({ ...base, telefono: '123' }).success, false);
    assert.equal(v.pacienteSchema.parse({ ...base, telefono: '1155552222' }).telefono, '1155552222');
  });
});

describe('caso clínico', () => {
  const base = { titulo: 'Dolor de muela', descripcion: 'Me duele desde hace cinco días al masticar' };

  test('exige título y descripción con largo mínimo', () => {
    const r = v.casoSchema.safeParse({ titulo: 'Hola', descripcion: 'corta' });
    assert.deepEqual(campos(r).sort(), ['descripcion', 'titulo']);
  });

  test('es_analisis llega como string de un FormData y se convierte a booleano', () => {
    assert.equal(v.casoSchema.parse({ ...base, es_analisis: 'true' }).es_analisis, true);
    assert.equal(v.casoSchema.parse({ ...base, es_analisis: 'false' }).es_analisis, false);
  });

  test('la actualización solo acepta estados conocidos', () => {
    assert.equal(v.casoUpdateSchema.safeParse({ estado: 'completado' }).success, true);
    assert.equal(v.casoUpdateSchema.safeParse({ estado: 'inventado' }).success, false);
  });
});

describe('finalizar caso', () => {
  const base = { diagnostico: 'Caries profunda en molar', tratamiento_asignado: 'Obturación' };

  test('la calificación va de 1 a 5 y puede llegar como string', () => {
    assert.equal(v.finalizarCasoSchema.parse({ ...base, rating_paciente: '5' }).rating_paciente, 5);
    assert.equal(v.finalizarCasoSchema.safeParse({ ...base, rating_paciente: 6 }).success, false);
    assert.equal(v.finalizarCasoSchema.safeParse({ ...base, rating_paciente: 0 }).success, false);
  });

  test('el comentario tiene un tope de 500 caracteres', () => {
    assert.equal(v.finalizarCasoSchema.safeParse({ ...base, rating_paciente: 4, comentario: 'x'.repeat(501) }).success, false);
    assert.equal(v.finalizarCasoSchema.safeParse({ ...base, rating_paciente: 4, comentario: 'x'.repeat(500) }).success, true);
  });
});

describe('turnos', () => {
  const base = { caso_id: UUID, fecha: '2026-10-20', hora: '15:30' };

  test('acepta un turno válido; la duración es opcional', () => {
    const r = v.turnoSchema.parse(base);
    assert.equal(r.duracion_minutos, undefined);
  });

  test('exige caso_id uuid, fecha YYYY-MM-DD y hora HH:MM', () => {
    const r = v.turnoSchema.safeParse({ caso_id: '123', fecha: '20/10/2026', hora: '3pm' });
    assert.deepEqual(campos(r).sort(), ['caso_id', 'fecha', 'hora']);
  });

  test('la duración se convierte a número y se limita entre 15 y 240 minutos', () => {
    assert.equal(v.turnoSchema.parse({ ...base, duracion_minutos: '45' }).duracion_minutos, 45);
    assert.equal(v.turnoSchema.safeParse({ ...base, duracion_minutos: 10 }).success, false);
    assert.equal(v.turnoSchema.safeParse({ ...base, duracion_minutos: 300 }).success, false);
  });

  test('la actualización solo acepta los estados del modelo de datos', () => {
    for (const estado of ['pendiente', 'propuesto', 'confirmado', 'completado', 'cancelado', 'rechazado']) {
      assert.equal(v.turnoUpdateSchema.safeParse({ estado }).success, true, estado);
    }
    assert.equal(v.turnoUpdateSchema.safeParse({ estado: 'aprobado' }).success, false);
  });
});
