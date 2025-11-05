import React, { useState, useEffect } from "react";
import "../styles/Inicio.css";
import Sidebar from "../components/Dashboard/Sidebar";
import Catalogo from "./Catalogo";
import QuienesSomos from "./QuienesSomos";
import Turnos from "./Turnos"; // Sección completa de turnos

const Inicio = ({ initialSection = "inicio" }) => {
  const [section, setSection] = useState(initialSection);
  const [proximoTurno, setProximoTurno] = useState(null);
  const [loadingTurno, setLoadingTurno] = useState(true);

  useEffect(() => {
    const fetchUltimoTurnoMock = async () => {
      setLoadingTurno(true);
      try {
        // Simulamos un retraso de 1 segundo como si viniera del backend
        await new Promise((res) => setTimeout(res, 1000));

        // Datos mock
        const mockData = [
          {
            id: 1,
            fecha_hora: "2025-11-10T15:30:00",
            peluquero: "Juan Pérez",
            estado: "Confirmado",
          },
        ];

        // Para probar "no hay turnos", usar: const mockData = [];
        if (mockData.length > 0) {
          setProximoTurno(mockData[0]);
        }
      } catch (err) {
        console.error("Error cargando el turno mock:", err);
      } finally {
        setLoadingTurno(false);
      }
    };

    fetchUltimoTurnoMock();
  }, []);

  return (
    <div className="inicio-layout">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar onSelect={setSection} />

      {/* Contenedor principal dinámico */}
      <div className="inicio-container">
        {section === "inicio" && (
          <>
            <h1 className="inicio-titulo">Bienvenido a BellezApp</h1>

            <div className="inicio-cards">
              {/* Card de promociones */}
              <div className="inicio-card promo-card">
                <h2>Promociones</h2>
                <p>Descuento Primera Visita – 10% OFF</p>
                <p>Corte Clásico – 10% OFF</p>
                <p>Descuento Estudiantes – 15% OFF</p>
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
                      <strong>Estado:</strong> {proximoTurno.estado}
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
      </div>
    </div>
  );
};

export default Inicio;
