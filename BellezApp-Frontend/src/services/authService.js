// services/authService.js
const API_URL = "http://localhost:4000"; // ajusta si cambia el puerto/backend

async function handleResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return data;
}

// Login
export async function login(email, password) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
}

// Registro de clientes
export async function register({ nombre, apellido, email, telefono, password }) {
  try {
    const res = await fetch(`${API_URL}/registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        apellido,
        email,
        telefono,
        password_hash: password, // el backend espera password_hash
      }),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error en registro:", error);
    throw error;
  }
}

// Obtener perfil del usuario logueado
export async function getProfile(token) {
  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    throw error;
  }
}
