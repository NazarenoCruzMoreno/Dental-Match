const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');

const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
const estudianteRoutes = require('./routes/estudiantes');
const pacienteRoutes = require('./routes/pacientes');
const asignacionRoutes = require('./routes/asignaciones');

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
app.use('/api/auth', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/asignaciones', asignacionRoutes);

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