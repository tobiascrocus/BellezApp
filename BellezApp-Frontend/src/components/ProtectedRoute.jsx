import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const ProtectedRoute = ({ allowedRoles, redirectPath = '/login' }) => {
  const { user, loading } = useUser();

  if (loading) {
    // Evita parpadeos visuales durante la verificación de autenticación
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  return allowedRoles && !allowedRoles.includes(user.rol) ? <Navigate to="/" replace /> : <Outlet />;
};

export default ProtectedRoute;