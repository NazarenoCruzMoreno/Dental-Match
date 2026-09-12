const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/rateLimiters');

// ── Rutas ─────────────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/users');
const profileRoutes     = require('./routes/profile');
const asignacionRoutes  = require('./routes/asignaciones');
const notifRoutes       = require('./routes/notifications');
const reviewRoutes      = require('./routes/reviews');
const casosRoutes       = require('./routes/casos');
const aplicacionRoutes  = require('./routes/aplicaciones');
const turnosRoutes      = require('./routes/turnos');
const statsRoutes       = require('./routes/stats');
const messagesRoutes    = require('./routes/messages');

const app = express();

// Render (y la mayoría de los PaaS) corren la app detrás de un proxy/load
// balancer — sin esto, express-rate-limit ve la IP del proxy en vez de la
// del cliente real (o directamente tira error de validación de X-Forwarded-For).
app.set('trust proxy', 1);

// ── Middlewares globales ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', generalLimiter);

// ── Rutas de la API ──────────────────────────────────────────────────────────
// Auth y perfil
app.use('/api/auth',           authRoutes);
app.use('/api/profile',        profileRoutes);

// Recursos principales
app.use('/api/casos',          casosRoutes);
app.use('/api/casos',          aplicacionRoutes); // POST /:id/aplicar, /match, etc.
app.use('/api/turnos',         turnosRoutes);
app.use('/api/asignaciones',   asignacionRoutes);
app.use('/api/messages',       messagesRoutes);

// Recursos secundarios
app.use('/api/notifications',  notifRoutes);
app.use('/api/reviews',        reviewRoutes);

// Endpoints públicos (stats, health, activity)
app.use('/api',                statsRoutes);

// ── Manejo global de errores ─────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
