import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../styles/Navbar.css";

const Navbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [usuario, setUsuario] = useState(null);

  // Token simulado
  const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiIyQGhvdG1haWwuY29tIiwicm9sIjoiY2xpZW50ZSIsImlhdCI6MTc2MjgwMDUxOSwiZXhwIjoxNzYyODI5MzE5fQ.4rz05UuDJy1H67Vnm2e4y8n_DQd4hJRqcXnqZO8h9q8";

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const res = await fetch("http://localhost:3000/me", {
          headers: { Authorization: `Bearer ${TOKEN}` },
        });
        if (!res.ok) throw new Error("No se pudo obtener usuario");
        const data = await res.json();
        setUsuario(data);
      } catch (err) {
        console.error(err);
        setUsuario(null);
      }
    };
    fetchUsuario();
  }, []);

  const botones = [
    { nombre: "Administrador", ruta: "/administrador" },
    { nombre: "Administrador Peluqueros", ruta: "/administrador-peluquero" },
    { nombre: "Inicio", ruta: "/" },
    {
      nombre: usuario ? `Perfil (${usuario.nombre})` : "Perfil",
      ruta: "/perfil",
    },
  ];

  return (
    <header>
      <nav className="navbar-main">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo-link" onClick={() => setMenuOpen(false)}>
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
