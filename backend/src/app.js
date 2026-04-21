const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');

const userRoutes = require('./routes/users');
const estudianteRoutes = require('./routes/estudiantes');
const pacienteRoutes = require('./routes/pacientes');
const asignacionRoutes = require('./routes/asignaciones');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', userRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/asignaciones', asignacionRoutes);

// Salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manejo global de errores
app.use(errorHandler);

module.exports = app;