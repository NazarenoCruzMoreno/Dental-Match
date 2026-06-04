const express = require('express');
const { supabase } = require('../config/supabase');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

// GET /api/notifications — obtener notificaciones del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/notifications/read — marcar todas como leídas
router.put('/read', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', req.user.id)
      .eq('read', false);
    if (error) throw error;
    res.json({ message: 'Notificaciones marcadas como leídas' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
