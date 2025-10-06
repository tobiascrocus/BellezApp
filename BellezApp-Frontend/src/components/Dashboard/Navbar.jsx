import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import '../../styles/Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const botones = [
    { nombre: "Administrador", ruta: "/administrador" },
    { nombre: "Administrador Peluqueros", ruta: "/administrador-peluquero" },
    { nombre: "Inicio", ruta: "/" },
    { nombre: "Quienes Somos", ruta: "/quienes-somos" },
    { nombre: "Catálogo", ruta: "/catalogo" },
    { nombre: "Turnos", ruta: "/turnos" },
    { nombre: "Perfil", ruta: "/perfil" },
  ];

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
};

export default Navbar;