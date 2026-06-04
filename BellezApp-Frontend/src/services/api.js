import { API_BASE } from '../config';

// Busca el token en localStorage y sessionStorage
function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Configuración de encabezados con autorización
function getHeaders(isJson = true) {
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function get(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: getHeaders()
  });
  return res.json();
}

async function post(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

async function put(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

async function del(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return res.json();
}

// ENDPOINTS

// Autenticación
export const login = (email, password, rememberMe) => post('/login', { email, password, rememberMe });
export const registerUser = (data) => post('/register', data);

// Perfil
export const getMe = () => get('/me');
export const updateMe = (data) => put('/me', data);

// Usuarios para administración
export const getUsuarios = () => get('/usuarios');
export const getUsuarioById = (id) => get(`/usuarios/${id}`);
export const createUsuario = (data) => post('/usuarios', data);
export const updateUsuario = (id, data) => put(`/usuarios/${id}`, data);
export const deleteUsuario = (id) => del(`/usuarios/${id}`);

// Servicios
export const getServicios = () => get('/servicios');

// Peluqueros
export const getPeluqueros = () => get('/peluqueros');

// Turnos
export const getTurnos = () => get('/turnos');
export const getTurnosAgenda = () => get('/turnos?view=agenda');
export const createTurno = (data) => post('/turnos', data);
export const updateTurno = (id, data) => put(`/turnos/${id}`, data);
export const cancelTurno = (id) => del(`/turnos/${id}`);

// Disponibilidad
export const getDisponibilidad = (fecha, peluquero_id = null) => {
  const query = peluquero_id ? `?fecha=${fecha}&peluquero_id=${peluquero_id}` : `?fecha=${fecha}`;
  return get(`/disponibilidad${query}`);
};