import { NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../styles/Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark px-4">
      <NavLink to="/" className="navbar-brand">
        BellezApp
      </NavLink>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item">
            <NavLink to="/" className="nav-link">
              Home
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/login/usuarios" className="nav-link">
              Iniciar sesión
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/register" className="nav-link">
              Registrarse
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/catalogo" className="nav-link">
              Catálogo
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/quienes-somos" className="nav-link">
              ¿Quiénes somos?
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
