import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Inicio from './pages/Inicio';
import Administrador from './pages/Administrador';
import AdministradorPeluquero from './pages/AdministradorPeluquero';
import QuienesSomos from './pages/QuienesSomos';
import Catalogo from './pages/Catalogo';
import Turnos from './pages/Turnos';
import Perfil from './pages/Perfil';

import LoginCliente from "./pages/LoginCliente";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import './App.css';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="app-container">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/login/usuarios" element={<LoginCliente />} />
            <Route path="/register" element={<Register />} />

            {/* 👇 Un único dashboard para todos los roles */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Paneles accesibles solo con botón según rol */}
            <Route path="/administrador" element={<Administrador />} />
            <Route path="/administrador-peluquero" element={<AdministradorPeluquero />} />

            <Route path="/quienes-somos" element={<QuienesSomos />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/turnos" element={<Turnos />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="*" element={<Navigate to="/login/usuarios" replace />} />
          </Routes>
        </main>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
