// ── Service Worker básico — cache de assets estáticos ───────────────────────
const CACHE_VERSION = 'dental-match-v1';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

// Install: pre-cachear assets esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: estrategia network-first para API, cache-first para assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar requests al backend ni POSTs
  if (url.pathname.startsWith('/api/') || request.method !== 'GET') return;

  // En desarrollo no se cachea: el cache-first serviría módulos viejos de Vite.
  // (index.html solo registra este SW fuera de localhost, pero el toggle de
  // notificaciones sí puede registrarlo en local para probar push.)
  if (url.hostname === 'localhost') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const responseClone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// ── Notificaciones push ─────────────────────────────────────────────────────
// El backend manda { title, body, url } cifrado con Web Push (ver utils/notificar.js).
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  // Sin `tag` a propósito: con tag, dos avisos del mismo tipo (dos propuestas de
  // turno seguidas) se pisarían y el primero desaparecería sin que se lea.
  event.waitUntil(
    self.registration.showNotification(data.title || 'Dental Match', {
      body: data.body || '',
      icon: '/icon.svg',
      data: { url: data.url || '/home' },
    })
  );
});

// Click en la notificación: enfocar la pestaña abierta (o abrir una) en la pantalla del aviso
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Solo rutas del propio sitio: nunca navegar a un origen que venga en el payload
  let target = new URL('/home', self.location.origin).href;
  try {
    const u = new URL(event.notification.data?.url || '/home', self.location.origin);
    if (u.origin === self.location.origin) target = u.href;
  } catch { /* se queda en /home */ }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const abierta = wins.find((w) => new URL(w.url).origin === self.location.origin);
      if (!abierta) return self.clients.openWindow(target);
      return abierta.focus()
        .then(() => abierta.navigate(target))
        .catch(() => self.clients.openWindow(target));
    })
  );
});
