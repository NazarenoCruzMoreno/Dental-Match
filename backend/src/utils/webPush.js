const webpush = require('web-push');
const { supabase } = require('../config/supabase');

// ── Configuración VAPID (lazy) ────────────────────────────────────────────────
// Se evalúa al primer uso y no al cargar el módulo, así no depende del orden en
// que dotenv cargue el .env. Si faltan las variables, el push queda apagado y
// las notificaciones in-app siguen funcionando igual.
let configurado = null; // null = todavía sin evaluar

function inicializar() {
  if (configurado !== null) return configurado;

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    console.warn('⚠️  Web Push deshabilitado: faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT.');
    return (configurado = false);
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    return (configurado = true);
  } catch (e) {
    console.warn('⚠️  Web Push deshabilitado: configuración VAPID inválida —', e.message);
    return (configurado = false);
  }
}

// ── Anti-SSRF ─────────────────────────────────────────────────────────────────
// El endpoint de una suscripción es una URL que ESTE servidor va a llamar. Si se
// aceptara cualquiera, un usuario podría apuntarla a un servicio interno. Solo
// se permiten https y los servicios push de los navegadores conocidos.
const HOSTS_PUSH = ['fcm.googleapis.com']; // Chrome / Edge / Brave / Opera / Samsung
const SUFIJOS_PUSH = [
  '.push.services.mozilla.com', // Firefox
  '.push.apple.com',            // Safari
  '.notify.windows.com',        // Edge / Windows (WNS)
];

function esEndpointPermitido(endpoint) {
  let url;
  try { url = new URL(endpoint); } catch { return false; }
  if (url.protocol !== 'https:') return false;

  // Solo para desarrollo/tests (ej. un servidor push falso en localhost)
  const extras = (process.env.PUSH_EXTRA_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean);

  const host = url.hostname;
  return HOSTS_PUSH.includes(host)
    || extras.includes(host)
    || SUFIJOS_PUSH.some((s) => host.endsWith(s));
}

// ── Suscripciones ─────────────────────────────────────────────────────────────
// Upsert por endpoint: el mismo navegador suscribiéndose de nuevo actualiza la
// fila. Si otro usuario inicia sesión en ese mismo navegador y se suscribe, la
// fila pasa a ser suya (el dispositivo ahora es de quien está logueado).
async function guardarSuscripcion(userId, subscription) {
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: userId, endpoint: subscription.endpoint, subscription }, { onConflict: 'endpoint' });
  if (error) throw error;
}

// Borra la suscripción de ESTE usuario para ese endpoint (el filtro por user_id
// impide desuscribir a otro). Idempotente: si no existe, no es un error.
async function eliminarSuscripcion(userId, endpoint) {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint);
  if (error) throw error;
}

// ── Envío ─────────────────────────────────────────────────────────────────────
// Manda `payload` ({ title, body, url, tag }) a todos los dispositivos del
// usuario. NUNCA lanza: un push caído no puede romper la request que lo originó.
// Las suscripciones que el servicio push reporta como muertas (404/410, ej. el
// usuario revocó el permiso) se borran para no reintentarlas para siempre.
async function enviarPush(userId, payload) {
  const resumen = { ok: 0, eliminadas: 0, errores: 0, omitidas: 0 };
  if (!inicializar()) return resumen;

  try {
    const { data: subs, error } = await supabase
      .from('push_subscriptions').select('id, subscription').eq('user_id', userId);
    if (error) throw error;

    const body = JSON.stringify(payload);

    await Promise.all((subs ?? []).map(async (s) => {
      if (!esEndpointPermitido(s.subscription?.endpoint)) { resumen.omitidas++; return; }
      try {
        // TTL 24h: si el dispositivo está apagado, el aviso vence en vez de llegar días después
        await webpush.sendNotification(s.subscription, body, { TTL: 86400, timeout: 10000 });
        resumen.ok++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', s.id);
          resumen.eliminadas++;
        } else {
          console.error('[webPush] falló el envío:', err.statusCode ?? '', err.message);
          resumen.errores++;
        }
      }
    }));
  } catch (e) {
    console.error('[webPush] error:', e.message);
  }
  return resumen;
}

module.exports = { enviarPush, guardarSuscripcion, eliminarSuscripcion, esEndpointPermitido };
