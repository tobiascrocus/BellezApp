// ProtectedRoute.jsx

import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../../../contexts/UserContext";

export default function ProtectedRoute({ children, role }) {
  const { user } = useContext(UserContext);

  if (!user) {
    return <Navigate to="/login/usuarios" replace />;
  }

  if (role && user?.rol !== role) { 
    return <Navigate to="/" replace />;
  }

  return children;
}

