// src/components/turnos/FormularioTurno.jsx

import React, { useState, useEffect, useContext } from "react";
import CalendarioDosSemanas from "./CalendarioDosSemanas";
import ButtonCustom from "../common/ButtonCustom";
import { UserContext } from "../../contexts/UserContext";
import "../../styles/turnos/FormularioTurno.css";

// CONSTANTES LOCALES
const PELUQUEROS = [
  { id: 1, nombre: "Juan", apellido: "Pérez", especialidad: "Cortes clásicos" },
  { id: 2, nombre: "Carlos", apellido: "Gómez", especialidad: "Barbas y diseños" },
  { id: 3, nombre: "María", apellido: "López", especialidad: "Cortes modernos" },
  { id: 4, nombre: "Ana", apellido: "Rodríguez", especialidad: "Coloración" }
];

const SERVICIOS = [
  "Corte clásico",
  "Fade",
  "Degradado",
  "Corte con tijera",
  "Corte con máquina",
  "Afeitado clásico",
  "Perfilado de barba",
  "Arreglo de barba",
  "Corte niño",
  "Diseños"
];

const HORARIOS_DISPONIBLES = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
];

// Base de datos de turnos (compartida entre componentes)
if (!window.turnosDB) {
  window.turnosDB = {
    1: [ 
      { 
        id: 1, 
        servicio: "Corte clásico", 
        fecha_hora: "2025-01-15 10:00:00", 
        peluquero: "Juan Pérez",
        estado: "confirmado"
      }
    ],
    2: [],
    3: []
  };
}

