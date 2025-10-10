import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Navbar from './components/Dashboard/Navbar';
import Footer from './components/Dashboard/Footer';
import Sidebar from './components/Dashboard/Sidebar';

import Inicio from './pages/Inicio';
import Login from './pages/Auth/Login';
import Registro from './pages/Auth/Registro';
import Administrador from './pages/Auth/Administrador';
import AdministradorPeluquero from './pages/Auth/AdministradorPeluquero';
import QuienesSomos from './pages/QuienesSomos';
import Catalogo from './pages/Catalogo';
import Turnos from './pages/Turnos';
import Perfil from './pages/Perfil';
import Panel from "./pages/Panel";
import './App.css';

// 🔹 Este componente maneja la lógica de rutas y cuándo mostrar el Sidebar
function AppContent() {
  const location = useLocation();

  const mostrarSidebar = location.pathname === "/"; // 👈 solo en Inicio

  return (
    <>
      <Navbar />
      <div className="app-container">
        {mostrarSidebar && <Sidebar />} {/* Sidebar solo en Inicio */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/panel" element={<Panel />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/administrador" element={<Administrador />} />
            <Route path="/administrador-peluquero" element={<AdministradorPeluquero />} />
            <Route path="/quienes-somos" element={<QuienesSomos />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/turnos" element={<Turnos />} />
            <Route path="/perfil" element={<Perfil />} />
          </Routes>
        </main>
      </div>
      <Footer />
    </>
  );
}

// 🔹 El componente principal solo envuelve AppContent dentro del Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
