const { z } = require('zod');

// ── Auth ──────────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const registerSchema = loginSchema.extend({
  role: z.enum(['estudiante', 'paciente'], {
    errorMap: () => ({ message: 'Rol debe ser estudiante o paciente' }),
  }),
});

// ── Perfil Estudiante ─────────────────────────────────────────────────────────
const estudianteSchema = z.object({
  nombre:        z.string().min(2, 'Nombre muy corto'),
  universidad:   z.string().min(2, 'Universidad requerida'),
  anio_carrera:  z.preprocess(
    v => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().min(1).max(6).optional()
  ),
  materias:      z.array(z.string()).min(1, 'Agregá al menos una materia'),
  disponibilidad:z.array(z.string()).min(1, 'Indicá tu disponibilidad'),
  descripcion:   z.string().min(10, 'Descripción muy corta'),
});

const estudianteUpdateSchema = estudianteSchema.partial();

// ── Perfil Paciente ───────────────────────────────────────────────────────────
const pacienteSchema = z.object({
  nombre:        z.string().min(2, 'Nombre muy corto'),
  edad:          z.preprocess(
    v => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number({ required_error: 'La edad es requerida' }).int().min(1).max(120)
  ),
  telefono:      z.union([z.string().min(7), z.literal('')])
    .optional()
    .transform(v => (v === '' ? undefined : v)),
  problemaDental:z.string().min(10, 'Describí el problema con más detalle'),
});

const pacienteUpdateSchema = pacienteSchema.partial();

// ── Caso clínico ──────────────────────────────────────────────────────────────
const casoSchema = z.object({
  titulo:           z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  descripcion:      z.string().min(20, 'Describí el caso con más detalle (mínimo 20 caracteres)'),
  tipo_tratamiento: z.string().optional(),
  notas:            z.string().optional(),
});

const casoUpdateSchema = casoSchema.partial().extend({
  estado: z.enum(['abierto', 'en_progreso', 'completado', 'cancelado']).optional(),
});

// ── Turno ─────────────────────────────────────────────────────────────────────
const turnoSchema = z.object({
  caso_id:           z.string().uuid('caso_id inválido'),
  fecha:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  hora:              z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  duracion_minutos:  z.preprocess(v => v ? Number(v) : 60, z.number().int().min(15).max(240)).optional(),
  notas:             z.string().max(500).optional(),
});

const turnoUpdateSchema = z.object({
  estado: z.enum(['pendiente','confirmado','completado','cancelado']).optional(),
  notas:  z.string().max(500).optional(),
  fecha:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hora:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

module.exports = {
  loginSchema,
  registerSchema,
  estudianteSchema,
  estudianteUpdateSchema,
  pacienteSchema,
  pacienteUpdateSchema,
  casoSchema,
  casoUpdateSchema,
  turnoSchema,
  turnoUpdateSchema,
};
