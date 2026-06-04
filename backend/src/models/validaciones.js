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
  nombre: z.string().min(2, 'Nombre muy corto'),
  universidad: z.string().min(2, 'Universidad requerida'),
  anio_carrera: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().min(1).max(6).optional()
  ),
  materias: z.array(z.string()).min(1, 'Agregá al menos una materia'),
  disponibilidad: z.array(z.string()).min(1, 'Indicá tu disponibilidad'),
  descripcion: z.string().min(10, 'Descripción muy corta'),
});

const estudianteUpdateSchema = estudianteSchema.partial();

// ── Perfil Paciente ───────────────────────────────────────────────────────────
const pacienteSchema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto'),
  edad: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ required_error: 'La edad es requerida' }).int().min(1).max(120, 'Edad inválida')
  ),
  // Teléfono: acepta string con mínimo 7 chars O string vacío (campo omitido)
  telefono: z.union([
    z.string().min(7, 'Teléfono inválido'),
    z.literal(''),
  ]).optional().transform((v) => (v === '' ? undefined : v)),
  problemaDental: z.string().min(10, 'Describí el problema con más detalle (mínimo 10 caracteres)'),
});

const pacienteUpdateSchema = pacienteSchema.partial();

module.exports = {
  loginSchema,
  registerSchema,
  estudianteSchema,
  estudianteUpdateSchema,
  pacienteSchema,
  pacienteUpdateSchema,
};
