const BASE_URL = 'http://localhost:3000';

// Login
export async function loginUser(datos) {
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error('Error en login');
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Registro
export async function registerUser(datos) {
  try {
    const res = await fetch(`${BASE_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error('Error en registro');
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Obtener turnos
export async function getTurnos() {
  try {
    const res = await fetch(`${BASE_URL}/turnos`);
    if (!res.ok) throw new Error('Error obteniendo turnos');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Crear turno
export async function createTurno(turno) {
  try {
    const res = await fetch(`${BASE_URL}/turnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(turno)
    });
    if (!res.ok) throw new Error('Error creando turno');
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Eliminar turno
export async function deleteTurno(id) {
  try {
    const res = await fetch(`${BASE_URL}/turnos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error eliminando turno');
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}