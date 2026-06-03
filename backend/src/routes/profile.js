const express = require('express');
const { getProfile, updateProfile } = require('../controllers/profileController');
const { authMiddleware } = require('../middlewares/auth');
const { upload, uploadToStorage } = require('../middlewares/upload');

const router = express.Router();

// BE-6: Obtener perfil del usuario logueado
router.get('/', authMiddleware, getProfile);

// BE-7: Crear o actualizar perfil (con imagen opcional para pacientes)
router.put('/', authMiddleware, upload.single('imagen'), uploadToStorage, updateProfile);

module.exports = router;
