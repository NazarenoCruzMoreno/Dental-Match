const { supabase } = require('../config/supabase');
const { pacienteSchema } = require('../models/validaciones');

const crearPerfil = async (req, res) => {
  try {
    const data = pacienteSchema.parse(req.body);
    const { id: userId, email, role } = req.user;
    const imagenUrl = req.imageUrl || null;

    if (role !== 'paciente') {
      return res.status(403).json({ error: 'Solo pacientes pueden crear este perfil' });
    }

    const { error } = await supabase
      .from('pacientes')
      .insert({
        user_id: userId,
        email,
        nombre: data.nombre,
        edad: data.edad,
        problema_dental: data.problemaDental,
        imagen_url: imagenUrl,
        estado: 'pendiente',
      });

    if (error) throw error;

    res.status(201).json({ message: 'Perfil creado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { crearPerfil };
