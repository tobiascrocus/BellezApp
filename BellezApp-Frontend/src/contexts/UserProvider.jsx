// UserProvider.jsx - Conectado a la API real
import { useState, useEffect } from "react";
import { UserContext } from "./UserContext";

const API_URL = 'http://localhost:4000';

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inicializar sesión guardada
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("token");

      if (savedToken) {
        setToken(savedToken);
        
        // Obtener datos del usuario actual desde la API
        try {
          const response = await fetch(`${API_URL}/me`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } else {
            // Token inválido, limpiar
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        } catch (error) {
          console.error("Error verificando token:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login real con la API
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en login');
      }

      const { token: receivedToken } = await response.json();

      // Obtener datos del usuario
      const userResponse = await fetch(`${API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${receivedToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userResponse.ok) {
        throw new Error('Error obteniendo datos del usuario');
      }

      const userData = await userResponse.json();

      setUser(userData);
      setToken(receivedToken);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", receivedToken);

      return { success: true };
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Fetch autenticado
  const authFetch = async (url, options = {}) => {
    if (!token) {
      const err = new Error("No autenticado");
      err.status = 401;
      throw err;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    return fetch(url, { ...options, headers });
  };

  // Actualizar usuario
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        authFetch,
        updateUser,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;