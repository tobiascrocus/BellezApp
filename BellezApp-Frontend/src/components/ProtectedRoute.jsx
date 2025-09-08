import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login/usuarios" replace />;
  }

  // si pasas un role (ej: "admin") validar:
  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
