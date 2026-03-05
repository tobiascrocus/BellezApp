// src/components/ProtectedRoute.jsx

import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/**
 * Componente para proteger rutas basado en la autenticación y roles de usuario.
 * @param {object} props
 * @param {string[]} [props.allowedRoles] - Array de roles permitidos para acceder a la ruta. Si no se provee, solo requiere autenticación.
 * @param {string} [props.redirectPath='/login'] - Ruta a la que se redirige si el acceso es denegado.
 */
const ProtectedRoute = ({ allowedRoles, redirectPath = '/login' }) => {
  const { user, loading } = useUser();

  if (loading) {
    // Muestra un loader mientras se verifica el estado del usuario para evitar parpadeos
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
  }

  if (!user) {
    // Si no hay usuario, redirige a la página de login
    return <Navigate to={redirectPath} replace />;
  }

  // Si la ruta requiere roles específicos y el rol del usuario no está incluido, redirige
  return allowedRoles && !allowedRoles.includes(user.rol) ? <Navigate to="/" replace /> : <Outlet />;
};

export default ProtectedRoute;