const { supabase } = require('../config/supabase');
const { enviarPush } = require('./webPush');

// A qué pantalla lleva el click en la notificación push
const URL_POR_TIPO = {
  match:           '/asignaciones',
  asignacion:      '/asignaciones',
  caso_completado: '/casos',
  turno:           '/turnos',
  turno_propuesto: '/turnos',
};

// Único punto por el que se crea una notificación: guarda la in-app (la campana)
// y dispara el push nativo. Reemplaza 6 inserts sueltos que no chequeaban el
// error — justamente por eso una tabla faltante pasó desapercibida: cada
// notificación se perdía en silencio.
async function notificar(userId, { type, title, message }) {
  if (!userId) return;

  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, title, message });
  if (error) console.error('[notificar] no se pudo guardar la notificación in-app:', error.message);

  // Sin await: un servicio push lento no debe demorar la respuesta al usuario
  enviarPush(userId, { title, body: message, url: URL_POR_TIPO[type] ?? '/home' })
    .catch((e) => console.error('[notificar] push:', e.message));
}

module.exports = { notificar };
