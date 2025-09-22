import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

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
      <nav className="navbar">
        <div className="nombreEmpresa">
          <Link
            to="/"
            className="logoLink"
            onClick={() => setMenuOpen(false)}
          >
            <img
              src="/assets/images/Logos/logoBellezApp.png"
              alt="Logo BellezApp"
              className="logo"
            />
            BellezApp
          </Link>
        </div>

        <ul className={`navButtons ${menuOpen ? "open" : ""}`}>
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
          className={`hamburger ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
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