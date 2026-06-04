const express = require('express');
const { supabase } = require('../config/supabase');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const { z } = require('zod');

const router = express.Router();

const reviewSchema = z.object({
  estudiante_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// POST /api/reviews — paciente deja review a estudiante
router.post('/', authMiddleware, roleMiddleware(['paciente']), async (req, res) => {
  try {
    const { estudiante_id, rating, comment } = reviewSchema.parse(req.body);

    // Obtener el perfil del paciente
    const { data: paciente } = await supabase
      .from('pacientes').select('id').eq('user_id', req.user.id).maybeSingle();
    if (!paciente) return res.status(400).json({ error: 'Perfil de paciente no encontrado' });

    // Evitar review duplicada
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('estudiante_id', estudiante_id)
      .eq('paciente_id', paciente.id)
      .maybeSingle();
    if (existing) return res.status(400).json({ error: 'Ya dejaste una review para este estudiante' });

    const { error } = await supabase
      .from('reviews')
      .insert({ estudiante_id, paciente_id: paciente.id, rating, comment: comment || null });
    if (error) throw error;

    // Recalcular rating promedio del estudiante
    const { data: allReviews } = await supabase
      .from('reviews').select('rating').eq('estudiante_id', estudiante_id);
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await supabase.from('estudiantes').update({ rating: Math.round(avg * 10) / 10 }).eq('id', estudiante_id);

    res.status(201).json({ message: 'Review enviada' });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Datos inválidos' });
    res.status(500).json({ error: e.message });
  }
});

// GET /api/reviews/:estudianteId — reviews de un estudiante
router.get('/:estudianteId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, pacientes(nombre)')
      .eq('estudiante_id', req.params.estudianteId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
