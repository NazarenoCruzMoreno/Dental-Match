const express = require('express');
const { register, login, forgotPassword, resetPasswordConfirm, verifyEmail } = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiters');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
// Mismo limiter que login/register: forgot-password puede usarse para
// bombardear de emails o para enumerar cuentas por timing; reset-password
// no lo necesita tanto (el token es un random de 256 bits, no se fuerza
// bruta con 5 intentos/15min), pero no cuesta nada y es defensa en capas.
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordConfirm);
router.get('/verify-email', verifyEmail);

module.exports = router;