const FormularioTurno = ({ onTurnoReservado }) => {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [servicio, setServicio] = useState("");
  const [peluquero, setPeluquero] = useState("");
  const [disponibilidadDias, setDisponibilidadDias] = useState({});
  const [fechasDisponibles, setFechasDisponibles] = useState([]);

  const { user } = useContext(UserContext);

  // Calcular disponibilidad de días
  const calcularDisponibilidad = () => {
    const hoy = new Date();
    const disponibilidad = {};
    
    for (let i = 0; i < 14; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const fechaISO = fecha.toISOString().split('T')[0];
      const diaSemana = fecha.getDay();
      
      // Fin de semana
      if (diaSemana === 0 || diaSemana === 6) {
        disponibilidad[fechaISO] = "full";
        continue;
      }
      
      // Asignar disponibilidad aleatoria
      const random = Math.random();
      if (random < 0.5) {
        disponibilidad[fechaISO] = "free";
      } else if (random < 0.8) {
        disponibilidad[fechaISO] = "half";
      } else {
        disponibilidad[fechaISO] = "full";
      }
    }
    
    return disponibilidad;
  };

  // Cargar disponibilidad al montar
  useEffect(() => {
    const disponibilidad = calcularDisponibilidad();
    setDisponibilidadDias(disponibilidad);
    
    const fechas = generarFechasDisponibles(disponibilidad);
    setFechasDisponibles(fechas);
  }, []);

  const generarFechasDisponibles = (disponibilidad) => {
    const fechas = [];
    const hoy = new Date();
    
    for (let i = 0; i < 14; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const fechaISO = fecha.toISOString().split('T')[0];
      const diaSemana = fecha.getDay();
      
      if (diaSemana !== 0 && diaSemana !== 6) {
        const estadoDia = disponibilidad[fechaISO] || "free";
        if (estadoDia !== "full") {
          fechas.push({
            fechaISO: fechaISO,
            fechaFormateada: formatearFecha(fecha),
            estado: estadoDia
          });
        }
      }
    }
    
    return fechas;
  };

  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const obtenerTextoDisponibilidad = (estado) => {
    switch (estado) {
      case "free": return " - Disponible";
      case "half": return " - Pocos turnos";
      default: return "";
    }
  };

  const handleReservar = () => {
    if (!fecha || !hora || !servicio || !peluquero) {
      alert("Completá todos los campos.");
      return;
    }

    if (!user?.id) {
      alert("Debes iniciar sesión para reservar turnos");
      return;
    }

    const fechaObj = new Date(fecha);
    const diaSemana = fechaObj.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      alert("No se pueden reservar turnos los fines de semana.");
      return;
    }

    const estadoDia = disponibilidadDias[fecha];
    if (estadoDia === "full") {
      alert("Este día está completamente ocupado. Por favor elegí otra fecha.");
      return;
    }

    // Buscar peluquero
    const peluqueroData = PELUQUEROS.find(p => p.id === parseInt(peluquero));
    if (!peluqueroData) {
      alert("Peluquero no encontrado");
      return;
    }

    // Crear turno
    const nuevoTurno = {
      id: Date.now(),
      servicio: servicio,
      fecha_hora: `${fecha} ${hora}:00`,
      peluquero: `${peluqueroData.nombre} ${peluqueroData.apellido}`,
      estado: "confirmado"
    };

    // Guardar en window.turnosDB
    if (!window.turnosDB[user.id]) {
      window.turnosDB[user.id] = [];
    }
    window.turnosDB[user.id].unshift(nuevoTurno);

    alert("¡Turno reservado correctamente! Ya podés verlo en 'Mis turnos'.");
    
    // Limpiar formulario
    setFecha("");
    setHora("");
    setServicio("");
    setPeluquero("");
    
    // Notificar al padre
    if (onTurnoReservado) {
      onTurnoReservado();
    }
  };

  const obtenerFechaInicio = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="formulario-turno container-fluid">
      <div className="formulario-left">
        <div className="campos-formulario">
          <select 
            className="form-select" 
            value={fecha} 
            onChange={(e) => setFecha(e.target.value)}
            aria-label="Seleccionar fecha"
          >
            <option value="">Elegí una fecha</option>
            {fechasDisponibles.map((fechaObj) => (
              <option key={fechaObj.fechaISO} value={fechaObj.fechaISO}>
                {fechaObj.fechaFormateada}{obtenerTextoDisponibilidad(fechaObj.estado)}
              </option>
            ))}
          </select>

          <select 
            className="form-select" 
            value={hora} 
            onChange={(e) => setHora(e.target.value)}
            aria-label="Seleccionar horario"
            disabled={!fecha}
          >
            <option value="">Elegí un horario</option>
            {HORARIOS_DISPONIBLES.map((horario) => (
              <option key={horario} value={horario}>
                {horario} hs
              </option>
            ))}
          </select>

          <select 
            className="form-select" 
            value={servicio} 
            onChange={(e) => setServicio(e.target.value)}
            aria-label="Seleccionar servicio"
            disabled={!fecha || !hora}
          >
            <option value="">Elegí el servicio</option>
            {SERVICIOS.map((serv) => (
              <option key={serv} value={serv}>
                {serv}
              </option>
            ))}
          </select>

          <select 
            className="form-select" 
            value={peluquero} 
            onChange={(e) => setPeluquero(e.target.value)}
            aria-label="Seleccionar peluquero"
            disabled={!fecha || !hora || !servicio}
          >
            <option value="">Elegí tu barbero</option>
            {PELUQUEROS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.apellido} - {p.especialidad}
              </option>
            ))}
          </select>
        </div>

        <div className="btn-reservar-container">
          <ButtonCustom 
            variant="primary" 
            onClick={handleReservar}
            disabled={!fecha || !hora || !servicio || !peluquero}
            className="btn-reservar"
          >
            Reservá tu turno
          </ButtonCustom>
        </div>
      </div>

      <div className="formulario-right">
        <CalendarioDosSemanas 
          startDate={obtenerFechaInicio()}
          daysStatus={disponibilidadDias}
          highlightedDate={fecha}
        />
        
        <div className="leyenda-calendario">
          <h4>Disponibilidad:</h4>
          <div className="leyenda-items">
            <div className="leyenda-item">
              <span className="color-muestra libre"></span>
              <span>Libre</span>
            </div>
            <div className="leyenda-item">
              <span className="color-muestra medio-lleno"></span>
              <span>Pocos turnos</span>
            </div>
            <div className="leyenda-item">
              <span className="color-muestra lleno"></span>
              <span>Completo</span>
            </div>
            <div className="leyenda-item">
              <span className="color-muestra fin-semana"></span>
              <span>Fin de semana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioTurno;

