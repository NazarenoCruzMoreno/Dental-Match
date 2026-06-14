// ─────────────────────────────────────────────────────────────────────────────
//  API client — todo el acceso al backend pasa por acá
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = '/api';

// ── Helpers ──────────────────────────────────────────────────────────────────
const handleResponse = async (res) => {
  // Soportamos respuestas no-JSON (raras pero posibles)
  const ct  = res.headers.get('content-type') ?? '';
  const data = ct.includes('application/json') ? await res.json() : null;
  if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
  return data;
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization:  `Bearer ${localStorage.getItem('token')}`,
});

// Headers solo de autorización (sin Content-Type) — para multipart/form-data
const authOnly = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const get = (path) =>
  fetch(`${BASE_URL}${path}`, { headers: authHeaders() }).then(handleResponse);

const post = (path, body) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).then(handleResponse);

const put = (path, body) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).then(handleResponse);

const del = (path) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse);

// Para subir archivos como multipart/form-data
const postMultipart = (path, formData) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: authOnly(),
    body: formData,
  }).then(handleResponse);

const putMultipart = (path, formData) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: authOnly(),
    body: formData,
  }).then(handleResponse);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  register: (email, password, role) =>
    fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    }).then(handleResponse),

  login: (email, password) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handleResponse),

  resetPassword: (email) =>
    fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(handleResponse),
};

// ── Perfil ───────────────────────────────────────────────────────────────────
export const profileService = {
  get:            ()         => get('/profile'),
  update:         (data)     => put('/profile', data),
  updateMultipart:(formData) => putMultipart('/profile', formData),
};

// ── Casos clínicos ───────────────────────────────────────────────────────────
export const casosService = {
  listar:           ()              => get('/casos'),
  obtener:          (id)            => get(`/casos/${id}`),
  crear:            (data)          => post('/casos', data),
  crearMultipart:   (formData)      => postMultipart('/casos', formData),
  actualizar:       (id, data)      => put(`/casos/${id}`, data),
  checkPrimerCaso:  ()              => get('/casos/check-primer-caso'),
  finalizar:        (id, data)      => post(`/casos/${id}/finalizar`, data),
};

// ── Aplicaciones y Match ─────────────────────────────────────────────────────
export const matchService = {
  aplicar:     (casoId, mensaje) => post(`/casos/${casoId}/aplicar`, { mensaje }),
  aplicantes:  (casoId)          => get(`/casos/${casoId}/aplicantes`),
  hacerMatch:  (casoId, estId)   => post(`/casos/${casoId}/match/${estId}`),
  rechazar:    (casoId, estId)   => del(`/casos/${casoId}/rechazar/${estId}`),
};

// ── Asignaciones ─────────────────────────────────────────────────────────────
export const asignacionesService = {
  misAsignaciones: ()      => get('/asignaciones/mis-asignaciones'),
  asignarManual:   (data)  => post('/asignaciones/manual', data),
};

// ── Turnos ───────────────────────────────────────────────────────────────────
export const turnosService = {
  listar:          (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return get(`/turnos${qs ? `?${qs}` : ''}`);
  },
  reservar:        (data)            => post('/turnos', data),
  actualizar:      (id, data)        => put(`/turnos/${id}`, data),
  disponibilidad:  (estudianteId, fecha) =>
    get(`/turnos/disponibilidad?estudiante_id=${estudianteId}&fecha=${fecha}`),
};

// ── Chat ─────────────────────────────────────────────────────────────────────
export const chatService = {
  listarChats:    ()                  => get('/messages'),
  listarMensajes: (casoId)            => get(`/messages/${casoId}`),
  enviar:         (casoId, content)   => post(`/messages/${casoId}`, { content }),
};

// ── Notificaciones ───────────────────────────────────────────────────────────
export const notificationService = {
  getAll:    () => get('/notifications'),
  markRead:  () => put('/notifications/read', {}),
};

// ── Reviews ──────────────────────────────────────────────────────────────────
export const reviewService = {
  getByEstudiante: (id) =>
    fetch(`${BASE_URL}/reviews/${id}`).then(handleResponse),
  create: (data) => post('/reviews', data),
};

// ── Stats y actividad ────────────────────────────────────────────────────────
export const statsService = {
  publicas: () => fetch(`${BASE_URL}/stats`).then(handleResponse),
  activity: () => get('/activity'),
};

// ─────────────────────────────────────────────────────────────────────────────
//  Manejo de sesión / token (localStorage)
// ─────────────────────────────────────────────────────────────────────────────
const TOKEN_KEY  = 'token';
const USER_KEY   = 'user';
const EXPIRY_KEY = 'tokenExpiry';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

export const setAuthToken    = (token) => localStorage.setItem(TOKEN_KEY, token);
export const getAuthToken    = ()      => localStorage.getItem(TOKEN_KEY);

export const setUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); }
  catch { return null; }
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRY_KEY);
};

// Guarda token con expiración (sesión del día)
export const setSessionToken = (token) => {
  localStorage.setItem(TOKEN_KEY,  token);
  localStorage.setItem(EXPIRY_KEY, (Date.now() + SESSION_DURATION_MS).toString());
};

// Verifica si la sesión sigue vigente
export const isSessionValid = () => {
  const token  = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!token || !expiry) return false;
  return Date.now() < parseInt(expiry, 10);
};
