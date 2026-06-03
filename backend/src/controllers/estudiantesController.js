const { supabase } = require('../config/supabase');
const { estudianteSchema } = require('../models/validaciones');

const crearPerfil = async (req, res) => {
  try {
    const data = estudianteSchema.parse(req.body);
    const { id: userId, email, role } = req.user;

    if (role !== 'estudiante') {
      return res.status(403).json({ error: 'Solo estudiantes pueden crear este perfil' });
    }

    const { error } = await supabase
      .from('estudiantes')
      .insert({
        user_id: userId,
        email,
        nombre: data.nombre,
        universidad: data.universidad,
        materias: data.materias,
        disponibilidad: data.disponibilidad,
        descripcion: data.descripcion,
        rating: 0,
        pacientes_atendidos: 0,
      });

    if (error) throw error;

    res.status(201).json({ message: 'Perfil creado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const obtenerEstudiantes = async (req, res) => {
  try {
    const { data: estudiantes, error } = await supabase
      .from('estudiantes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(estudiantes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { crearPerfil, obtenerEstudiantes };
