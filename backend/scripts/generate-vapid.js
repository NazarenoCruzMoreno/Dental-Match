// Genera un par de claves VAPID para Web Push. Correr UNA sola vez:
//   node scripts/generate-vapid.js
//
// - VAPID_PUBLIC_KEY  -> backend/.env, Render y (como VITE_VAPID_PUBLIC_KEY)
//                        frontend/.env.local y Vercel. Es pública por diseño.
// - VAPID_PRIVATE_KEY -> SOLO backend/.env y Render. Es un secreto: quien la
//                        tenga puede mandar notificaciones haciéndose pasar por
//                        la app. Nunca al frontend ni a git.
//
// Si se regenera el par, todas las suscripciones existentes quedan inválidas
// (cada usuario tendría que volver a activar las notificaciones).
const webpush = require('web-push');

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
