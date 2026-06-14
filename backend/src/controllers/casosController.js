const { supabase } = require('../config/supabase');
const { casoSchema, casoUpdateSchema, finalizarCasoSchema } = require('../models/validaciones');

// ── BE-9: POST /api/casos ─────────────────────────────────────────────────────
// Solo pacientes pueden crear casos. Se asocia automáticamente al paciente logueado.
const crearCaso = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    if (role !== 'paciente') {
      return res.status(403).json({ error: 'Solo los pacientes pueden crear casos clínicos' });
    }

    // Obtener perfil del paciente
    const { data: paciente } = await supabase
      .from('pacientes')
      .select('id, nombre')
      .eq('user_id', userId)
      .maybeSingle();

    if (!paciente) {
      return res.status(400).json({ error: 'Completá tu perfil de paciente antes de crear un caso' });
    }

    const data = casoSchema.parse(req.body);
    const imagenUrl = req.imageUrl ?? null;

    const { data: caso, error } = await supabase
      .from('casos')
      .insert({
        paciente_id:      paciente.id,
        titulo:           data.titulo,
        descripcion:      data.descripcion,
        tipo_tratamiento: data.tipo_tratamiento || null,
        notas:            data.notas || null,
        imagen_url:       imagenUrl,
        es_analisis:      data.es_analisis ?? false,
        estado:           'abierto',
      })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Caso creado exitosamente', caso });
  } catch (error) {
    if (error.name === 'ZodError') {
      const msg = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(' | ');
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: error.message });
  }
};

