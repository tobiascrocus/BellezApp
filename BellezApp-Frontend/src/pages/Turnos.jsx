import React, { useState, useEffect, useCallback } from "react";
import "../styles/Turnos.css";

const API_URL = "http://localhost:3000";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiIyQGhvdG1haWwuY29tIiwicm9sIjoiY2xpZW50ZSIsImlhdCI6MTc2MjgwMDUxOSwiZXhwIjoxNzYyODI5MzE5fQ.4rz05UuDJy1H67Vnm2e4y8n_DQd4hJRqcXnqZO8h9q8";

const Turnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para el formulario de nuevo turno
  const [showForm, setShowForm] = useState(false);
  const [peluqueros, setPeluqueros] = useState([]);
  const [selectedPeluquero, setSelectedPeluquero] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availability, setAvailability] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

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

  const fetchTurnos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/turnos");
      setTurnos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchTurnos();
  }, [fetchTurnos]);

  const fetchPeluqueros = useCallback(async () => {
    try {
      const data = await apiFetch("/peluqueros");
      setPeluqueros(data);
    } catch (err) {
      setError("No se pudieron cargar los peluqueros.");
    }
  }, [apiFetch]);

  useEffect(() => {
    if (showForm) {
      fetchPeluqueros();
    }
  }, [showForm, fetchPeluqueros]);
  
  useEffect(() => {
    if (selectedPeluquero && selectedDate) {
      const fetchAvailability = async () => {
        setLoadingAvailability(true);
        setAvailability([]);
        setSelectedSlot(null);
        try {
          const data = await apiFetch(`/disponibilidad/${selectedPeluquero}/${selectedDate}`);
          setAvailability(data.filter(slot => slot.disponible));
        } catch (err) {
          setError("Error al cargar la disponibilidad.");
        } finally {
          setLoadingAvailability(false);
        }
      };
      fetchAvailability();
    }
  }, [selectedPeluquero, selectedDate, apiFetch]);

  const handleCancelTurno = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres cancelar este turno?")) {
      try {
        const data = await apiFetch(`/turnos/${id}/cancelar`, { method: "POST" });
        setTurnos(prevTurnos =>
          prevTurnos.map(t =>
            t.id === id ? { ...t, estado: data.turno.estado } : t
          )
        );
        alert(data.mensaje);
      } catch (err) {
        alert(`Error al cancelar: ${err.message}`);
      }
    }
  };

  const handleReservarTurno = async (e) => {
    e.preventDefault();
    if (!selectedPeluquero || !selectedSlot) {
      alert("Por favor, selecciona un peluquero y un horario.");
      return;
    }

    const body = {
      peluquero_id: parseInt(selectedPeluquero),
      fecha_hora: selectedSlot.fecha_hora,
    };

    try {
      const nuevoTurno = await apiFetch("/turnos", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Para mostrar el nombre del peluquero, lo buscamos en la lista que ya tenemos
      const peluqueroInfo = peluqueros.find(p => p.id === nuevoTurno.peluquero_id);
      const turnoCompleto = {
        ...nuevoTurno,
        peluquero: `${peluqueroInfo.nombre} ${peluqueroInfo.apellido}`,
      };

      setTurnos(prevTurnos => [...prevTurnos, turnoCompleto]);
      alert("Turno reservado exitosamente.");
      setShowForm(false);
      // Limpiar formulario
      setSelectedPeluquero("");
      setSelectedDate("");
      setSelectedSlot(null);
      setAvailability([]);
    } catch (err) {
      alert(`Error al reservar: ${err.message}`);
    }
  };

  return (
    <div className="turnos-wrapper">
      <section className="turnos-container">
        <div className="turnos-header">
          <h1>Mis Turnos</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-nuevo-turno" >
            {showForm ? "Cerrar Formulario" : "Solicitar Nuevo Turno"}
          </button>
        </div>

        {showForm && (
          <div className="nuevo-turno-form">
            <h2>Reservar un nuevo turno</h2>
            <form onSubmit={handleReservarTurno}>
              <div className="form-group">
                <label>Peluquero:</label>
                <select value={selectedPeluquero} onChange={(e) => { setSelectedPeluquero(e.target.value); setSelectedSlot(null); }} required>
                  <option value="">Selecciona un peluquero</option>
                  {peluqueros.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Fecha:</label>
                <input type="date" value={selectedDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setSelectedDate(e.target.value)} required />
              </div>
              {loadingAvailability && <p>Cargando horarios...</p>}
              {availability.length > 0 && (
                <div className="form-group">
                  <label>Horarios Disponibles:</label>
                  <div className="availability-grid">
                    {availability.map(slot => (
                      <button type="button" key={slot.fecha_hora} onClick={() => setSelectedSlot(slot)} className={`slot-btn ${selectedSlot?.fecha_hora === slot.fecha_hora ? 'selected' : ''}`}>
                        {new Date(slot.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!loadingAvailability && selectedDate && selectedPeluquero && availability.length === 0 && (
                <p>No hay horarios disponibles para la fecha seleccionada.</p>
              )}
              <button type="submit" className="btn-confirmar-reserva" disabled={!selectedSlot}>
                Confirmar Reserva
              </button>
            </form>
          </div>
        )}

        {loading && <p>Cargando turnos...</p>}
        {error && <p className="error-msg">{error}</p>}
        {!loading && !error && turnos.length === 0 && !showForm && <p>No tienes turnos reservados.</p>}
        
        <div className="turnos-list">
          {turnos.map((turno) => (
            <div key={turno.id} className={`turno-card ${turno.estado.toLowerCase()}`}>
              <p><strong>Fecha:</strong> {new Date(turno.fecha_hora).toLocaleString()}</p>
              <p><strong>Peluquero:</strong> {turno.peluquero}</p>
              <p><strong>Estado:</strong> <span className="turno-estado">{turno.estado}</span></p>
              {turno.estado.toLowerCase() === 'confirmado' && (
                <button onClick={() => handleCancelTurno(turno.id)} className="btn-cancelar">
                  Cancelar
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Turnos;