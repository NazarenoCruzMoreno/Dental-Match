const express = require('express');
const {
  crearCaso, listarCasos, obtenerCaso, actualizarCaso,
  checkPrimerCaso, finalizarCaso,
} = require('../controllers/casosController');
const { authMiddleware } = require('../middlewares/auth');
const { upload, uploadToStorage } = require('../middlewares/upload');

const router = express.Router();

// Listar y crear
router.post('/', authMiddleware, upload.single('imagen'), uploadToStorage, crearCaso);
router.get('/',  authMiddleware, listarCasos);

// Endpoint específico — antes de las rutas con :id
router.get('/check-primer-caso', authMiddleware, checkPrimerCaso);

// Detalle y edición
router.get('/:id', authMiddleware, obtenerCaso);
router.put('/:id', authMiddleware, actualizarCaso);

// Finalización por el estudiante (diagnóstico + rating del paciente)
router.post('/:id/finalizar', authMiddleware, finalizarCaso);

module.exports = router;
