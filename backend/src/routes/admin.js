const express = require('express');
const { supabase } = require('../config/supabase');
const { authMiddleware, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// ── GET /api/admin/stats — Conteos básicos para el backoffice ────────────────
// Protegido: requiere JWT válido (authMiddleware) Y role === 'admin' (isAdmin).
// No hay forma de auto-registrarse como admin (registerSchema solo permite
// estudiante/paciente) — el rol se setea a mano en Supabase.
router.get('/stats', authMiddleware, isAdmin, async (req, res) => {
  try {
    const [estudiantes, pacientes, casos] = await Promise.all([
      supabase.from('estudiantes').select('*', { count: 'exact', head: true }),
      supabase.from('pacientes').select('*', { count: 'exact', head: true }),
      supabase.from('casos').select('*', { count: 'exact', head: true }),
    ]);

    const err = estudiantes.error || pacientes.error || casos.error;
    if (err) throw err;

    res.json({
      estudiantes: estudiantes.count ?? 0,
      pacientes:   pacientes.count ?? 0,
      casos:       casos.count ?? 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
