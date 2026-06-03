const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');
const { generarToken } = require('../config/jwt');
const { registerSchema, loginSchema } = require('../models/validaciones');

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
      .insert({ email, password: hashedPassword, role })
      .select('id, email, role')
      .single();

    if (error) throw error;

    const token = generarToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({
      message: 'Usuario creado',
      token,
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

    const { data: user } = await supabase
      .from('users')
      .select('id, email, password, role')
      .eq('email', email)
      .single();

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
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

const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    // Siempre respondemos OK por seguridad (no revelamos si el email existe)
    if (error) console.error('Reset password error:', error.message);
    res.json({ message: 'Si el email existe, recibirás un link de recuperación.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, resetPassword };
