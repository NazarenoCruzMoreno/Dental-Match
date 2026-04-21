const express = require('express');
const { authMiddleware } = require('../middlewares/auth');
const { upload, uploadToStorage } = require('../middlewares/upload');
const { crearPerfil } = require('../controllers/pacientesController');

const router = express.Router();

router.use(authMiddleware);

router.post('/perfil', 
  upload.single('imagen'),
  uploadToStorage,
  crearPerfil
);

module.exports = router;