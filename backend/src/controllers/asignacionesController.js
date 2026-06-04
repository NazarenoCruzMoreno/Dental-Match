const { supabase } = require('../config/supabase');

// ── (Legacy) Crear asignación directa ────────────────────────────────────────
const crearAsignacion = async (req, res) => {
  try {
    const { estudianteId, pacienteId } = req.body;
    const { email: creadorId } = req.user;

    const { data: paciente } = await supabase
      .from('pacientes').select('id, estado').eq('id', pacienteId).single();

    if (!paciente || paciente.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Paciente no disponible' });
    }

    const { data: asignacion, error } = await supabase
      .from('asignaciones')
      .insert({ estudiante_id: estudianteId, paciente_id: pacienteId, creador_id: creadorId, estado: 'pendiente', notas: '' })
      .select('id').single();

    if (error) throw error;
    await supabase.from('pacientes').update({ estado: 'asignado' }).eq('id', pacienteId);

    res.status(201).json({ message: 'Asignación creada', id: asignacion.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── BE-12: Asignación manual (por caso) ──────────────────────────────────────
// Permite asignar un estudiante a un caso directamente (sin swipe).
// Solo el paciente dueño del caso puede hacerlo.
const asignacionManual = async (req, res) => {
  try {
    const { caso_id, estudiante_id } = req.body;
    const { id: userId, role } = req.user;

    if (!caso_id || !estudiante_id) {
      return res.status(400).json({ error: 'caso_id y estudiante_id son requeridos' });
    }

    // Verificar que el caso pertenece al paciente logueado
    const { data: paciente } = await supabase
      .from('pacientes').select('id').eq('user_id', userId).maybeSingle();

    if (!paciente) return res.status(403).json({ error: 'Perfil de paciente no encontrado' });

    const { data: caso } = await supabase
      .from('casos').select('id, estado').eq('id', caso_id).eq('paciente_id', paciente.id).maybeSingle();

    if (!caso) return res.status(404).json({ error: 'Caso no encontrado o no te pertenece' });
    if (caso.estado === 'completado' || caso.estado === 'cancelado') {
      return res.status(400).json({ error: `El caso está ${caso.estado} y no puede modificarse` });
    }

    // Verificar que el estudiante existe
    const { data: est } = await supabase
      .from('estudiantes').select('id, user_id, nombre').eq('id', estudiante_id).maybeSingle();
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado' });

    // Asignar
    const { error } = await supabase
      .from('casos')
      .update({ estudiante_id: est.id, estado: 'en_progreso', updated_at: new Date() })
      .eq('id', caso_id);
    if (error) throw error;

    // Crear asignación
    await supabase.from('asignaciones').insert({
      estudiante_id: est.id,
      paciente_id:   paciente.id,
      creador_id:    userId,
      estado:        'confirmado',
    });

    // Notificar al estudiante
    await supabase.from('notifications').insert({
      user_id: est.user_id,
      type:    'asignacion',
      title:   '📋 Nuevo caso asignado',
      message: `Un paciente te asignó directamente a su caso. Revisá tus casos.`,
    });

    res.json({ message: `Estudiante ${est.nombre} asignado correctamente al caso` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/asignaciones/mis-asignaciones ────────────────────────────────────
// Estudiante ve sus casos asignados
const misAsignaciones = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    if (role !== 'estudiante') return res.status(403).json({ error: 'Solo estudiantes' });

    const { data: est } = await supabase
      .from('estudiantes').select('id').eq('user_id', userId).maybeSingle();
    if (!est) return res.json([]);

    const { data, error } = await supabase
      .from('casos')
      .select(`
        id, titulo, descripcion, tipo_tratamiento, estado, imagen_url, created_at, updated_at,
        pacientes ( id, nombre, edad, problema_dental, telefono, imagen_url )
      `)
      .eq('estudiante_id', est.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { crearAsignacion, asignacionManual, misAsignaciones };
