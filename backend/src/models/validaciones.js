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
  anio_carrera: z.number().int().min(1).max(6).optional(),
  materias: z.array(z.string()).min(1, 'Agregá al menos una materia'),
  disponibilidad: z.array(z.string()).min(1, 'Indicá tu disponibilidad'),
  descripcion: z.string().min(10, 'Descripción muy corta'),
});

const estudianteUpdateSchema = estudianteSchema.partial();

// ── Perfil Paciente ───────────────────────────────────────────────────────────
const pacienteSchema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto'),
  edad: z.number().int().min(1).max(120, 'Edad inválida'),
  telefono: z.string().min(7, 'Teléfono inválido').optional(),
  problemaDental: z.string().min(10, 'Describí el problema con más detalle'),
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
