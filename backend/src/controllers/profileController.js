const { supabase } = require('../config/supabase');
const {
  estudianteSchema, estudianteUpdateSchema,
  pacienteSchema,   pacienteUpdateSchema,
} = require('../models/validaciones');

// ── Helpers ───────────────────────────────────────────────────────────────────
// Convierte los campos del schema Zod al formato de columnas de Supabase (paciente)
const mapPaciente = (d, imagenUrl) => ({
  nombre:         d.nombre,
  edad:           d.edad,
  telefono:       d.telefono ?? null,
  problema_dental: d.problemaDental,
  ...(imagenUrl ? { imagen_url: imagenUrl } : {}),
});

// Convierte los campos del schema Zod al formato de columnas de Supabase (estudiante)
const mapEstudiante = (d) => ({
  nombre:          d.nombre,
  universidad:     d.universidad,
  anio_carrera:    d.anio_carrera ?? null,
  materias:        d.materias,
  disponibilidad:  d.disponibilidad,
  descripcion:     d.descripcion,
});

// ── BE-6: GET /api/profile ────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const { id, role } = req.user;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let perfil = null;

    if (role === 'estudiante') {
      const { data } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();
      perfil = data ?? null;
    } else if (role === 'paciente') {
      const { data } = await supabase
        .from('pacientes')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();
      perfil = data ?? null;
    }

    // Perfil completo = existe Y tiene los campos mínimos obligatorios
    let perfilCompleto = false;
    if (perfil) {
      perfilCompleto = role === 'estudiante'
        ? !!(perfil.nombre && perfil.universidad && perfil.descripcion && perfil.materias?.length > 0)
        : !!(perfil.nombre && perfil.edad && perfil.problema_dental);
    }

    res.json({ user, perfil, perfilCompleto });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── BE-7: PUT /api/profile ────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { id, email, role } = req.user;
    const imagenUrl = req.imageUrl ?? null;

    // ── Estudiante ────────────────────────────────────────────────────────────
    if (role === 'estudiante') {
      const { data: existing } = await supabase
        .from('estudiantes')
        .select('id')
        .eq('user_id', id)
        .maybeSingle();

      if (existing) {
        const data = estudianteUpdateSchema.parse(req.body);
        const payload = { ...mapEstudiante({ ...existing, ...data }), updated_at: new Date() };
        // Solo incluir campos que vienen en el body
        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

        const { error } = await supabase
          .from('estudiantes').update(payload).eq('user_id', id);
        if (error) throw error;
      } else {
        const data = estudianteSchema.parse(req.body);
        const { error } = await supabase
          .from('estudiantes')
          .insert({ ...mapEstudiante(data), user_id: id, email });
        if (error) throw error;
      }

      return res.json({ message: 'Perfil de estudiante guardado' });
    }

    // ── Paciente ──────────────────────────────────────────────────────────────
    if (role === 'paciente') {
      const { data: existing } = await supabase
        .from('pacientes')
        .select('id')
        .eq('user_id', id)
        .maybeSingle();

      if (existing) {
        const data = pacienteUpdateSchema.parse(req.body);
        const payload = { ...mapPaciente(data, imagenUrl), updated_at: new Date() };
        // Eliminar campos undefined para no pisar datos existentes
        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

        const { error } = await supabase
          .from('pacientes').update(payload).eq('user_id', id);
        if (error) throw error;
      } else {
        const data = pacienteSchema.parse(req.body);
        const { error } = await supabase
          .from('pacientes')
          .insert({ ...mapPaciente(data, imagenUrl), user_id: id, email });
        if (error) throw error;
      }

      return res.json({ message: 'Perfil de paciente guardado' });
    }

    res.status(400).json({ error: 'Rol no válido' });

  } catch (error) {
    if (error.name === 'ZodError') {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(' | ');
      return res.status(400).json({ error: messages });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getProfile, updateProfile };
