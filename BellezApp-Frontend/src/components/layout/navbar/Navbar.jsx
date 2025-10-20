// src/components/layout/navbar/Navbar.jsx

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../../../contexts/UserContext";
import "../../../styles/layout/navbar/Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Usar el contexto de usuario real
  const { user, logout } = useContext(UserContext); // CAMBIO: usar logout del contexto

  const handleLogout = () => {
    // Llamar a la función logout del contexto
    if (logout) {
      logout();
    } else {
      console.error('logout no está disponible en el contexto');
    }
    setMenuOpen(false);
    navigate("/"); // Redirigir a Home (página pública)
  };

  // Construir los botones dinámicamente según el estado de autenticación
  const getBotones = () => {
    const botones = [];

    // Botones solo para usuarios logueados
    if (user) {
      // Botones según rol
      if (user.role === "admin") {
        botones.push({ nombre: "Administrador", ruta: "/administrador" });
      }
      if (user.role === "peluquero") {
        botones.push({ nombre: "Admin Peluqueros", ruta: "/administrador-peluquero" });
      }

      // Botones comunes para logueados
      botones.push(
        { nombre: "Inicio", ruta: "/inicio" },
        { nombre: "Turnos", ruta: "/turnos" },
        { nombre: user.nombre ? `Perfil (${user.nombre})` : "Perfil", ruta: "/perfil" }
      );
    } else {
      // Botones para usuarios NO logueados
      botones.push(
        { nombre: "Home", ruta: "/" },
        { nombre: "Iniciar sesión", ruta: "/login/usuarios" },
        { nombre: "Registrarse", ruta: "/register" }
      );
    }

    // Botones públicos (siempre visibles)
    botones.push(
      { nombre: "Catálogo", ruta: "/catalogo" },
      { nombre: "Quiénes Somos", ruta: "/quienes-somos" }
    );

    return botones;
  };

  const botones = getBotones();

  return (
    <header>
      <nav className="navbar-main">
        <div className="navbar-brand">
          <Link
            to="/"
            className="navbar-logo-link"
            onClick={() => setMenuOpen(false)}
          >
            <img
              src="/assets/images/Logos/logoBellezApp.png"
              alt="Logo BellezApp"
              className="navbar-logo"
            />
            BellezApp
          </Link>
        </div>

        <ul className={`navbar-buttons ${menuOpen ? "open" : ""}`}>
          {botones.map((btn, index) => (
            <li key={index}>
              <Link
                to={btn.ruta}
                className={location.pathname === btn.ruta ? "active" : ""}
                onClick={() => setMenuOpen(false)}
              >
                {btn.nombre}
              </Link>
            </li>
          ))}
          
          {/* Botón de cerrar sesión si hay usuario logueado */}
          {user && (
            <li>
              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </li>
          )}
        </ul>

        <div
          className={`navbar-hamburger ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </nav>
    </header>
  );
}