const express = require('express');
const { register, login, resetPassword } = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiters');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/reset-password', resetPassword);

module.exports = router;