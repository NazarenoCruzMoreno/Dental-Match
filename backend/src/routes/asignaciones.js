const express = require('express');
const { authMiddleware } = require('../middlewares/auth');
const { crearAsignacion } = require('../controllers/asignacionesController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', crearAsignacion);

module.exports = router;