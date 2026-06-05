const express = require('express');
const { supabase } = require('../config/supabase');
const { verificarToken } = require('../config/jwt');

const router = express.Router();

// ── GET /api/stats — Métricas públicas de la plataforma ──────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [{ count: estudiantes }, { count: pacientes }, { count: matches }] = await Promise.all([
      supabase.from('estudiantes').select('*', { count: 'exact', head: true }),
      supabase.from('pacientes')  .select('*', { count: 'exact', head: true }),
      supabase.from('asignaciones').select('*', { count: 'exact', head: true }),
    ]);
    res.json({
      estudiantes: estudiantes ?? 0,
      pacientes:   pacientes   ?? 0,
      matches:     matches     ?? 0,
    });
  } catch (e) {
    console.error('[stats] error:', e.message);
    res.json({ estudiantes: 0, pacientes: 0, matches: 0 });
  }
});

// ── GET /api/activity — Actividad mensual del usuario (últimos 6 meses) ──────
router.get('/activity', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);

    const { id, role } = verificarToken(token);

    // Identificar el perfil del usuario según su rol
    let query = supabase.from('asignaciones').select('fecha_asignacion');

    if (role === 'estudiante') {
      const { data: est } = await supabase
        .from('estudiantes').select('id').eq('user_id', id).maybeSingle();
      if (!est) return res.json([]);
      query = query.eq('estudiante_id', est.id);
    } else if (role === 'paciente') {
      const { data: pac } = await supabase
        .from('pacientes').select('id').eq('user_id', id).maybeSingle();
      if (!pac) return res.json([]);
      query = query.eq('paciente_id', pac.id);
    } else {
      return res.json([]);
    }

    // Filtrar por últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const { data } = await query.gte('fecha_asignacion', sixMonthsAgo.toISOString());

    // Agrupar por mes (YYYY-MM)
    const counts = {};
    (data ?? []).forEach(({ fecha_asignacion }) => {
      const d   = new Date(fecha_asignacion);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    res.json(Object.entries(counts).map(([month, count]) => ({ month, count })));
  } catch (e) {
    console.error('[activity] error:', e.message);
    res.json([]);
  }
});

// ── GET /api/health — Healthcheck ────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
