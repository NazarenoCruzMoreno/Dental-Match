const express = require('express');
const { supabase } = require('../config/supabase');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();
router.use(authMiddleware);

// ── Helper: verificar que el usuario participa del caso ────────────────────
async function userBelongsToCase(casoId, userId) {
  const { data: caso } = await supabase
    .from('casos')
    .select('id, paciente_id, estudiante_id, pacientes(user_id), estudiantes(user_id)')
    .eq('id', casoId)
    .maybeSingle();

  if (!caso) return false;
  const pacienteUserId   = caso.pacientes?.user_id;
  const estudianteUserId = caso.estudiantes?.user_id;
  return userId === pacienteUserId || userId === estudianteUserId;
}

// ── POST /api/messages/:casoId — Enviar mensaje ─────────────────────────────
router.post('/:casoId', async (req, res) => {
  try {
    const { casoId } = req.params;
    const { id: userId } = req.user;
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    if (content.length > 2000) return res.status(400).json({ error: 'Mensaje muy largo (máx 2000)' });

    const allowed = await userBelongsToCase(casoId, userId);
    if (!allowed) return res.status(403).json({ error: 'No tenés acceso a este chat' });

    const { data, error } = await supabase
      .from('messages')
      .insert({ caso_id: casoId, sender_id: userId, content: content.trim() })
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/messages/:casoId — Listar mensajes ─────────────────────────────
router.get('/:casoId', async (req, res) => {
  try {
    const { casoId } = req.params;
    const { id: userId } = req.user;

    const allowed = await userBelongsToCase(casoId, userId);
    if (!allowed) return res.status(403).json({ error: 'No tenés acceso a este chat' });

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('caso_id', casoId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Marcar como leídos los que NO son míos
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('caso_id', casoId)
      .neq('sender_id', userId)
      .eq('read', false);

    res.json(data ?? []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/messages — Listar mis chats activos ────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let query = supabase
      .from('casos')
      .select(`
        id, titulo, imagen_url, updated_at, estado,
        pacientes ( id, nombre, imagen_url, user_id ),
        estudiantes ( id, nombre, imagen_url, user_id )
      `)
      .not('estudiante_id', 'is', null)
      .in('estado', ['en_progreso', 'completado']);

    if (role === 'paciente') {
      const { data: pac } = await supabase
        .from('pacientes').select('id').eq('user_id', userId).maybeSingle();
      if (!pac) return res.json([]);
      query = query.eq('paciente_id', pac.id);
    } else if (role === 'estudiante') {
      const { data: est } = await supabase
        .from('estudiantes').select('id').eq('user_id', userId).maybeSingle();
      if (!est) return res.json([]);
      query = query.eq('estudiante_id', est.id);
    }

    const { data: casos } = await query.order('updated_at', { ascending: false });

    // Para cada caso, contar mensajes no leídos y traer último mensaje
    const chats = await Promise.all((casos ?? []).map(async (c) => {
      const { data: lastMsg } = await supabase
        .from('messages').select('content, created_at, sender_id')
        .eq('caso_id', c.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      const { count: unread } = await supabase
        .from('messages').select('*', { count: 'exact', head: true })
        .eq('caso_id', c.id).neq('sender_id', userId).eq('read', false);
      return { ...c, lastMessage: lastMsg, unread: unread ?? 0 };
    }));

    res.json(chats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
