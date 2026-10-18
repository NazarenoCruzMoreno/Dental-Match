const express = require('express');
const { authMiddleware, isAdmin } = require('../middlewares/auth');
const admin = require('../controllers/adminController');

const router = express.Router();

// Todo /api/admin exige JWT válido (authMiddleware) Y role === 'admin' (isAdmin).
// No hay forma de auto-registrarse como admin (registerSchema solo permite
// estudiante/paciente) — el rol se setea a mano en Supabase.
router.use(authMiddleware, isAdmin);

router.get('/stats', admin.stats);
router.get('/usuarios', admin.listarUsuarios);
router.get('/casos', admin.listarCasos);
router.delete('/casos/:id', admin.eliminarCaso);
router.delete('/casos/:id/imagen', admin.quitarImagenDeCaso);

module.exports = router;
