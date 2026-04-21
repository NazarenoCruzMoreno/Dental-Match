const express = require('express');
const { authMiddleware } = require('../middlewares/auth');
const { crearPerfil, obtenerEstudiantes } = require('../controllers/estudiantesController');

const router = express.Router();

router.use(authMiddleware);

router.post('/perfil', crearPerfil);
router.get('/', obtenerEstudiantes);

module.exports = router;