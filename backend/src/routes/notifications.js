const express = require('express');
const { z } = require('zod');
const { supabase } = require('../config/supabase');
const { authMiddleware } = require('../middlewares/auth');
const { guardarSuscripcion, eliminarSuscripcion, esEndpointPermitido } = require('../utils/webPush');

const router = express.Router();

// Forma de PushSubscription.toJSON() del navegador
const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048)
    .refine(esEndpointPermitido, 'Endpoint de push no permitido'),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth:   z.string().min(1).max(100),
  }),
});

// POST /api/notifications/subscribe — registrar este dispositivo para push
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const subscription = subscriptionSchema.parse(req.body);
    await guardarSuscripcion(req.user.id, subscription);
    res.status(201).json({ message: 'Notificaciones push activadas' });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Suscripción inválida: ' + e.errors.map((x) => x.message).join(' | ') });
    }
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/notifications/subscribe — desactivar push en este dispositivo.
// Se llama al cerrar sesión: si la suscripción siguiera atada al usuario, en una
// computadora compartida seguirían llegando SUS avisos a quien use el equipo.
router.delete('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { endpoint } = z.object({ endpoint: z.string().url().max(2048) }).parse(req.body);
    await eliminarSuscripcion(req.user.id, endpoint);
    res.json({ message: 'Notificaciones push desactivadas' });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'endpoint requerido' });
    res.status(500).json({ error: e.message });
  }
});

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
