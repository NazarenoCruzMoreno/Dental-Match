const express = require('express');
const { crearCaso, listarCasos, obtenerCaso, actualizarCaso } = require('../controllers/casosController');
const { authMiddleware } = require('../middlewares/auth');
const { upload, uploadToStorage } = require('../middlewares/upload');

const router = express.Router();

// BE-9: Crear caso (solo pacientes autenticados)
router.post('/', authMiddleware, upload.single('imagen'), uploadToStorage, crearCaso);

// BE-10: Listar casos (filtrado por rol)
router.get('/', authMiddleware, listarCasos);

// Detalle de un caso
router.get('/:id', authMiddleware, obtenerCaso);

// Actualizar caso
router.put('/:id', authMiddleware, actualizarCaso);

module.exports = router;
