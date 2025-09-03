import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Inicio from './pages/Inicio';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Administrador from './pages/Administrador';
import AdministradorPeluquero from './pages/AdministradorPeluquero';
import QuienesSomos from './pages/QuienesSomos';
import Catalogo from './pages/Catalogo';
import Turnos from './pages/Turnos';
import Perfil from './pages/Perfil';

import './App.css';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="app-container">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Inicio />} />
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
    </Router>
  );
}

export default App;