const rateLimit = require('express-rate-limit');

// Respuesta consistente con el formato de errorHandler.js: { error: '...' }
const jsonRateLimitHandler = (mensaje) => (req, res) => {
  res.status(429).json({ error: mensaje });
};

// ── Limitador general — aplica a toda /api ────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler('Demasiadas peticiones. Probá de nuevo en unos minutos.'),
});

// ── Limitador estricto — solo login/register, para frenar fuerza bruta ───────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // los logins exitosos no cuentan contra el límite
  handler: jsonRateLimitHandler('Demasiados intentos. Probá de nuevo en 15 minutos.'),
});

module.exports = { generalLimiter, authLimiter };
