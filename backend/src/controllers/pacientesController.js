const { db } = require('../config/firebase');
const { pacienteSchema } = require('../models/validaciones');

const crearPerfil = async (req, res) => {
  try {
    const data = pacienteSchema.parse(req.body);
    const { email } = req.user;
    const imagenUrl = req.imageUrl;

    // Verificar que es paciente
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();
    if (userDoc.data().role !== 'paciente') {
      return res.status(403).json({ error: 'Solo pacientes' });
    }

    // Crear perfil paciente
    const pacienteRef = db.collection('pacientes').doc(email);
    await pacienteRef.set({
      ...data,
      userId: email,
      imagenUrl,
      estado: 'pendiente',
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'Perfil creado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { crearPerfil };