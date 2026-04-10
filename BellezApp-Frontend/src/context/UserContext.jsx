import { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE } from '../config';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
 
  // Función para obtener los datos del usuario desde el backend usando el token
  const fetchUser = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.ok) {
        setUser(data.data); // Guardamos el objeto de usuario completo
      } else {
        logout(); // Si el token es inválido, cerramos sesión
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      logout();
    }
  };

  useEffect(() => {
    // Busca el token primero en localStorage, luego en sessionStorage.
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (storedToken) {
      fetchUser(storedToken).finally(() => setLoading(false));
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
    await fetchUser(token); // Obtenemos los datos del usuario después de iniciar sesión
  };

  const logout = () => {
    localStorage.removeItem('token'); // Limpiamos ambos almacenamientos
    sessionStorage.removeItem('token');
    setUser(null);
    // Opcional: redirigir al login
    // window.location.href = '/login';
  };

  const updateUser = async () => {
    // Corrección: Buscar el token en ambos almacenamientos.
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      await fetchUser(token);
    }
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