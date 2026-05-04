import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useUser } from "../context/UserContext";
import { useConfig } from '../context/ConfigContext';
import * as api from '../services/api';
import "../styles/AdministradorPeluquero.css";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker, { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
import { formatHora, formatFecha } from '../utils/fecha';

// Registramos el idioma español para el calendario
registerLocale('es', es);

// Contenedor para el portal del DatePicker (fuera del componente principal)
const AnimatedPopper = ({ children }) => {
  return (
    <motion.div
      style={{ zIndex: 10002 }}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default function AdministradorPeluquero() {
  const { user } = useUser();
  const config = useConfig();

  if (!config) return null;

  const [peluqueros, setPeluqueros] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [usuarios, setUsuarios] = useState([]); // Para buscar clientes
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPeluqueroId, setSelectedPeluqueroId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [peluqueroDropdownOpen, setPeluqueroDropdownOpen] = useState(false);
  const peluqueroDropdownRef = useRef(null);
  const peluqueroModalDropdownRef = useRef(null);
  const servicioModalDropdownRef = useRef(null);
  const clienteDropdownRef = useRef(null);

  const [peluqueroModalDropdownOpen, setPeluqueroModalDropdownOpen] = useState(false);
  const [servicioModalDropdownOpen, setServicioModalDropdownOpen] = useState(false);
  const [clienteDropdownOpen, setClienteDropdownOpen] = useState(false);

  // --- Estados para el modal de "Agregar Turno" ---
  const [modalOpen, setModalOpen] = useState(false);
  const [newTurno, setNewTurno] = useState({
    usuario_id: "",
    servicio_id: "",
    peluquero_id: "",
    fecha: new Date().toLocaleDateString('en-CA'),
    hora: "",
  });
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [clienteSearch, setClienteSearch] = useState('');
  const [cancelConfirmModal, setCancelConfirmModal] = useState({ visible: false, turnoId: null });
  const [disponibilidadModal, setDisponibilidadModal] = useState([]);

  const { morningSlots, eveningSlots } = useMemo(() => {
    if (!config) return { morningSlots: [], eveningSlots: [] };
    const slots = [];
    for (const bloque of config.businessHours) {
      for (let hour = bloque.start; hour < bloque.end; hour++) {
        for (let minute = 0; minute < 60; minute += config.slotInterval) {
          const horaStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          slots.push(horaStr);
        }
      }
    }
    return {
      morningSlots: slots.filter(h => parseInt(h.split(':')[0]) < 12),
      eveningSlots: slots.filter(h => parseInt(h.split(':')[0]) >= 12)
    };
  }, [config]);


  const selectedPeluquero = useMemo(() => {
    return peluqueros.find(p => p.id === selectedPeluqueroId);
  }, [selectedPeluqueroId, peluqueros]);

  const clienteResults = useMemo(() => {
    if (!clienteSearch) return [];
    return usuarios.filter(u =>
      u.rol === 'cliente' &&
      (u.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) || u.apellido.toLowerCase().includes(clienteSearch.toLowerCase()) || u.email.toLowerCase().includes(clienteSearch.toLowerCase()))
    ).slice(0, 5); // Mostramos solo los primeros 5 resultados
  }, [clienteSearch, usuarios]);

  const turnosFiltrados = useMemo(() => {
    if (!selectedPeluqueroId) return [];
    const [y, m, d] = selectedDate.split('-').map(Number);
    const fechaRef = new Date(Date.UTC(y, m - 1, d)).toISOString().split('T')[0];
    return turnos
      .filter(
        (turno) =>
          turno.peluquero_id === selectedPeluqueroId &&
          new Date(turno.fecha_timestamp).toISOString().startsWith(fechaRef)
      )
      .sort((a, b) => a.fecha_timestamp - b.fecha_timestamp);
  }, [turnos, selectedPeluqueroId, selectedDate]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Un peluquero no necesita ni puede ver la lista de todos los usuarios.
      // Solo el admin la necesita para el modal de "Agregar Turno".
      const isAdmin = user && user.rol === 'admin';

      const promises = [
        api.getPeluqueros(),
        api.getTurnosAgenda(),
        api.getServicios(),
      ];

      if (isAdmin) {
        promises.push(api.getUsuarios());
      }

      const [peluquerosData, turnosData, serviciosData, usuariosData] = await Promise.all(promises);

      if (!peluquerosData.ok || !turnosData.ok || !serviciosData.ok || (isAdmin && !usuariosData.ok) ) {
        throw new Error("Error al cargar los datos de la agenda.");
      }

      setPeluqueros(peluquerosData.data);
      setTurnos(turnosData.data);
      setServicios(serviciosData.data);
      setUsuarios(usuariosData ? usuariosData.data : []); // Si usuariosData existe, usa su data, si no, un array vacío.

    } catch (err) {
      setErrorModal({ visible: true, message: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.rol === 'peluquero') {
      setSelectedPeluqueroId(user.id);
    }
  }, [user]);

  // Efecto para cargar la disponibilidad en el modal
  useEffect(() => {
    const fetchDisponibilidadModal = async () => {
      if (modalOpen && newTurno.fecha && newTurno.peluquero_id) {
        try {
          const res = await api.getDisponibilidad(newTurno.fecha, newTurno.peluquero_id);
          if (res.ok) {
            setDisponibilidadModal(res.data[newTurno.peluquero_id] || []);
          }
        } catch (error) {
          console.error("Error fetching modal disponibilidad:", error);
        }
      }
    };
    fetchDisponibilidadModal();
  }, [modalOpen, newTurno.fecha, newTurno.peluquero_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (peluqueroDropdownRef.current && !peluqueroDropdownRef.current.contains(event.target)) {
        setPeluqueroDropdownOpen(false);
      }
      if (peluqueroModalDropdownRef.current && !peluqueroModalDropdownRef.current.contains(event.target)) {
        setPeluqueroModalDropdownOpen(false);
      }
      if (servicioModalDropdownRef.current && !servicioModalDropdownRef.current.contains(event.target)) {
        setServicioModalDropdownOpen(false);
      }
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target)) {
        setClienteDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClienteSearchChange = (e) => {
    setClienteSearch(e.target.value);
    setNewTurno({ ...newTurno, usuario_id: '' });
  };

  const handlePeluqueroSelect = (id) => {
    setSelectedPeluqueroId(id);
    setPeluqueroDropdownOpen(false);
  };

  const handleOpenModal = () => {
    setClienteSearch('');
    setNewTurno({
      usuario_id: "",
      servicio_id: "", // Iniciar vacío
      peluquero_id: "", // Iniciar vacío
      fecha: "", // Iniciar vacío
      hora: "",
    });
    setModalOpen(true);
  };

  const handleSelectCliente = (cliente) => {
    setNewTurno({ ...newTurno, usuario_id: cliente.id });
    setClienteSearch(`${cliente.nombre} ${cliente.apellido} (${cliente.email})`);
    setClienteDropdownOpen(false);
  };

  const handleAddTurno = async () => {
    if (!newTurno.usuario_id || !newTurno.servicio_id || !newTurno.peluquero_id || !newTurno.fecha || !newTurno.hora) {
      setErrorModal({ visible: true, message: "Todos los campos son obligatorios." });
      return;
    }

    try {
      const payload = {
        usuario_id: parseInt(newTurno.usuario_id, 10),
        peluquero_id: parseInt(newTurno.peluquero_id, 10),
        servicio_id: parseInt(newTurno.servicio_id, 10),
        fecha: newTurno.fecha,   // ya en YYYY-MM-DD
        hora: newTurno.hora      // ya en HH:MM
      };
      const data = await api.createTurno(payload);
      if (!data.ok) throw new Error(data.message || "Error al crear el turno.");

      await fetchData(); // Recargamos los datos para ver el nuevo turno
      setModalOpen(false);

    } catch (err) {
      setErrorModal({ visible: true, message: err.message });
    }
  };

  const handleEstadoChange = async (turnoId, nuevoEstado) => {
    setIsUpdating(true);
    try {
      const data = await api.updateTurno(turnoId, { estado: nuevoEstado });
      if (!data.ok) throw new Error(data.message || "Error al actualizar el estado del turno.");

      // Actualizamos el estado localmente para una respuesta visual inmediata
      setTurnos(prevTurnos =>
        prevTurnos.map(t => t.id === turnoId ? { ...t, estado: nuevoEstado } : t)
      );

    } catch (err) {
      setErrorModal({ visible: true, message: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelClick = (turnoId) => {
    setCancelConfirmModal({ visible: true, turnoId: turnoId });
  };

  const closeCancelConfirmModal = () => {
    setCancelConfirmModal({ visible: false, turnoId: null });
  };

  const confirmCancellation = () => {
    if (cancelConfirmModal.turnoId) {
      handleEstadoChange(cancelConfirmModal.turnoId, 'cancelado');
    }
    closeCancelConfirmModal();
  };

  const renderHorarioButtonModal = (hora) => {
    const servicioSeleccionado = servicios.find(s => s.id === newTurno.servicio_id);
    const datosIncompletos = !newTurno.fecha || !servicioSeleccionado || !newTurno.peluquero_id;

    const duracionSlots = servicioSeleccionado ? Math.ceil(servicioSeleccionado.duracion_minutos / 30) : 1;
    const bloquesSeleccionados = [];
    if (newTurno.hora) {
      const [h, m] = newTurno.hora.split(':').map(Number);
      for (let i = 0; i < duracionSlots; i++) {
        const bloqueMin = h * 60 + m + i * 30;
        const hr = Math.floor(bloqueMin / 60);
        const min = bloqueMin % 60;
        bloquesSeleccionados.push(`${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      }
    }

    const isDisponible = () => {
      if (datosIncompletos) return false;

      // Obtener fecha/hora actual en Argentina de forma confiable
      const ahora = new Date();
      const ahoraArg = new Date(ahora.toLocaleString('en-US', { timeZone: config.timeZone }));
      const hoyStr = ahoraArg.toISOString().split('T')[0];
      const minutosAhora = ahoraArg.getHours() * 60 + ahoraArg.getMinutes();

      const [hour, minute] = hora.split(':').map(Number);
      const minutosTurno = hour * 60 + minute;

      // Deshabilitar si la fecha es hoy y la hora ya pasó (con 10 min de margen)
      if (newTurno.fecha === hoyStr && minutosAhora > minutosTurno - 10) return false;

      // Deshabilitar fines de semana
      const diaSeleccionado = new Date(`${newTurno.fecha}T00:00:00`);
      if ([0, 6].includes(diaSeleccionado.getDay())) return false;

      // Verificar que haya slots continuos para la duración del servicio
      for (let i = 0; i < duracionSlots; i++) {
        const bloqueMin = minutosTurno + i * 30;
        const hr = Math.floor(bloqueMin / 60);
        const min = bloqueMin % 60;
        const bloqueStr = `${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const slotCheck = disponibilidadModal.find(d => d.hora === bloqueStr);
        if (!slotCheck || !slotCheck.disponible) return false;
      }
      return true;
    };

    const disponible = isDisponible();
    const isSelected = bloquesSeleccionados.includes(hora);

    return (
      <button
        key={hora}
        className={`horario-btn ${(!disponible || datosIncompletos) ? 'reservado' : ''} ${isSelected ? 'selected-multi' : ''}`}
        disabled={!disponible || datosIncompletos}
        onClick={() => setNewTurno({ ...newTurno, hora })}
      >
        {hora}
      </button>
    );
  };

  // Función para deshabilitar fines de semana en el calendario
  const isWeekday = (date) => ![0, 6].includes(date.getDay());


  return (
    <section className="admin-peluquero-container">
      <h1>Administrador de Turnos</h1>

      <div className="agenda-controls">
        {user && user.rol === 'admin' && (
          <div className="agenda-control-group">
            <label>Peluquero:</label>
            <div className="agenda-dropdown" ref={peluqueroDropdownRef}>
              <button type="button" className="agenda-dropdown-trigger" onClick={() => setPeluqueroDropdownOpen(prev => !prev)}>
                {selectedPeluquero ? `${selectedPeluquero.nombre} ${selectedPeluquero.apellido}` : 'Seleccionar...'}
                <span className="agenda-dropdown-arrow">{peluqueroDropdownOpen ? '▲' : '▼'}</span>
              </button>
              <AnimatePresence>
                {peluqueroDropdownOpen && (
                  <motion.div
                    className="agenda-dropdown-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {peluqueros.map(p => (
                      <div
                        key={p.id}
                        className={`agenda-dropdown-item ${selectedPeluqueroId === p.id ? 'active' : ''}`}
                        onClick={() => handlePeluqueroSelect(p.id)}>
                        {p.nombre} {p.apellido}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="agenda-control-group">
          <label>Fecha:</label>
          <DatePicker
            selected={selectedDate ? new Date(`${selectedDate}T00:00:00`) : null}
            onChange={(date) => {
              const pad = (n) => String(n).padStart(2, '0');
              const formattedDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
              setSelectedDate(formattedDate);
            }}
            dateFormat="dd/MM/yyyy"
            placeholderText="Seleccionar fecha"
            className="custom-datepicker-input"
            calendarClassName="custom-datepicker-calendar"
            wrapperClassName="datepicker-wrapper"
            locale="es"
            disabledKeyboardNavigation
            popperContainer={AnimatedPopper}
          />
        </div>

        {user && user.rol === 'admin' && (
          <div className="agenda-control-group">
            <label className="label-placeholder">&nbsp;</label> {/* Espacio para alinear */}
            <button className="btn-add-turno" onClick={handleOpenModal}>Agregar Turno</button>
          </div>
        )}
      </div>

      <div className="agenda-view">
        {user && user.rol === 'admin' && selectedPeluquero && (
          <h2>
            Turnos de {selectedPeluquero.nombre} para el{" "}
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', {
              day: '2-digit', month: '2-digit', year: 'numeric'
            })}
          </h2>
        )}
        {user && user.rol === 'peluquero' && (
          <h2>
            Mis Turnos para el{" "}
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', {
              day: '2-digit', month: '2-digit', year: 'numeric'
            })}
          </h2>
        )}

        <div className="turnos-list">
          {isLoading ? (
            <p className="no-turnos-msg">Cargando turnos...</p>
          ) : turnosFiltrados.length > 0 ? (
            turnosFiltrados.map((turno) => (
              <div key={turno.id} className={`turno-agenda-card estado-${turno.estado}`}>
                <div className="turno-hora">{formatHora(turno.fecha_timestamp, config.timeZone)}</div>
                <div className="turno-detalle">
                  <p><strong>Cliente:</strong> {turno.cliente_nombre || 'No especificado'}</p>
                  <p><strong>Servicio:</strong> {turno.servicio_nombre}</p>
                  <p><strong>Estado:</strong> <span className="estado-label" style={{ fontWeight: 'normal' }}>
                    {turno.estado === 'asistio' 
                      ? 'Asistió'
                      : turno.estado === 'no_asistio'
                        ? 'No Asistió'
                        : turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                  </span></p>
                </div>
                {/* Acciones disponibles para el peluquero y el administrador */}
                {user && (user.rol === 'peluquero' || user.rol === 'admin') && (
                  <>
                    {/* Solo mostrar acciones si el turno no está ya cancelado */}
                    {turno.estado !== 'cancelado' && (
                      <div className="turno-acciones">
                        {turno.fecha_timestamp > Date.now() ? (
                          <>
                            {turno.estado === 'confirmado' && (
                              <button className="accion-btn accion-cancelar" onClick={() => handleCancelClick(turno.id)} disabled={isUpdating}>Cancelar</button>
                            )}
                          </>
                        ) : ( // Turno pasado
                          <>
                            {turno.estado === 'asistio' && (
                              <button className="accion-btn accion-no-asistio" onClick={() => handleEstadoChange(turno.id, 'no_asistio')} disabled={isUpdating}>No Asistió</button>
                            )}
                            {turno.estado === 'no_asistio' && (
                              <button className="accion-btn accion-asistio" onClick={() => handleEstadoChange(turno.id, 'asistio')} disabled={isUpdating}>Sí Asistió</button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="no-turnos-msg">
              {user.rol === 'admin' && !selectedPeluqueroId ? 'Selecciona un peluquero para ver su agenda.' : 'No hay turnos para la fecha seleccionada.'}
            </p>
          )}
        </div>
      </div>

      {/* --- Modal para Agregar Turno --- */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="admin-modal-content" onClick={e => e.stopPropagation()} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}>
              <h3>Agregar Turno</h3>
              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label>Cliente:</label>
                  <div className="search-container" ref={clienteDropdownRef}>
                    <input
                      type="text"
                      placeholder="Buscar por email o nombre..."
                      value={clienteSearch}
                      onChange={handleClienteSearchChange}
                      onFocus={() => setClienteDropdownOpen(true)}
                    />
                    <AnimatePresence>
                      {clienteDropdownOpen && clienteResults.length > 0 && (
                        <motion.div
                          className="search-results"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {clienteResults.map(u => (
                            <div key={u.id} className="search-item" onClick={() => handleSelectCliente(u)}>
                              {u.nombre} {u.apellido} ({u.email})
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Fecha:</label>
                  <DatePicker
                    selected={newTurno.fecha ? new Date(`${newTurno.fecha}T00:00:00`) : null}
                    onChange={(date) => {
                      const pad = (n) => String(n).padStart(2, '0');
                      const formattedDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
                      setNewTurno({ ...newTurno, fecha: formattedDate, hora: '' });
                    }}
                    minDate={new Date()}
                    filterDate={isWeekday}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Seleccionar fecha"
                    className="custom-datepicker-input"
                    calendarClassName="custom-datepicker-calendar"
                    wrapperClassName="datepicker-wrapper"
                    locale="es"
                    disabledKeyboardNavigation
                    popperContainer={AnimatedPopper}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Peluquero:</label>
                  <div className="agenda-dropdown" ref={peluqueroModalDropdownRef}>
                    <button type="button" className="agenda-dropdown-trigger" onClick={() => setPeluqueroModalDropdownOpen(prev => !prev)}>
                      {peluqueros.find(p => p.id === newTurno.peluquero_id)?.nombre || 'Seleccionar...'}
                      <span className="agenda-dropdown-arrow">{peluqueroModalDropdownOpen ? '▲' : '▼'}</span>
                    </button>
                  <AnimatePresence>
                    {peluqueroModalDropdownOpen && (
                      <motion.div
                        className="agenda-dropdown-menu"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {peluqueros.map(p => (
                          <div key={p.id} className="agenda-dropdown-item" onClick={() => { setNewTurno({ ...newTurno, peluquero_id: p.id, hora: '' }); setPeluqueroModalDropdownOpen(false); }}>
                            {p.nombre} {p.apellido}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Servicio:</label>
                  <div className="agenda-dropdown" ref={servicioModalDropdownRef}>
                    <button type="button" className="agenda-dropdown-trigger" onClick={() => setServicioModalDropdownOpen(prev => !prev)}>
                      {servicios.find(s => s.id === newTurno.servicio_id)?.nombre || 'Seleccionar...'}
                      <span className="agenda-dropdown-arrow">{servicioModalDropdownOpen ? '▲' : '▼'}</span>
                    </button>
                  <AnimatePresence>
                    {servicioModalDropdownOpen && (
                      <motion.div
                        className="agenda-dropdown-menu"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {servicios.map(s => (
                          <div key={s.id} className="agenda-dropdown-item" onClick={() => { setNewTurno({ ...newTurno, servicio_id: s.id, hora: '' }); setServicioModalDropdownOpen(false); }}>
                            {s.nombre}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="modal-horarios-section">
                <div className="horarios-container"><h4>Mañana</h4><div className="horarios-grid">{morningSlots.map(renderHorarioButtonModal)}</div></div>
                <div className="horarios-container"><h4>Tarde</h4><div className="horarios-grid">{eveningSlots.map(renderHorarioButtonModal)}</div></div>
              </div>

              <div className="modal-buttons">
                <button
                  className="btn-agregar-turno"
                  onClick={handleAddTurno}
                  disabled={!newTurno.usuario_id || !newTurno.servicio_id || !newTurno.peluquero_id || !newTurno.fecha || !newTurno.hora}>
                  Agregar Turno
                </button>
                <button className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Modal de Error --- */}
      <AnimatePresence>
        {errorModal.visible && (
          <motion.div className="modal-overlay" onClick={() => setErrorModal({ visible: false, message: '' })} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="admin-modal-content" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3>Error de Validación</h3>
              <p>{errorModal.message}</p>
              <div className="modal-buttons" style={{ justifyContent: 'center' }}>
                <button className="btn-save" onClick={() => setErrorModal({ visible: false, message: '' })}>Entendido</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Modal de Confirmación de Cancelación --- */}
      <AnimatePresence>
        {cancelConfirmModal.visible && (
          <motion.div className="modal-overlay" onClick={closeCancelConfirmModal} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="admin-modal-content" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3>¿Confirmar Cancelación?</h3>
              <p>¿Estás seguro de que quieres cancelar este turno? Esta acción no se puede deshacer.</p>
              <div className="modal-buttons">
                <button className="btn-confirmar" onClick={confirmCancellation}>Cancelar turno</button>
                <button className="btn-volver" onClick={closeCancelConfirmModal}>Volver</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}