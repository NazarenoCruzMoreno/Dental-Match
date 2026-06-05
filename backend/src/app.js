const express = require('express');
const cors    = require('cors');
const errorHandler = require('./middlewares/errorHandler');

// ── Rutas ─────────────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/users');
const profileRoutes     = require('./routes/profile');
const estudianteRoutes  = require('./routes/estudiantes');
const pacienteRoutes    = require('./routes/pacientes');
const asignacionRoutes  = require('./routes/asignaciones');
const notifRoutes       = require('./routes/notifications');
const reviewRoutes      = require('./routes/reviews');
const casosRoutes       = require('./routes/casos');
const aplicacionRoutes  = require('./routes/aplicaciones');
const turnosRoutes      = require('./routes/turnos');
const statsRoutes       = require('./routes/stats');

const app = express();

// ── Middlewares globales ─────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rutas de la API ──────────────────────────────────────────────────────────
// Auth y perfil
app.use('/api/auth',           authRoutes);
app.use('/api/profile',        profileRoutes);

// Recursos principales
app.use('/api/casos',          casosRoutes);
app.use('/api/casos',          aplicacionRoutes); // POST /:id/aplicar, /match, etc.
app.use('/api/turnos',         turnosRoutes);
app.use('/api/asignaciones',   asignacionRoutes);

// Recursos secundarios
app.use('/api/estudiantes',    estudianteRoutes);
app.use('/api/pacientes',      pacienteRoutes);
app.use('/api/notifications',  notifRoutes);
app.use('/api/reviews',        reviewRoutes);

// Endpoints públicos (stats, health, activity)
app.use('/api',                statsRoutes);

// ── Manejo global de errores ─────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
