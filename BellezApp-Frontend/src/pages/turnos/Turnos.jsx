// Turnos.jsx

import React, { useState } from "react";
import FormularioTurno from "../../components/turnos/FormularioTurno";
import TablaMisTurnos from "../../components/turnos/TablaMisTurnos";
import "../../styles/turnos/Turnos.css";

const Turnos = () => {
  const [turnosActualizados, setTurnosActualizados] = useState(0);

  const handleTurnoReservado = () => {
    setTurnosActualizados(prev => prev + 1);
  };

  return (
    <>
      <div className="turnos-page">
        <div className="turnos-card-container">
          <FormularioTurno onTurnoReservado={handleTurnoReservado} />
        </div>

        <div className="turnos-card-container">
          <TablaMisTurnos key={turnosActualizados} />
        </div>
      </div>
    </>
  );
};

export default Turnos;
