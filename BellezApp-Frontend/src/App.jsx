// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useContext, useEffect } from "react";
import Navbar from "./components/layout/navbar/Navbar";
import Footer from "./components/layout/footer/Footer";
import Sidebar from "./components/Dashboard/Sidebar";
import SidebarAdmin from "./components/Dashboard/SidebarAdmin";
import { UserContext } from "./contexts/UserContext";

// Páginas públicas
import Home from "./pages/home/Home";
import QuienesSomos from "./pages/QuienesSomos";
import Catalogo from "./pages/Catalogo";

// Páginas de autenticación
import LoginCliente from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Páginas protegidas
import Inicio from "./pages/Inicio";
import Turnos from "./pages/turnos/Turnos";
import Perfil from "./pages/Perfil";
import Administrador from "./pages/auth/Administrador";
import AdministradorPeluquero from "./pages/auth/AdministradorPeluquero";

// Contexto y componentes de protección
import UserProvider from "./contexts/UserProvider";
import ProtectedRoute from "./components/auth/LoginCard/ProtectedRoute";

import "./App.css";

function AppContent() {
  const location = useLocation();
  const { user } = useContext(UserContext);

  // Mostrar sidebar SOLO en /inicio
  const mostrarSidebar = location.pathname === "/inicio";

  // Determinar si es admin
  const esAdmin = user?.rol === "admin";

  useEffect(() => {
    if (esAdmin) {
      document.body.classList.add("admin-mode");
      document.body.classList.remove("cliente-mode");
    } else {
      document.body.classList.add("cliente-mode");
      document.body.classList.remove("admin-mode");
    }

    // limpieza al desmontar
    return () => {
      document.body.classList.remove("admin-mode", "cliente-mode");
    };
  }, [esAdmin]);

  return (
    <div className="app-wrapper">
      <Navbar />

      <div className="app-container">
        {/* Sidebar condicional según rol */}
        {mostrarSidebar && (esAdmin ? <SidebarAdmin /> : <Sidebar />)}

        <main className={`main-content ${mostrarSidebar ? "with-sidebar" : ""}`}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login/usuarios" element={<LoginCliente />} />
            <Route path="/register" element={<Register />} />
            <Route path="/quienes-somos" element={<QuienesSomos />} />
            <Route path="/catalogo" element={<Catalogo />} />

            {/* Rutas protegidas */}
            <Route
              path="/inicio"
              element={
                <ProtectedRoute>
                  <Inicio />
                </ProtectedRoute>
              }
            />

            <Route
              path="/turnos"
              element={
                <ProtectedRoute>
                  <Turnos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Perfil />
                </ProtectedRoute>
              }
            />

            {/* Rutas exclusivas por rol */}
            <Route
              path="/administrador"
              element={
                <ProtectedRoute role="admin">
                  <Administrador />
                </ProtectedRoute>
              }
            />

            <Route
              path="/administrador-peluquero"
              element={
                <ProtectedRoute role="peluquero">
                  <AdministradorPeluquero />
                </ProtectedRoute>
              }
            />

            {/* Cualquier otra ruta redirige a home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}

export default App;
