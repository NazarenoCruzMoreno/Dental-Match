const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const { crearAsignacion, asignacionManual, misAsignaciones } = require('../controllers/asignacionesController');

const router = express.Router();

router.use(authMiddleware);

// Legacy
router.post('/', crearAsignacion);

// BE-12: Asignación manual por el paciente
router.post('/manual', roleMiddleware(['paciente']), asignacionManual);

// FE-10: Casos asignados al estudiante
router.get('/mis-asignaciones', roleMiddleware(['estudiante']), misAsignaciones);

module.exports = router;
