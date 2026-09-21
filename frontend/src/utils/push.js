import { pushService } from "../services/api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Falta la clave pública => el build no tiene VITE_VAPID_PUBLIC_KEY (se incrusta
// al compilar: en Vercel hay que definirla y redeployar).
export const pushConfigurado = Boolean(VAPID_PUBLIC_KEY);

// El navegador tiene que soportar SW + Push + Notification. En iPhone/iPad solo
// existe PushManager si la app está instalada en la pantalla de inicio.
export const pushSoportado = () =>
  pushConfigurado && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

// applicationServerKey exige bytes; la clave VAPID pública viene en base64url
function base64UrlABytes(base64Url) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function mismosBytes(a, b) {
  if (!a || !b || a.byteLength !== b.byteLength) return false;
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  return x.every((v, i) => v === y[i]);
}

async function registrarSW() {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

async function suscripcionActual() {
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

// 'no-soportado' | 'bloqueado' | 'inactivo' | 'activo'
export async function estadoPush() {
  if (!pushSoportado()) return "no-soportado";
  if (Notification.permission === "denied") return "bloqueado";
  const sub = await suscripcionActual();
  return sub && Notification.permission === "granted" ? "activo" : "inactivo";
}

// Pide permiso, se suscribe al push del navegador con la clave VAPID y le manda
// la suscripción al backend. Lanza Error con un mensaje listo para mostrar.
export async function activarPush() {
  if (!pushSoportado()) throw new Error("Tu navegador no admite notificaciones de escritorio.");

  const permiso = await Notification.requestPermission();
  if (permiso === "denied") throw new Error("Las notificaciones están bloqueadas en el navegador.");
  if (permiso !== "granted") throw new Error("No diste permiso para mostrar notificaciones.");

  const reg = await registrarSW();
  const clave = base64UrlABytes(VAPID_PUBLIC_KEY);

  let sub = await reg.pushManager.getSubscription();
  // Una suscripción hecha con OTRA clave VAPID hace que subscribe() explote
  // (InvalidStateError): se descarta y se crea de nuevo.
  if (sub && !mismosBytes(sub.options?.applicationServerKey, clave.buffer)) {
    await sub.unsubscribe();
    sub = null;
  }

  const esNueva = !sub;
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: clave });

  try {
    await pushService.subscribe(sub.toJSON());
  } catch (e) {
    // Si el backend no la guardó, no dejar el navegador "suscripto a medias"
    if (esNueva) await sub.unsubscribe().catch(() => {});
    throw e;
  }
}

// Mantiene el mapeo servidor <-> dispositivo alineado con quien está logueado.
// Si la sesión anterior venció (ahí no se puede avisar al backend) y ahora entra
// otra persona en este navegador, sin esto los avisos de la primera seguirían
// llegando a esta pantalla. El backend hace upsert por endpoint: idempotente.
export async function sincronizarPush() {
  const sub = await suscripcionActual();
  if (sub) await pushService.subscribe(sub.toJSON());
}

// Baja la suscripción en el backend y en el navegador. El navegador se baja
// aunque falle el backend, para que dejen de llegar avisos igual: el servicio
// push responde 410 y el backend borra esa fila solo.
export async function desactivarPush() {
  if (!("serviceWorker" in navigator)) return;
  const sub = await suscripcionActual();
  if (!sub) return;
  try {
    await pushService.unsubscribe(sub.endpoint);
  } finally {
    await sub.unsubscribe().catch(() => {});
  }
}
