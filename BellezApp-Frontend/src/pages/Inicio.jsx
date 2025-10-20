// src/pages/Inicio.jsx

import React, { useEffect, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import ControlPanel from "../components/ControlPanel/ControlPanel";
import "../styles/Inicio.css";

const Inicio = () => {
  const { user } = useContext(UserContext);
  const esAdmin = user?.rol === "admin";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Vista para ADMIN
  if (esAdmin) {
    return (
      <div className="inicio-container">
        <h1 className="inicio-titulo">Panel de Administración</h1>
        <ControlPanel />
      </div>
    );
  }

  // Vista para CLIENTES/PELUQUEROS
  return (
    <div className="inicio-container">
      <h1 className="inicio-titulo">Bienvenido a BellezApp</h1>

      <div className="inicio-cards">
        <div className="inicio-card promo-card">
          <h2>Promociones</h2>
          <p>Descuento Primera Visita – 10% OFF</p>
          <p>Corte Clásico – 10% OFF</p>
          <p>Descuento Estudiantes – 15% OFF</p>
        </div>

        <div className="inicio-card turnos-card">
          <h2>Tu próximo turno</h2>
          <p>Aún no tenés un turno reservado.</p>
        </div>
      </div>
    </div>
  );
};

export default Inicio;