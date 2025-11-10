import React, { useState, useEffect, useCallback } from "react";
import "../styles/Inicio.css";
import Sidebar from "../components/Dashboard/Sidebar";
import Promociones from "./Promociones";
import Catalogo from "./Catalogo";
import QuienesSomos from "./QuienesSomos";
import Turnos from "./Turnos"; // Sección completa de turnos

const API_URL = "http://localhost:3000";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiIyQGhvdG1haWwuY29tIiwicm9sIjoiY2xpZW50ZSIsImlhdCI6MTc2MjgwMDUxOSwiZXhwIjoxNzYyODI5MzE5fQ.4rz05UuDJy1H67Vnm2e4y8n_DQd4hJRqcXnqZO8h9q8";

// Datos iniciales de promociones, ahora en el estado.
const initialPromos = [
  "Descuento Primera Visita – 10% OFF",
  "Corte Clásico – 10% OFF",
  "Descuento Estudiantes – 15% OFF",
];

const Inicio = ({ initialSection = "inicio" }) => {
  const [section, setSection] = useState(initialSection);
  const [proximoTurno, setProximoTurno] = useState(null);
  const [loadingTurno, setLoadingTurno] = useState(true);
  const [promociones, setPromociones] = useState(initialPromos);

  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        ...options.headers,
      },
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `Error en la petición: ${res.statusText}`);
    }
    return res.json();
  }, []);

  useEffect(() => {
    const fetchProximoTurno = async () => {
      setLoadingTurno(true);
      setProximoTurno(null);
      try {
        const todosLosTurnos = await apiFetch('/turnos?limit=100'); // Pedimos una cantidad grande para asegurar que traemos todos
        
        const ahora = new Date();
        
        const proximo = todosLosTurnos
          .filter(turno => 
            turno.estado.toLowerCase() === 'confirmado' && new Date(turno.fecha_hora) > ahora
          )
          .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))[0]; // Ordenamos y tomamos el primero

        if (proximo) {
          setProximoTurno(proximo);
        }
      } catch (err) {
        console.error("Error cargando el próximo turno:", err);
      } finally {
        setLoadingTurno(false);
      }
    };
    fetchProximoTurno();
  }, [apiFetch]);

  return (
    <div className="inicio-layout">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar onSelect={setSection} />

      {/* Contenedor principal dinámico */}
      <div
        className={`inicio-container ${
          section === "catalogo" || section === "quienes"
            ? "no-padding-top"
            : ""
        }`}
      >
        {section === "inicio" && (
          <>
            <h1 className="inicio-titulo">Bienvenido a BellezApp</h1>

            <div className="inicio-cards">
              {/* Card de promociones */}
              <div className="inicio-card promo-card">
                <h2>Promociones</h2>
                {promociones.map((promo, index) => (
                  <p key={index}>{promo}</p>
                ))}
              </div>

              {/* Card de turnos */}
              <div className="inicio-card turnos-card">
                <h2>Tu próximo turno</h2>
                {loadingTurno ? (
                  <p>Cargando turno...</p>
                ) : proximoTurno ? (
                  <div className="turno-info">
                    <p>
                      <strong>Fecha:</strong>{" "}
                      {new Date(proximoTurno.fecha_hora).toLocaleString()}
                    </p>
                    <p>
                      <strong>Peluquero:</strong> {proximoTurno.peluquero}
                    </p>
                    <p>
                      <strong>Estado:</strong> <span style={{textTransform: 'capitalize'}}>{proximoTurno.estado}</span>
                    </p>
                  </div>
                ) : (
                  <div className="no-turno">
                    <p>No tienes turnos reservados.</p>
                    <button
                      className="btn-reservar-turno"
                      onClick={() => setSection("turnos")}
                    >
                      Reservar turno
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {section === "catalogo" && <Catalogo />}
        {section === "quienes" && <QuienesSomos />}
        {section === "turnos" && <Turnos />}
        {section === "promos" && (
          <Promociones promos={promociones} onSave={setPromociones} />
        )}
      </div>
    </div>
  );
};

export default Inicio;
