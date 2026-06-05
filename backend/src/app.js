const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');

const userRoutes       = require('./routes/users');
const profileRoutes    = require('./routes/profile');
const estudianteRoutes = require('./routes/estudiantes');
const pacienteRoutes   = require('./routes/pacientes');
const asignacionRoutes = require('./routes/asignaciones');
const notifRoutes      = require('./routes/notifications');
const reviewRoutes     = require('./routes/reviews');
const casosRoutes      = require('./routes/casos');
const aplicacionRoutes = require('./routes/aplicaciones');
const turnosRoutes     = require('./routes/turnos');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth',          userRoutes);
app.use('/api/profile',       profileRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/casos',         casosRoutes);
app.use('/api/casos',         aplicacionRoutes);
app.use('/api/turnos',        turnosRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/asignaciones', asignacionRoutes);

// Actividad del usuario — últimos 6 meses de asignaciones
app.get('/api/activity', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);
    const { verificarToken } = require('./config/jwt');
    const { id, role } = verificarToken(token);
    const { supabase } = require('./config/supabase');

    let query = supabase.from('asignaciones').select('fecha_asignacion');
    if (role === 'estudiante') {
      const { data: est } = await supabase.from('estudiantes').select('id').eq('user_id', id).maybeSingle();
      if (est) query = query.eq('estudiante_id', est.id);
      else return res.json([]);
    } else {
      const { data: pac } = await supabase.from('pacientes').select('id').eq('user_id', id).maybeSingle();
      if (pac) query = query.eq('paciente_id', pac.id);
      else return res.json([]);
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const { data } = await query.gte('fecha_asignacion', sixMonthsAgo.toISOString());

    // Agrupar por mes
    const counts = {};
    (data || []).forEach(({ fecha_asignacion }) => {
      const d   = new Date(fecha_asignacion);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    res.json(Object.entries(counts).map(([month, count]) => ({ month, count })));
  } catch (e) { res.json([]); }
});

// Salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Stats públicas de la plataforma
app.get('/api/stats', async (req, res) => {
  try {
    const { supabase } = require('./config/supabase');
    const [{ count: estudiantes }, { count: pacientes }, { count: matches }] = await Promise.all([
      supabase.from('estudiantes').select('*', { count: 'exact', head: true }),
      supabase.from('pacientes').select('*', { count: 'exact', head: true }),
      supabase.from('asignaciones').select('*', { count: 'exact', head: true }),
    ]);
    res.json({ estudiantes: estudiantes ?? 0, pacientes: pacientes ?? 0, matches: matches ?? 0 });
  } catch (e) {
    res.json({ estudiantes: 0, pacientes: 0, matches: 0 });
  }
});

// Manejo global de errores
app.use(errorHandler);

module.exports = app;