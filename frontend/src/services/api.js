const BASE_URL = '/api';

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
};

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

// Helper para requests autenticados
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const profileService = {
  get: () =>
    fetch(`${BASE_URL}/profile`, { headers: authHeaders() }).then(handleResponse),

  update: (data) =>
    fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
};

export const casosService = {
  listar: () =>
    fetch(`${BASE_URL}/casos`, { headers: authHeaders() }).then(handleResponse),

  obtener: (id) =>
    fetch(`${BASE_URL}/casos/${id}`, { headers: authHeaders() }).then(handleResponse),

  crear: (data) =>
    fetch(`${BASE_URL}/casos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  actualizar: (id, data) =>
    fetch(`${BASE_URL}/casos/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
};

export const notificationService = {
  getAll: () =>
    fetch(`${BASE_URL}/notifications`, { headers: authHeaders() }).then(handleResponse),
  markRead: () =>
    fetch(`${BASE_URL}/notifications/read`, { method: 'PUT', headers: authHeaders() }).then(handleResponse),
};

export const reviewService = {
  getByEstudiante: (id) =>
    fetch(`${BASE_URL}/reviews/${id}`).then(handleResponse),
  create: (data) =>
    fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),
};

export const setAuthToken = (token) => localStorage.setItem('token', token);
export const getAuthToken = () => localStorage.getItem('token');
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenExpiry');
};
export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

// Guarda token con expiración de 24 horas (sesión del día)
export const setSessionToken = (token) => {
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24hs
  localStorage.setItem('token', token);
  localStorage.setItem('tokenExpiry', expiry.toString());
};

// Verifica si la sesión sigue vigente (mismo día, dentro de las 24hs)
export const isSessionValid = () => {
  const token = localStorage.getItem('token');
  const expiry = localStorage.getItem('tokenExpiry');
  if (!token || !expiry) return false;
  return Date.now() < parseInt(expiry, 10);
};
