const { supabase } = require('../config/supabase');
const { casoSchema, casoUpdateSchema } = require('../models/validaciones');

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
      // El estudiante ve casos abiertos (sin estudiante asignado)
      const { estado } = req.query;
      let query = supabase
        .from('casos')
        .select(`
          *,
          pacientes ( id, nombre, edad, problema_dental, imagen_url, telefono )
        `)
        .order('created_at', { ascending: false });

      if (estado) {
        query = query.eq('estado', estado);
      } else {
        // Por defecto muestra los abiertos
        query = query.eq('estado', 'abierto');
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.json(data);
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

module.exports = { crearCaso, listarCasos, obtenerCaso, actualizarCaso };