// ── BE-10: GET /api/casos ─────────────────────────────────────────────────────
// Filtrado por rol:
//   - Paciente: ve solo sus propios casos
//   - Estudiante: ve todos los casos abiertos disponibles para tomar
const listarCasos = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    if (role === 'paciente') {
      // El paciente ve sus casos
      const { data: paciente } = await supabase
        .from('pacientes')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!paciente) return res.json([]);

      const { data, error } = await supabase
        .from('casos')
        .select(`
          *,
          estudiantes ( id, nombre, universidad, rating )
        `)
        .eq('paciente_id', paciente.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json(data);
    }

    if (role === 'estudiante') {
      // El estudiante ve casos abiertos
      const { estado } = req.query;

      // Obtener año del estudiante para priorizar casos de análisis
      const { data: est } = await supabase
        .from('estudiantes').select('id, anio_carrera').eq('user_id', userId).maybeSingle();
      const anioEstudiante = est?.anio_carrera ?? null;

      let query = supabase
        .from('casos')
        .select(`
          *,
          pacientes ( id, nombre, edad, problema_dental, imagen_url, telefono, rating, turnos_completados )
        `)
        .order('created_at', { ascending: false });

      query = estado ? query.eq('estado', estado) : query.eq('estado', 'abierto');

      const { data, error } = await query;
      if (error) throw error;

      // Reordenar: casos de análisis primero para estudiantes de años 1-3
      let ordenado = data ?? [];
      if (anioEstudiante && anioEstudiante <= 3) {
        ordenado = [...ordenado].sort((a, b) => {
          if (a.es_analisis && !b.es_analisis) return -1;
          if (!a.es_analisis && b.es_analisis) return 1;
          // Después por rating del paciente (mejor primero)
          return (b.pacientes?.rating ?? 0) - (a.pacientes?.rating ?? 0);
        });
      } else {
        // Para años avanzados: casos NO de análisis primero, después por rating
        ordenado = [...ordenado].sort((a, b) => {
          if (a.es_analisis && !b.es_analisis) return 1;
          if (!a.es_analisis && b.es_analisis) return -1;
          return (b.pacientes?.rating ?? 0) - (a.pacientes?.rating ?? 0);
        });
      }

      return res.json(ordenado);
    }

    res.status(403).json({ error: 'Rol no válido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/casos/:id ────────────────────────────────────────────────────────
// Detalle de un caso específico
const obtenerCaso = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('casos')
      .select(`
        *,
        pacientes ( id, nombre, edad, problema_dental, imagen_url ),
        estudiantes ( id, nombre, universidad, rating )
      `)
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Caso no encontrado' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── PUT /api/casos/:id ────────────────────────────────────────────────────────
// Actualizar un caso (el paciente puede editar su propio caso)
const actualizarCaso = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const { data: caso } = await supabase
      .from('casos')
      .select('paciente_id, pacientes!inner(user_id)')
      .eq('id', id)
      .single();

    if (!caso) return res.status(404).json({ error: 'Caso no encontrado' });

    // Solo el paciente dueño puede editar
    if (role === 'paciente' && caso.pacientes.user_id !== userId) {
      return res.status(403).json({ error: 'No tenés permiso para editar este caso' });
    }

    const data = casoUpdateSchema.parse(req.body);
    const { error } = await supabase
      .from('casos')
      .update({ ...data, updated_at: new Date() })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Caso actualizado' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(' | ') });
    }
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/casos/check-primer-caso ──────────────────────────────────────────
// Devuelve { esPrimerCaso: true/false } para que el paciente vea la sugerencia
// de pedir un análisis con un estudiante junior.
const checkPrimerCaso = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    if (role !== 'paciente') return res.json({ esPrimerCaso: false });

    const { data: pac } = await supabase
      .from('pacientes').select('id, turnos_completados').eq('user_id', userId).maybeSingle();

    if (!pac) return res.json({ esPrimerCaso: true });

    // Es "primer caso" si nunca completó un turno y nunca tuvo caso completado
    const { count: casosCompletados } = await supabase
      .from('casos').select('*', { count: 'exact', head: true })
      .eq('paciente_id', pac.id).eq('estado', 'completado');

    res.json({ esPrimerCaso: (pac.turnos_completados ?? 0) === 0 && (casosCompletados ?? 0) === 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── POST /api/casos/:id/finalizar ─────────────────────────────────────────────
// Estudiante marca el caso como completado, asigna diagnóstico y califica al paciente.
const finalizarCaso = async (req, res) => {
  try {
    const { id: casoId } = req.params;
    const { id: userId, role } = req.user;

    if (role !== 'estudiante') {
      return res.status(403).json({ error: 'Solo el estudiante asignado puede finalizar el caso' });
    }

    const data = finalizarCasoSchema.parse(req.body);

    // Validar que el estudiante es el asignado
    const { data: est } = await supabase
      .from('estudiantes').select('id').eq('user_id', userId).maybeSingle();
    if (!est) return res.status(400).json({ error: 'Perfil de estudiante no encontrado' });

    const { data: caso } = await supabase
      .from('casos')
      .select('id, estado, paciente_id, estudiante_id')
      .eq('id', casoId).maybeSingle();
    if (!caso) return res.status(404).json({ error: 'Caso no encontrado' });
    if (caso.estudiante_id !== est.id) return res.status(403).json({ error: 'No estás asignado a este caso' });
    if (caso.estado === 'completado') return res.status(400).json({ error: 'El caso ya está completado' });

    // 1) Actualizar caso
    const { error: errCaso } = await supabase
      .from('casos')
      .update({
        estado:               'completado',
        diagnostico:          data.diagnostico,
        tratamiento_asignado: data.tratamiento_asignado,
        updated_at:           new Date(),
      })
      .eq('id', casoId);
    if (errCaso) throw errCaso;

    // 2) Crear review estudiante→paciente
    await supabase.from('reviews').insert({
      estudiante_id: est.id,
      paciente_id:   caso.paciente_id,
      rating:        data.rating_paciente,
      comment:       data.comentario ?? null,
      direccion:     'estudiante_a_paciente',
    });

    // 3) Recalcular rating promedio del paciente
    const { data: allReviews } = await supabase
      .from('reviews').select('rating')
      .eq('paciente_id', caso.paciente_id)
      .eq('direccion', 'estudiante_a_paciente');

    if (allReviews?.length > 0) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await supabase.from('pacientes')
        .update({ rating: Math.round(avg * 10) / 10 })
        .eq('id', caso.paciente_id);
    }

    // 4) Incrementar contador del estudiante y del paciente
    await Promise.all([
      supabase.rpc('increment_estudiante_pacientes', { p_est_id: est.id }).then(() => {}).catch(() => {}),
      supabase.rpc('increment_paciente_turnos',     { p_pac_id: caso.paciente_id }).then(() => {}).catch(() => {}),
    ]);

    // Fallback si no existen las RPC
    const { data: estData } = await supabase.from('estudiantes').select('pacientes_atendidos').eq('id', est.id).maybeSingle();
    await supabase.from('estudiantes').update({ pacientes_atendidos: (estData?.pacientes_atendidos ?? 0) + 1 }).eq('id', est.id);

    const { data: pacData } = await supabase.from('pacientes').select('turnos_completados').eq('id', caso.paciente_id).maybeSingle();
    await supabase.from('pacientes').update({ turnos_completados: (pacData?.turnos_completados ?? 0) + 1 }).eq('id', caso.paciente_id);

    // 5) Notificar al paciente
    const { data: pac } = await supabase.from('pacientes').select('user_id').eq('id', caso.paciente_id).maybeSingle();
    if (pac?.user_id) {
      await supabase.from('notifications').insert({
        user_id: pac.user_id,
        type:    'caso_completado',
        title:   '✅ Tu tratamiento se completó',
        message: `Tu estudiante finalizó el caso "${caso.titulo ?? 'tu caso'}". Calificalo si querés.`,
      });
    }

    res.json({ message: 'Caso finalizado correctamente' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(' | ') });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = { crearCaso, listarCasos, obtenerCaso, actualizarCaso, checkPrimerCaso, finalizarCaso };
