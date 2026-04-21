const { db } = require('../config/firebase');
const { estudianteSchema } = require('../models/validaciones');

const crearPerfil = async (req, res) => {
  try {
    const data = estudianteSchema.parse(req.body);
    const { email } = req.user;

    // Verificar que es estudiante
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();
    if (userDoc.data().role !== 'estudiante') {
      return res.status(403).json({ error: 'Solo estudiantes' });
    }

    // Crear perfil estudiante
    const estudianteRef = db.collection('estudiantes').doc(email);
    await estudianteRef.set({
      ...data,
      userId: email,
      rating: 0,
      pacientesAtendidos: 0,
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'Perfil creado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const obtenerEstudiantes = async (req, res) => {
  try {
    const snapshot = await db.collection('estudiantes').get();
    const estudiantes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(estudiantes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { crearPerfil, obtenerEstudiantes };