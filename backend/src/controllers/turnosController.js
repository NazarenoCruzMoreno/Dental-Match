const { supabase } = require('../config/supabase');
const { turnoSchema, turnoUpdateSchema } = require('../models/validaciones');

// ── BE-14: POST /api/turnos — Reservar un turno ───────────────────────────────
// Solo el paciente dueño del caso puede crear el turno
const reservarTurno = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    if (role !== 'paciente') {
      return res.status(403).json({ error: 'Solo los pacientes pueden reservar turnos' });
    }

    const data = turnoSchema.parse(req.body);

    // Verificar que el caso pertenece al paciente y tiene estudiante asignado
    const { data: pac } = await supabase
      .from('pacientes').select('id').eq('user_id', userId).maybeSingle();
    if (!pac) return res.status(400).json({ error: 'Perfil de paciente no encontrado' });

    const { data: caso } = await supabase
      .from('casos')
      .select('id, estado, estudiante_id, titulo')
      .eq('id', data.caso_id)
      .eq('paciente_id', pac.id)
      .maybeSingle();

    if (!caso) return res.status(404).json({ error: 'Caso no encontrado o no te pertenece' });
    if (!caso.estudiante_id) return res.status(400).json({ error: 'El caso no tiene un estudiante asignado aún. Esperá el match.' });
    if (caso.estado === 'completado' || caso.estado === 'cancelado') {
      return res.status(400).json({ error: `No podés agendar turnos en un caso ${caso.estado}` });
    }

    // Validar disponibilidad: el estudiante no debe tener otro turno en ese horario
    const horaFin = calcularHoraFin(data.hora, data.duracion_minutos ?? 60);
    const { data: conflicto } = await supabase
      .from('turnos')
      .select('id, hora')
      .eq('estudiante_id', caso.estudiante_id)
      .eq('fecha', data.fecha)
      .neq('estado', 'cancelado')
      .lte('hora', data.hora)
      .gt('hora', calcularHoraFin(data.hora, -(data.duracion_minutos ?? 60)));

    if (conflicto && conflicto.length > 0) {
      return res.status(409).json({ error: 'El estudiante ya tiene un turno en ese horario. Elegí otro.' });
    }

    // Crear turno
    const { data: turno, error } = await supabase
      .from('turnos')
      .insert({
        caso_id:          caso.id,
        estudiante_id:    caso.estudiante_id,
        paciente_id:      pac.id,
        fecha:            data.fecha,
        hora:             data.hora,
        duracion_minutos: data.duracion_minutos ?? 60,
        notas:            data.notas ?? null,
        estado:           'pendiente',
      })
      .select('*')
      .single();

    if (error) throw error;

    // Notificar al estudiante
    const { data: est } = await supabase
      .from('estudiantes').select('user_id, nombre').eq('id', caso.estudiante_id).maybeSingle();
    if (est) {
      const fechaStr = new Date(data.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long' });
      await supabase.from('notifications').insert({
        user_id: est.user_id,
        type:    'turno',
        title:   '📅 Nuevo turno agendado',
        message: `Tu paciente agendó un turno para el ${fechaStr} a las ${data.hora} hs — "${caso.titulo}". Confirmalo desde tus turnos.`,
      });
    }

    res.status(201).json({ message: 'Turno reservado. El estudiante debe confirmarlo.', turno });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(' | ') });
    }
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/turnos — Listar turnos del usuario ───────────────────────────────
const listarTurnos = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { estado, desde, hasta } = req.query;

    let query = supabase
      .from('turnos')
      .select(`
        *,
        casos ( id, titulo, tipo_tratamiento ),
        estudiantes ( id, nombre, universidad ),
        pacientes ( id, nombre, edad, telefono )
      `)
      .order('fecha', { ascending: true })
      .order('hora',  { ascending: true });

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
    } else {
      return res.status(403).json({ error: 'Rol no válido' });
    }

    if (estado) query = query.eq('estado', estado);
    if (desde)  query = query.gte('fecha', desde);
    if (hasta)  query = query.lte('fecha', hasta);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── PUT /api/turnos/:id — Confirmar / cancelar / completar turno ──────────────
const actualizarTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const data = turnoUpdateSchema.parse(req.body);

    // Verificar que el turno le pertenece al usuario
    const { data: turno } = await supabase
      .from('turnos').select('id, estado, estudiante_id, paciente_id').eq('id', id).maybeSingle();
    if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });

    // Estudiante puede confirmar/completar/cancelar
    // Paciente puede cancelar
    if (role === 'estudiante') {
      const { data: est } = await supabase
        .from('estudiantes').select('id').eq('user_id', userId).maybeSingle();
      if (!est || est.id !== turno.estudiante_id) {
        return res.status(403).json({ error: 'No tenés permiso sobre este turno' });
      }
    } else if (role === 'paciente') {
      const { data: pac } = await supabase
        .from('pacientes').select('id').eq('user_id', userId).maybeSingle();
      if (!pac || pac.id !== turno.paciente_id) {
        return res.status(403).json({ error: 'No tenés permiso sobre este turno' });
      }
      // Paciente solo puede cancelar
      if (data.estado && data.estado !== 'cancelado') {
        return res.status(403).json({ error: 'Los pacientes solo pueden cancelar turnos' });
      }
    }

    const { error } = await supabase
      .from('turnos')
      .update({ ...data, updated_at: new Date() })
      .eq('id', id);

    if (error) throw error;

    // Notificar al otro participante si cambió el estado
    if (data.estado) {
      await notificarCambioEstado(id, turno, data.estado, userId, role);
    }

    res.json({ message: 'Turno actualizado' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(' | ') });
    }
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/turnos/disponibilidad — Slots libres de un estudiante ────────────
const obtenerDisponibilidad = async (req, res) => {
  try {
    const { estudiante_id, fecha } = req.query;
    if (!estudiante_id || !fecha) {
      return res.status(400).json({ error: 'estudiante_id y fecha son requeridos' });
    }

    // Turnos ocupados ese día
    const { data: ocupados } = await supabase
      .from('turnos')
      .select('hora, duracion_minutos')
      .eq('estudiante_id', estudiante_id)
      .eq('fecha', fecha)
      .neq('estado', 'cancelado');

    // Generar slots de 9:00 a 18:00 cada 60 minutos
    const slots = [];
    for (let h = 9; h < 18; h++) {
      const horaStr = `${String(h).padStart(2, '0')}:00`;
      const libre = !(ocupados ?? []).some(t => t.hora === horaStr);
      slots.push({ hora: horaStr, disponible: libre });
    }

    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcularHoraFin(hora, minutos) {
  const [h, m] = hora.split(':').map(Number);
  const total  = h * 60 + m + minutos;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

async function notificarCambioEstado(turnoId, turno, nuevoEstado, userId, role) {
  try {
    const mensajes = {
      confirmado: { title: '✅ Turno confirmado',  msg: 'Tu turno fue confirmado por el estudiante.' },
      cancelado:  { title: '❌ Turno cancelado',   msg: 'Un turno fue cancelado.' },
      completado: { title: '🎉 Turno completado',  msg: 'El turno fue marcado como completado.' },
    };
    const notif = mensajes[nuevoEstado];
    if (!notif) return;

    // Notificar al otro participante
    let targetUserId;
    if (role === 'estudiante') {
      const { data: pac } = await supabase
        .from('pacientes').select('user_id').eq('id', turno.paciente_id).maybeSingle();
      targetUserId = pac?.user_id;
    } else {
      const { data: est } = await supabase
        .from('estudiantes').select('user_id').eq('id', turno.estudiante_id).maybeSingle();
      targetUserId = est?.user_id;
    }

    if (targetUserId) {
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        type:    'turno',
        title:   notif.title,
        message: notif.msg,
      });
    }
  } catch {}
}

module.exports = { reservarTurno, listarTurnos, actualizarTurno, obtenerDisponibilidad };
