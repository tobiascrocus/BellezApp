import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
 
  // Memorizamos logout para que sea una dependencia estable
  const logout = useCallback(() => {
    localStorage.removeItem('token'); // Limpiamos ambos almacenamientos
    sessionStorage.removeItem('token');
    setUser(null);
    // Opcional: redirigir al login
    // window.location.href = '/login';
  }, []);

  // Función para obtener los datos del usuario desde el backend usando el token
  // Usamos useCallback para que fetchUser sea estable y no dispare el useEffect innecesariamente
  const fetchUser = useCallback(async () => {
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
  }, [logout]);

  useEffect(() => {
    // Busca el token primero en localStorage, luego en sessionStorage.
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (storedToken) {
      fetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false); // Si no hay token, terminamos de cargar
    }
  }, [fetchUser]); // Ahora podemos incluir fetchUser sin warnings ni bucles infinitos
  
  const login = async (token, rememberMe) => {
    if (rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
    await fetchUser(); // Obtenemos los datos del usuario después de iniciar sesión
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
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);