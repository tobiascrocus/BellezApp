// services/controlPanel.js

const API_URL = 'http://localhost:4000';

// Helper para obtener el token del localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Helper para manejar respuestas
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error en la petición');
  }
  return response.json();
};

// ==================
// TURNOS
// ==================

export const getTurnos = async ({ limit = 50, page = 1, search = '', fecha = '', estado = '' } = {}) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString(),
  });
  
  if (search) params.append('search', search);
  if (fecha) params.append('fecha', fecha);
  if (estado) params.append('estado', estado);

  const response = await fetch(`${API_URL}/turnos?${params}`, {
    method: 'GET',
    headers: getAuthHeader()
  });

  return handleResponse(response);
};

export const deleteTurno = async (id) => {
  const response = await fetch(`${API_URL}/turnos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });

  return handleResponse(response);
};

export const cancelTurno = async (id) => {
  const response = await fetch(`${API_URL}/turnos/${id}/cancelar`, {
    method: 'POST',
    headers: getAuthHeader()
  });

  return handleResponse(response);
};

// ==================
// USUARIOS
// ==================

export const getUsuarios = async ({ limit = 50, page = 1, search = '' } = {}) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString(),
  });
  
  if (search) params.append('search', search);

  const response = await fetch(`${API_URL}/usuarios?${params}`, {
    method: 'GET',
    headers: getAuthHeader()
  });

  return handleResponse(response);
};

export const deleteUsuario = async (id) => {
  const response = await fetch(`${API_URL}/usuarios/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });

  return handleResponse(response);
};

export const updateUsuario = async (id, data) => {
  const response = await fetch(`${API_URL}/usuarios/${id}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  });

  return handleResponse(response);
};

// ==================
// PELUQUEROS
// ==================

export const getPeluqueros = async () => {
  const response = await fetch(`${API_URL}/peluqueros`, {
    method: 'GET',
    headers: getAuthHeader()
  });

  return handleResponse(response);
};