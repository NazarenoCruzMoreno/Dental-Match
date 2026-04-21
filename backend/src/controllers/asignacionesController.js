const { db } = require('../config/firebase');

const crearAsignacion = async (req, res) => {
  try {
    const { estudianteId, pacienteId } = req.body;
    const { email: creadorId } = req.user;

    // Verificar que el paciente existe y está disponible
    const pacienteRef = db.collection('pacientes').doc(pacienteId);
    const pacienteDoc = await pacienteRef.get();
    
    if (!pacienteDoc.exists || pacienteDoc.data().estado !== 'pendiente') {
      return res.status(400).json({ error: 'Paciente no disponible' });
    }

    // Crear asignación
    const asignacionRef = db.collection('asignaciones').doc();
    await asignacionRef.set({
      estudianteId,
      pacienteId,
      creadorId,
      estado: 'pendiente',
      fechaAsignacion: new Date(),
      notas: '',
    });

    // Actualizar estado del paciente
    await pacienteRef.update({ estado: 'asignado' });

    res.status(201).json({ 
      message: 'Asignación creada',
      id: asignacionRef.id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { crearAsignacion };