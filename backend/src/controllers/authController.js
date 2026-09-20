const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { supabase } = require('../config/supabase');
const { generarToken } = require('../config/jwt');
const { registerSchema, loginSchema } = require('../models/validaciones');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../config/mailer');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

const register = async (req, res) => {
  try {
    const { email, password, role } = registerSchema.parse(req.body);

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert({ email, password: hashedPassword, role, email_verificado: false })
      .select('id, email, role')
      .single();

    if (error) throw error;

    // Token de verificación — sin esto, register no devuelve sesión: hay que
    // confirmar el email antes de poder loguearse (ver login más abajo).
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const { error: verifyInsertError } = await supabase
      .from('email_verifications').insert({ email: user.email, token: verifyToken });

    if (verifyInsertError) {
      console.error('Error guardando token de verificación:', verifyInsertError.message);
    } else {
      const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] ?? 'http://localhost:5173';
      const verifyUrl = `${frontendUrl}/verify-email?token=${verifyToken}`;
      sendVerificationEmail(user.email, verifyUrl)
        .catch((err) => console.error('Error enviando email de verificación:', err.message));
    }

    res.status(201).json({
      message: 'Cuenta creada. Revisá tu email para confirmarla antes de ingresar.',
      user: { email: user.email, role: user.role },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password, role, email_verificado')
      .eq('email', email)
      .single();

    // PGRST116 = "no rows" (single() sin match) -> usuario no existe, es normal.
    // Cualquier OTRO error (ej. falta la columna email_verificado porque no se
    // corrió la migración) es un problema real del servidor, no "mal la contraseña".
    if (userError && userError.code !== 'PGRST116') {
      console.error('Error de DB en login:', userError.message);
      return res.status(500).json({ error: 'Error del servidor. Probá de nuevo en un rato.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.email_verificado) {
      return res.status(403).json({
        error: 'Tenés que confirmar tu email antes de ingresar. Revisá tu casilla (y la carpeta de spam).',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const token = generarToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      message: 'Login exitoso',
      token,
      user: { email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/auth/verify-email ────────────────────────────────────────────────
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token requerido' });

    const { data: verification } = await supabase
      .from('email_verifications').select('*').eq('token', token).maybeSingle();

    if (!verification) return res.status(400).json({ error: 'El link no es válido.' });

    const { error } = await supabase
      .from('users').update({ email_verificado: true }).eq('email', verification.email);
    if (error) throw error;

    // Token de un solo uso
    await supabase.from('email_verifications').delete().eq('token', token);

    res.json({ message: 'Email confirmado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
// Pide el link de recuperación. Siempre responde igual exista o no el email,
// para no dejar enumerar cuentas por esta vía.
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const { data: user } = await supabase
      .from('users').select('id').eq('email', email).maybeSingle();

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

      // Invalida cualquier link anterior sin usar para este email
      await supabase.from('password_resets').delete().eq('email', email);
      const { error: insertError } = await supabase
        .from('password_resets').insert({ email, token, expires_at: expiresAt });

      if (insertError) {
        // No le mandamos un link roto al usuario si el token no quedó guardado.
        // La respuesta sigue siendo la misma genérica de abajo (no delatamos nada).
        console.error('Error guardando token de reset:', insertError.message);
      } else {
        const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] ?? 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

        // No bloqueamos la respuesta al usuario esperando que salga el email
        sendPasswordResetEmail(email, resetUrl)
          .catch((err) => console.error('Error enviando email de reset:', err.message));
      }
    }

    res.json({ message: 'Si el email existe, vas a recibir un link para restablecer tu contraseña.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
// Confirma el cambio: valida el token de un solo uso y actualiza users.password
// (la contraseña vive ahí, no en estudiantes/pacientes, sea cual sea el rol).
const resetPasswordConfirm = async (req, res) => {
  try {
    const { token, nueva_contrasena } = req.body;
    if (!token || !nueva_contrasena) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }
    if (nueva_contrasena.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const { data: reset } = await supabase
      .from('password_resets').select('*').eq('token', token).maybeSingle();

    if (!reset) return res.status(400).json({ error: 'El link no es válido. Pedí uno nuevo.' });

    if (new Date(reset.expires_at) < new Date()) {
      await supabase.from('password_resets').delete().eq('token', token);
      return res.status(400).json({ error: 'El link venció. Pedí uno nuevo.' });
    }

    const hashedPassword = await bcrypt.hash(nueva_contrasena, 10);
    const { error } = await supabase
      .from('users').update({ password: hashedPassword }).eq('email', reset.email);
    if (error) throw error;

    // Token de un solo uso
    await supabase.from('password_resets').delete().eq('token', token);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, forgotPassword, resetPasswordConfirm, verifyEmail };
