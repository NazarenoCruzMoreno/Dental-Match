const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const registerSchema = loginSchema.extend({
  role: z.enum(['estudiante', 'paciente'], { errorMap: () => ({ message: 'Rol debe ser estudiante o paciente' }) }),
});

const estudianteSchema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto'),
  universidad: z.string().min(2),
  materias: z.array(z.string()).min(1),
  disponibilidad: z.array(z.string()).min(1),
  descripcion: z.string().min(10),
});

const pacienteSchema = z.object({
  nombre: z.string().min(2),
  edad: z.number().min(1).max(120),
  problemaDental: z.string().min(10),
});

module.exports = { loginSchema, registerSchema, estudianteSchema, pacienteSchema };
