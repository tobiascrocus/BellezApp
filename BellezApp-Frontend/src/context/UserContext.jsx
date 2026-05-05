import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
 
  // Memoriza logout para mantener una dependencia estable
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
  }, []);

  // Evita disparos innecesarios de useEffect mediante useCallback
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
    // Busca el token en ambos almacenamientos para persistir la sesión
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (storedToken) {
      fetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchUser]);
  
  const login = async (token, rememberMe) => {
    if (rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
    await fetchUser();
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