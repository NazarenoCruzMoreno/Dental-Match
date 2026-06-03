const { supabase } = require('../config/supabase');
const { estudianteUpdateSchema, pacienteUpdateSchema } = require('../models/validaciones');

// ── BE-6: GET /api/profile ────────────────────────────────────────────────────
// Devuelve los datos del usuario logueado + su perfil según rol
const getProfile = async (req, res) => {
  try {
    const { id, email, role } = req.user;

    // Datos base del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Datos de perfil según rol
    let perfil = null;

    if (role === 'estudiante') {
      const { data } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('user_id', id)
        .single();
      perfil = data || null;
    } else if (role === 'paciente') {
      const { data } = await supabase
        .from('pacientes')
        .select('*')
        .eq('user_id', id)
        .single();
      perfil = data || null;
    }

    res.json({
      user,
      perfil,
      perfilCompleto: perfil !== null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── BE-7: PUT /api/profile ────────────────────────────────────────────────────
// Crea o actualiza el perfil del usuario logueado según su rol
const updateProfile = async (req, res) => {
  try {
    const { id, email, role } = req.user;
    const imagenUrl = req.imageUrl || undefined;

    if (role === 'estudiante') {
      const data = estudianteUpdateSchema.parse(req.body);

      const { data: existing } = await supabase
        .from('estudiantes')
        .select('id')
        .eq('user_id', id)
        .single();

      if (existing) {
        // Actualizar
        const { error } = await supabase
          .from('estudiantes')
          .update({ ...data, updated_at: new Date() })
          .eq('user_id', id);
        if (error) throw error;
      } else {
        // Crear por primera vez
        const { estudianteSchema } = require('../models/validaciones');
        const fullData = estudianteSchema.parse(req.body);
        const { error } = await supabase
          .from('estudiantes')
          .insert({ ...fullData, user_id: id, email });
        if (error) throw error;
      }

      return res.json({ message: 'Perfil de estudiante actualizado' });
    }

    if (role === 'paciente') {
      const data = pacienteUpdateSchema.parse(req.body);
      const payload = {
        ...data,
        ...(data.problemaDental && { problema_dental: data.problemaDental }),
        updated_at: new Date(),
      };
      delete payload.problemaDental;

      const { data: existing } = await supabase
        .from('pacientes')
        .select('id')
        .eq('user_id', id)
        .single();

      if (existing) {
        if (imagenUrl) payload.imagen_url = imagenUrl;
        const { error } = await supabase
          .from('pacientes')
          .update(payload)
          .eq('user_id', id);
        if (error) throw error;
      } else {
        const { pacienteSchema } = require('../models/validaciones');
        const fullData = pacienteSchema.parse(req.body);
        const { error } = await supabase
          .from('pacientes')
          .insert({
            user_id: id,
            email,
            nombre: fullData.nombre,
            edad: fullData.edad,
            telefono: fullData.telefono || null,
            problema_dental: fullData.problemaDental,
            imagen_url: imagenUrl || null,
          });
        if (error) throw error;
      }

      return res.json({ message: 'Perfil de paciente actualizado' });
    }

    res.status(400).json({ error: 'Rol no válido para esta operación' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getProfile, updateProfile };
