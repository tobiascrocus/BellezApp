// Navbar.jsx

import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import "../styles/Navbar.css";

const NAV_BUTTONS = [
  // El rol `null` es para usuarios no logueados
  { nombre: "Inicio", ruta: "/", roles: ["admin", "peluquero", "cliente", null] },
  { nombre: "Quienes Somos", ruta: "/quienes-somos", roles: ["admin", "peluquero", "cliente", null] },
  { nombre: "Catálogo", ruta: "/catalogo", roles: ["admin", "peluquero", "cliente", null] },
  { nombre: "Turnos", ruta: "/turnos", roles: ["cliente", "admin", "peluquero"] },
  { nombre: "Admin Turnos", ruta: "/administrador-peluquero", roles: ["peluquero", "admin"] },
  { nombre: "Administrador", ruta: "/administrador", roles: ["admin"] },
  { nombre: "Iniciar Sesión", ruta: "/login", roles: [null], isLogin: true }, // Botón de login para no logueados
  { nombre: "Registro", ruta: "/registro", roles: [null], isRegister: true }, // Botón de registro para no logueados
]

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, loading } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navbarRef = useRef(null)

  // Filtra los botones visibles según el rol del usuario.
  const visibleButtons = NAV_BUTTONS.filter((btn) => btn.roles.includes(user ? user.rol : null));

  const closeMenus = () => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
    closeMenus()
  }

  const handlePerfil = () => {
    navigate("/perfil")
    closeMenus()
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navbarRef.current && !navbarRef.current.contains(e.target)) closeMenus()
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header>
      <nav className="navbar-main" ref={navbarRef}>
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo-link" onClick={closeMenus}>
            <img src="/assets/images/Logos/logoBellezApp.png" alt="Logo BellezApp" className="navbar-logo" />
            BellezApp
          </Link>
        </div>

        <div className="navbar-right">
          <ul className="navbar-buttons">
            {visibleButtons.map(btn => (
              <li key={btn.ruta} className={btn.isLogin ? 'navbar-login-item' : (btn.isRegister ? 'navbar-register-item' : '')}>
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

          {!loading && (
            user ? (
              <div className="navbar-user">
                <div className="user-trigger" onClick={() => setUserMenuOpen(prev => !prev)}>
                  <span className="user-name">{user.nombre}</span>
                  <img src={user.avatar} alt="avatar" className="user-avatar" />
                </div>
                {userMenuOpen && (
                  <div className="user-dropdown show">
                    <button onClick={handlePerfil}>Perfil</button>
                    <button onClick={handleLogout} className="logout">
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Este espacio ahora se maneja con el botón de Iniciar Sesión en NAV_BUTTONS
              // para mantener la consistencia. Dejamos el contenedor para mantener la estructura.
              null
            )
          )}
        </div>

        {!loading && (
          user ? (
            <div
              className={`navbar-user-trigger mobile ${menuOpen ? "active" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === "Enter" && setMenuOpen(!menuOpen)}
            >
              <span className="user-name">{user.nombre}</span>
              <img src={user.avatar} alt="avatar" className="user-avatar" />
            </div>
          ) : ( // Botón de hamburguesa para usuarios no logueados
            <div
              className={`navbar-hamburger ${menuOpen ? "active" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === "Enter" && setMenuOpen(!menuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) 
        )}

        {/* Menú móvil para usuario LOGUEADO */}
        {user && menuOpen && (
          <ul className={`navbar-menu ${menuOpen ? "open" : ""}`}>
            <li className="menu-user-info" onClick={handlePerfil}>
              <img src={user.avatar} alt="avatar" className="menu-avatar" />
              <span className="menu-username">{user.nombre}</span>
            </li>
            <hr className="menu-divider" />

            {visibleButtons.map(btn => (
              <li key={btn.ruta}>
                <Link
                  to={btn.ruta}
                  className={location.pathname === btn.ruta ? "active" : ""}
                  onClick={() => setMenuOpen(false)}
                >
                  {btn.nombre}
                </Link>
              </li>
            ))}

            <hr className="menu-divider" />
            <li>
              <button className="menu-button logout" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </li>
          </ul>
        )}

        {/* Menú móvil para usuario NO LOGUEADO */}
        {!user && menuOpen && (
          <ul className={`navbar-menu ${menuOpen ? "open" : ""}`}>
            {visibleButtons.map(btn => (
              <li key={btn.ruta}>
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
        )}
      </nav>
    </header>
  )
}

export default Navbar