const express = require('express');
const { supabase } = require('../config/supabase');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

const router = express.Router();

// POST /api/casos/:id/aplicar — estudiante aplica a un caso
router.post('/:id/aplicar', authMiddleware, roleMiddleware(['estudiante']), async (req, res) => {
  try {
    const { id: casoId } = req.params;
    const { id: userId }  = req.user;

    const { data: est } = await supabase
      .from('estudiantes').select('id').eq('user_id', userId).maybeSingle();
    if (!est) return res.status(400).json({ error: 'Completá tu perfil de estudiante primero' });

    // Verificar que el caso existe y está abierto
    const { data: caso } = await supabase
      .from('casos').select('id, estado').eq('id', casoId).maybeSingle();
    if (!caso || caso.estado !== 'abierto')
      return res.status(400).json({ error: 'Este caso ya no está disponible' });

    // Insertar aplicación (UNIQUE constraint evita duplicados)
    const { error } = await supabase
      .from('aplicaciones')
      .insert({ caso_id: casoId, estudiante_id: est.id, mensaje: req.body.mensaje || null });

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Ya aplicaste a este caso' });
      throw error;
    }

    res.status(201).json({ message: 'Aplicación enviada al paciente' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/casos/:id/aplicantes — paciente ve quién aplicó a su caso
router.get('/:id/aplicantes', authMiddleware, roleMiddleware(['paciente']), async (req, res) => {
  try {
    const { id: casoId } = req.params;
    const { id: userId }  = req.user;

    // Verificar que es el dueño del caso
    const { data: pac } = await supabase
      .from('pacientes').select('id').eq('user_id', userId).maybeSingle();
    const { data: caso } = await supabase
      .from('casos').select('id').eq('id', casoId).eq('paciente_id', pac?.id).maybeSingle();
    if (!caso) return res.status(403).json({ error: 'Caso no encontrado' });

    const { data, error } = await supabase
      .from('aplicaciones')
      .select(`
        id, estado, mensaje, created_at,
        estudiantes (
          id, nombre, universidad, anio_carrera,
          materias, disponibilidad, descripcion, rating,
          pacientes_atendidos, imagen_url
        )
      `)
      .eq('caso_id', casoId)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/casos/:id/match/:estudianteId — paciente acepta a un estudiante
router.post('/:id/match/:estudianteId', authMiddleware, roleMiddleware(['paciente']), async (req, res) => {
  try {
    const { id: casoId, estudianteId } = req.params;
    const { id: userId } = req.user;

    const { data: pac } = await supabase
      .from('pacientes').select('id').eq('user_id', userId).maybeSingle();
    if (!pac) return res.status(403).json({ error: 'Perfil no encontrado' });

    // Aceptar la aplicación elegida
    await supabase.from('aplicaciones').update({ estado: 'aceptado' })
      .eq('caso_id', casoId).eq('estudiante_id', estudianteId);

    // Rechazar las demás
    await supabase.from('aplicaciones').update({ estado: 'rechazado' })
      .eq('caso_id', casoId).neq('estudiante_id', estudianteId);

    // Asignar estudiante al caso y cambiar estado
    await supabase.from('casos')
      .update({ estudiante_id: estudianteId, estado: 'en_progreso', updated_at: new Date() })
      .eq('id', casoId);

    // Crear asignación en la tabla asignaciones
    await supabase.from('asignaciones').insert({
      estudiante_id: estudianteId,
      paciente_id:   pac.id,
      creador_id:    userId,
      estado:        'confirmado',
    });

    // Notificar al estudiante
    const { data: est } = await supabase
      .from('estudiantes').select('user_id').eq('id', estudianteId).maybeSingle();
    if (est) {
      await supabase.from('notifications').insert({
        user_id: est.user_id,
        type:    'match',
        title:   '🎉 ¡Nuevo match!',
        message: 'Un paciente aceptó tu aplicación. Revisá tus casos asignados.',
      });
    }

    res.json({ message: '¡Match realizado! El estudiante fue notificado.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/casos/:id/rechazar/:estudianteId — paciente rechaza
router.delete('/:id/rechazar/:estudianteId', authMiddleware, roleMiddleware(['paciente']), async (req, res) => {
  try {
    const { id: casoId, estudianteId } = req.params;
    await supabase.from('aplicaciones').update({ estado: 'rechazado' })
      .eq('caso_id', casoId).eq('estudiante_id', estudianteId);
    res.json({ message: 'Estudiante rechazado' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
