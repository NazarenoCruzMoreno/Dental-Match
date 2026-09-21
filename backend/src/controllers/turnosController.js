const { supabase } = require('../config/supabase');
const { turnoSchema, turnoUpdateSchema } = require('../models/validaciones');
const { notificar } = require('../utils/notificar');

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
    if (await estudianteOcupado(caso.estudiante_id, data.fecha, data.hora, data.duracion_minutos ?? 60)) {
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
      await notificar(est.user_id, {
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
      // Paciente: cancela turnos propios, y responde (acepta/rechaza) las
      // propuestas del estudiante — TurnosPage le ofrece justo esos botones.
      const respondePropuesta =
        turno.estado === 'propuesto' && ['confirmado', 'rechazado'].includes(data.estado);
      if (data.estado && data.estado !== 'cancelado' && !respondePropuesta) {
        return res.status(403).json({ error: 'Los pacientes solo pueden cancelar turnos o responder propuestas' });
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

    const ocupados = await turnosOcupados(estudiante_id, fecha);

    // Generar slots de 9:00 a 18:00 cada 60 minutos
    const slots = [];
    for (let h = 9; h < 18; h++) {
      const horaStr = `${String(h).padStart(2, '0')}:00`;
      const libre = !ocupados.some(t => seSolapan(h * 60, 60, aMinutos(t.hora), t.duracion_minutos));
      slots.push({ hora: horaStr, disponible: libre });
    }

    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
// Ojo con los formatos: Postgres devuelve un TIME como "10:00:00", pero el
// cliente manda "10:00" — por eso se compara en minutos, nunca como strings.
const aMinutos = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

const seSolapan = (inicioA, durA, inicioB, durB) =>
  inicioA < inicioB + durB && inicioB < inicioA + durA;

// Turnos que ocupan la agenda del estudiante ese día. Los cancelados y los
// rechazados no cuentan: una propuesta rechazada tiene que liberar el horario.
async function turnosOcupados(estudianteId, fecha) {
  const { data } = await supabase
    .from('turnos')
    .select('hora, duracion_minutos')
    .eq('estudiante_id', estudianteId)
    .eq('fecha', fecha)
    .not('estado', 'in', '(cancelado,rechazado)');
  return data ?? [];
}

async function estudianteOcupado(estudianteId, fecha, hora, duracionMin) {
  const ocupados = await turnosOcupados(estudianteId, fecha);
  return ocupados.some(t => seSolapan(aMinutos(hora), duracionMin, aMinutos(t.hora), t.duracion_minutos));
}

async function notificarCambioEstado(turnoId, turno, nuevoEstado, userId, role) {
  try {
    const mensajes = {
      confirmado: role === 'paciente'
        ? { title: '✅ Turno aceptado',    msg: 'Tu paciente aceptó el turno que propusiste.' }
        : { title: '✅ Turno confirmado',  msg: 'Tu turno fue confirmado por el estudiante.' },
      rechazado:  { title: '❌ Propuesta rechazada', msg: 'Tu paciente rechazó el turno que propusiste. Podés proponer otro horario.' },
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
      await notificar(targetUserId, {
        type:    'turno',
        title:   notif.title,
        message: notif.msg,
      });
    }
  } catch {}
}

// ── POST /api/turnos/proponer — Estudiante propone turno al paciente ────────
const proponerTurno = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    if (role !== 'estudiante') {
      return res.status(403).json({ error: 'Solo los estudiantes pueden proponer turnos' });
    }

    const data = turnoSchema.parse(req.body);

    // Verificar que el estudiante esté asignado al caso
    const { data: est } = await supabase
      .from('estudiantes').select('id, nombre').eq('user_id', userId).maybeSingle();
    if (!est) return res.status(400).json({ error: 'Perfil de estudiante no encontrado' });

    const { data: caso } = await supabase
      .from('casos')
      .select('id, estado, paciente_id, titulo')
      .eq('id', data.caso_id)
      .eq('estudiante_id', est.id)
      .maybeSingle();
    if (!caso) return res.status(404).json({ error: 'Caso no encontrado o no estás asignado' });
    if (caso.estado === 'completado' || caso.estado === 'cancelado') {
      return res.status(400).json({ error: `No podés proponer turnos en un caso ${caso.estado}` });
    }

    // Antes de esto no se chequeaba nada: se podía proponer (y aceptar) dos
    // turnos en el mismo horario.
    if (await estudianteOcupado(est.id, data.fecha, data.hora, data.duracion_minutos ?? 60)) {
      return res.status(409).json({ error: 'Ya tenés un turno en ese horario. Elegí otro.' });
    }

    // Crear turno con estado propuesto
    const { data: turno, error } = await supabase
      .from('turnos')
      .insert({
        caso_id:          caso.id,
        estudiante_id:    est.id,
        paciente_id:      caso.paciente_id,
        fecha:            data.fecha,
        hora:             data.hora,
        duracion_minutos: data.duracion_minutos ?? 60,
        notas:            data.notas ?? null,
        estado:           'propuesto',
        propuesto_por:    'estudiante',
      })
      .select('*')
      .single();

    if (error) throw error;

    // Notificar al paciente
    const { data: pac } = await supabase
      .from('pacientes').select('user_id').eq('id', caso.paciente_id).maybeSingle();
    if (pac) {
      const fechaStr = new Date(data.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long' });
      await notificar(pac.user_id, {
        type:    'turno_propuesto',
        title:   '📅 Tu estudiante propuso un turno',
        message: `${est.nombre} propuso un turno para el ${fechaStr} a las ${data.hora}hs. Aceptalo o pedile otro horario desde "Mis turnos".`,
      });
    }

    res.status(201).json({ message: 'Propuesta enviada al paciente', turno });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(' | ') });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = { reservarTurno, listarTurnos, actualizarTurno, obtenerDisponibilidad, proponerTurno };
