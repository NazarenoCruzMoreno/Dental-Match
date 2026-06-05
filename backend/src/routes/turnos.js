const express = require('express');
const { reservarTurno, listarTurnos, actualizarTurno, obtenerDisponibilidad } = require('../controllers/turnosController');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();
router.use(authMiddleware);

router.post('/',                   reservarTurno);        // BE-14: Reservar turno
router.get('/',                    listarTurnos);         // Listar mis turnos
router.put('/:id',                 actualizarTurno);      // Confirmar / cancelar / completar
router.get('/disponibilidad',      obtenerDisponibilidad);// Slots libres de un estudiante

module.exports = router;
