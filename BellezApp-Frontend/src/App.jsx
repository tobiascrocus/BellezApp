// App.jsx

import { useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { UserProvider } from './context/UserContext.jsx'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import ProtectedRoute from './components/ProtectedRoute'
import Inicio from './pages/Inicio'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Administrador from './pages/Administrador'
import AdministradorPeluquero from './pages/AdministradorPeluquero'
import QuienesSomos from './pages/QuienesSomos'
import Catalogo from './pages/Catalogo'
import Turnos from './pages/Turnos'
import Perfil from './pages/Perfil'

import './App.css'

function AppWrapper() {
  const location = useLocation()
  const hideNavFooter = ['/login', '/registro'].includes(location.pathname)

  // Mueve la lógica de ScrollToTop aquí
  useLayoutEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [location.pathname]);

  return (
    <div className="app-wrapper">
      {!hideNavFooter && <Navbar />}
      <main className={`main-content ${!hideNavFooter ? 'with-navbar' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="page-transition-wrapper"
          >
            <Routes location={location}>
              {/* Rutas Públicas */}
              <Route path="/" element={<Inicio />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/quienes-somos" element={<QuienesSomos />} />
              <Route path="/catalogo" element={<Catalogo />} />

              {/* Rutas Protegidas para cualquier usuario logueado */}
              <Route element={<ProtectedRoute />}>
                <Route path="/turnos" element={<Turnos />} />
                <Route path="/perfil" element={<Perfil />} />
              </Route>

              {/* Rutas Protegidas por Rol */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/administrador" element={<Administrador />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['admin', 'peluquero']} />}>
                <Route path="/administrador-peluquero" element={<AdministradorPeluquero />} />
              </Route>
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      {!hideNavFooter && <Footer />}
    </div>
  )
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AppWrapper />
      </Router>
    </UserProvider>
  )
}

export default App