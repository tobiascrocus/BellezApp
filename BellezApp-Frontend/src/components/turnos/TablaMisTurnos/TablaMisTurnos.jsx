// src/components/turnos/TablaMisTurnos/TablaMisTurnos.jsx

import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../../contexts/UserContext";
import "../../../styles/turnos/TablaMisTurnos/TablaMisTurnos.css";

const TablaMisTurnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const cargarTurnos = () => {
      try {
        setError(null);
        
        if (!user?.id) {
          setError("Debes iniciar sesión para ver tus turnos");
          setTurnos([]);
          return;
        }
        
        // Obtener turnos desde window.turnosDB
        const turnosUsuario = window.turnosDB?.[user.id] || [];
        
        // Ordenar por fecha más reciente primero
        const turnosOrdenados = [...turnosUsuario].sort((a, b) => 
          new Date(b.fecha_hora) - new Date(a.fecha_hora)
        );
        
        setTurnos(turnosOrdenados);
      } catch (err) {
        console.error('Error cargando turnos:', err);
        setError(err.message);
        setTurnos([]);
      }
    };

    cargarTurnos();
  }, [user]);

  const handleCancelar = (id) => {
    if (!window.confirm("¿Estás seguro de que querés cancelar este turno?")) {
      return;
    }

    try {
      // Buscar y cancelar turno en window.turnosDB
      if (window.turnosDB?.[user.id]) {
        const turnoIndex = window.turnosDB[user.id].findIndex(t => t.id === id);
        if (turnoIndex !== -1) {
          window.turnosDB[user.id][turnoIndex].estado = "cancelado";
          
          // Actualizar estado local
          setTurnos(turnos.map(t => 
            t.id === id ? { ...t, estado: "cancelado" } : t
          ));
          
          alert("Turno cancelado correctamente");
        } else {
          throw new Error("Turno no encontrado");
        }
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const turnosActivos = turnos.filter(t => t.estado !== "cancelado");

  if (error) {
    return (
      <div className="tabla-turnos">
        <h2>Mis turnos</h2>
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="tabla-turnos">
      <h2>Mis turnos</h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Peluquero</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {turnosActivos.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No tenés turnos reservados
                </td>
              </tr>
            ) : (
              turnosActivos.map((t) => (
                <tr key={t.id}>
                  <td>{t.servicio}</td>
                  <td>{new Date(t.fecha_hora).toLocaleDateString('es-AR')}</td>
                  <td>{new Date(t.fecha_hora).toLocaleTimeString('es-AR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</td>
                  <td>{t.peluquero}</td>
                  <td>
                    <span className={`estado ${t.estado}`}>
                      {t.estado}
                    </span>
                  </td>
                  <td>
                    {t.estado !== "cancelado" && (
                      <button 
                        className="btn-cancelar btn-sm" 
                        onClick={() => handleCancelar(t.id)}
                        aria-label={`Cancelar turno del ${new Date(t.fecha_hora).toLocaleDateString()}`}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaMisTurnos;