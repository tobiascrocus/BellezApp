import React, { useEffect } from "react";
import "../styles/Inicio.css";

const Inicio = () => {
  useEffect(() => {
    document.body.style.overflow = "hidden"; // bloquea scroll solo en Inicio
    return () => {
      document.body.style.overflow = "auto"; // lo restaura al salir
    };
  }, []);

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