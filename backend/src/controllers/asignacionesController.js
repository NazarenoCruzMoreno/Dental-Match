const { supabase } = require('../config/supabase');

const crearAsignacion = async (req, res) => {
  try {
    const { estudianteId, pacienteId } = req.body;
    const { email: creadorId } = req.user;

    const { data: paciente } = await supabase
      .from('pacientes')
      .select('id, estado')
      .eq('id', pacienteId)
      .single();

    if (!paciente || paciente.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Paciente no disponible' });
    }

    const { data: asignacion, error } = await supabase
      .from('asignaciones')
      .insert({
        estudiante_id: estudianteId,
        paciente_id: pacienteId,
        creador_id: creadorId,
        estado: 'pendiente',
        notas: '',
      })
      .select('id')
      .single();

    if (error) throw error;

    await supabase
      .from('pacientes')
      .update({ estado: 'asignado' })
      .eq('id', pacienteId);

    res.status(201).json({ message: 'Asignación creada', id: asignacion.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { crearAsignacion };
