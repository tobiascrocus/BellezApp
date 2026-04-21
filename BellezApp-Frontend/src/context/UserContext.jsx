import { createContext, useState, useContext, useEffect } from 'react';
import * as api from '../services/api';
import { API_BASE } from '../config';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
 
  // Función para obtener los datos del usuario desde el backend usando el token
  const fetchUser = async () => {
    try {
      const data = await api.getMe();
      if (data.ok) {
        setUser(data.data);
      } else {
        logout();
      }
    } catch (error) {
      console.error("Error de red al obtener usuario:", error);
    }
  };

  useEffect(() => {
    // Busca el token primero en localStorage, luego en sessionStorage.
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (storedToken) {
      fetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false); // Si no hay token, terminamos de cargar
    }
  }, []);
  
  const login = async (token, rememberMe) => {
    if (rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
    await fetchUser(); // Obtenemos los datos del usuario después de iniciar sesión
  };

  const logout = () => {
    localStorage.removeItem('token'); // Limpiamos ambos almacenamientos
    sessionStorage.removeItem('token');
    setUser(null);
    // Opcional: redirigir al login
    // window.location.href = '/login';
  };

  const updateUser = async () => {
    await fetchUser();
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    API_URL: API_BASE,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);