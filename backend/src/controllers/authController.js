const bcrypt = require('bcryptjs');
const { db } = require('../config/firebase');
const { generarToken } = require('../config/jwt');
const { authSchema } = require('../models/validaciones');

const register = async (req, res) => {
  try {
    const { email, password, role } = authSchema.parse(req.body);

    // Verificar si existe
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return res.status(400).json({ error: 'Usuario ya existe' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    await userRef.set({
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    });

    const token = generarToken({ email, role });

    res.status(201).json({
      message: 'Usuario creado',
      token,
      user: { email, role },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.errors,
      });
    }
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = authSchema.parse(req.body);

    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = userDoc.data();
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generarToken({ email: user.email, role: user.role });

    res.json({
      message: 'Login exitoso',
      token,
      user: { email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login };