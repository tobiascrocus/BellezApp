import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import "../styles/Turnos.css";
import { useUser } from '../context/UserContext';
import { useConfig } from '../context/ConfigContext';
import * as api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker, { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
import { formatHora, formatFecha, formatFechaHoraCompleta } from '../utils/fecha';

// Registramos el idioma español para el calendario
registerLocale('es', es);

// Contenedor animado para el DatePicker (fuera del componente principal)
const AnimatedPopper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

const Turnos = () => {
  const { user } = useUser();
  const config = useConfig();

  if (!config) return null;

  const [turnos, setTurnos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [peluqueros, setPeluqueros] = useState([]);
  const [disponibilidad, setDisponibilidad] = useState([]);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedStylist, setSelectedStylist] = useState('');

  const [mockHistoryVisible, setMockHistoryVisible] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ visible: false, turno: null });
  const [infoModal, setInfoModal] = useState({ visible: false, message: '' });
  const [loading, setLoading] = useState(true);

  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const serviceDropdownRef = useRef(null);
  const [stylistDropdownOpen, setStylistDropdownOpen] = useState(false);
  const stylistDropdownRef = useRef(null);

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

  const fetchTurnos = useCallback(async () => {
    try {
      const res = await api.getTurnos();
      if (res.ok) {
        setTurnos(res.data);
      } else {
        setInfoModal({ visible: true, message: res.message || 'Error al cargar los turnos.' });
      }
    } catch (error) {
      setInfoModal({ visible: true, message: 'Error de conexión al cargar turnos.' });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchTurnos();
        const [serviciosRes, peluquerosRes] = await Promise.all([api.getServicios(), api.getPeluqueros()]);
        if (serviciosRes.ok) setServicios(serviciosRes.data);
        if (peluquerosRes.ok) setPeluqueros(peluquerosRes.data);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        setInfoModal({ visible: true, message: 'No se pudieron cargar los datos. Revisa tu conexión.' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchTurnos]);

  useEffect(() => {
    const fetchDisponibilidad = async () => {
      if (selectedDate && selectedStylist) {
        try {
          const res = await api.getDisponibilidad(selectedDate, selectedStylist.id);
          if (res.ok) {
            setDisponibilidad(res.data[selectedStylist.id] || []);
          } else {
            setDisponibilidad([]);
            setInfoModal({ visible: true, message: res.message || 'No se pudo obtener la disponibilidad.' });
          }
        } catch (error) {
          setDisponibilidad([]);
          setInfoModal({ visible: true, message: 'Error de conexión al cargar la disponibilidad.' });
        }
      } else {
        setDisponibilidad([]);
      }
    };
    fetchDisponibilidad();
  }, [selectedDate, selectedStylist]);

  const toggleMockHistory = () => setMockHistoryVisible(!mockHistoryVisible);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target)) {
        setServiceDropdownOpen(false);
      }
      if (stylistDropdownRef.current && !stylistDropdownRef.current.contains(event.target)) {
        setStylistDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (setter, value, closeDropdown) => {
    setter(value);
    setSelectedTime(''); // Deselecciona el horario al cambiar cualquier opción
    closeDropdown(false);
  };

  const turnosActivos = turnos.filter(t => t.estado === 'confirmado');
  const historialTurnos = turnos.filter(t => t.estado !== 'confirmado');

  const isTurnoDisponible = (hora) => {
    if (!selectedDate || !selectedService || !selectedStylist) return false;

    const [hour, minute] = hora.split(':').map(Number);
    const minutosTurno = hour * 60 + minute;

    const ahora = new Date();
    const ahoraArg = new Date(ahora.toLocaleString('en-US', { timeZone: config.timeZone }));
    const hoyStr = ahoraArg.toISOString().split('T')[0];
    const minutosAhora = ahoraArg.getHours() * 60 + ahoraArg.getMinutes();

    if (selectedDate < hoyStr) return false;
    if (selectedDate === hoyStr && minutosAhora >= minutosTurno) return false;

    const diaSeleccionado = new Date(`${selectedDate}T00:00:00`);
    if ([0, 6].includes(diaSeleccionado.getDay())) return false;

    const slot = disponibilidad.find(d => d.hora === hora);
    if (!slot || !slot.disponible) return false;

    const duracionSlots = Math.ceil(selectedService.duracion_minutos / 30);
    for (let i = 0; i < duracionSlots; i++) {
      const bloqueMin = minutosTurno + i * 30;
      const hr = Math.floor(bloqueMin / 60);
      const min = bloqueMin % 60;
      const bloqueStr = `${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const slotCheck = disponibilidad.find(d => d.hora === bloqueStr);
      if (!slotCheck || !slotCheck.disponible) return false;
    }

    return true;
  };

  const handleCancelarClick = (turno) => setConfirmModal({ visible: true, turno });

  const confirmarCancelacion = async () => {
    try {
      const turno = confirmModal.turno;
      const res = await api.cancelTurno(turno.id);
      if (res.ok) {
        await fetchTurnos(); // Recargar turnos
        setInfoModal({ visible: true, message: 'Turno cancelado correctamente.' });
      } else {
        setInfoModal({ visible: true, message: res.message || 'Error al cancelar el turno.' });
      }
    } catch (error) {
      setInfoModal({ visible: true, message: 'Error de conexión. No se pudo cancelar el turno.' });
    } finally {
      setConfirmModal({ visible: false, turno: null });
    }
  };

  const cerrarConfirmModal = () => setConfirmModal({ visible: false, turno: null });

  const cerrarInfoModal = () => setInfoModal({ visible: false, message: '' });

  const handleReservarTurno = async () => {
    if (!selectedDate || !selectedTime || !selectedService || !selectedStylist) return;

    if (turnosActivos.length >= 3) {
      setInfoModal({ visible: true, message: 'No puedes tener más de 3 turnos activos.' });
      return;
    }

    if (!isTurnoDisponible(selectedTime)) {
      setInfoModal({ visible: true, message: 'Horario no disponible o sin espacio suficiente para el servicio.' });
      return;
    }

    const nuevoTurno = {
      usuario_id: user.id,
      peluquero_id: selectedStylist.id,
      servicio_id: selectedService.id,
      fecha: selectedDate,   // ya está en YYYY-MM-DD
      hora: selectedTime     // ya está en HH:MM
    };

    try {
      const res = await api.createTurno(nuevoTurno);
      if (res.ok) {
        await fetchTurnos();
        setInfoModal({ visible: true, message: '¡Turno reservado con éxito!' });
        setSelectedDate('');
        setSelectedTime('');
        setSelectedService('');
        setSelectedStylist('');
      } else {
        setInfoModal({ visible: true, message: res.message || 'Error al reservar el turno.' });
      }
    } catch (error) {
      setInfoModal({ visible: true, message: 'Error de conexión. No se pudo reservar el turno.' });
    }
  };

  const renderHorarioButton = (hora) => {
    const datosIncompletos = !selectedDate || !selectedService || !selectedStylist;
    const duracionSlots = selectedService ? Math.ceil(selectedService.duracion_minutos / 30) : 1;

    const bloquesSeleccionados = [];
    if (selectedTime) {
      const [h, m] = selectedTime.split(':').map(Number);
      for (let i = 0; i < duracionSlots; i++) {
        const bloqueMin = h * 60 + m + i * 30;
        const hr = Math.floor(bloqueMin / 60);
        const min = bloqueMin % 60;
        bloquesSeleccionados.push(`${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      }
    }

    const disponible = isTurnoDisponible(hora);
    const selected = bloquesSeleccionados.includes(hora);

    return (
      <button
        key={hora}
        className={`horario-btn ${(!disponible || datosIncompletos) ? 'reservado' : ''} ${selected ? 'selected-multi' : ''}`}
        disabled={!disponible || datosIncompletos}
        onClick={() => setSelectedTime(hora)}
      >
        {hora}
      </button>
    );
  };

  // Función para deshabilitar fines de semana en el calendario
  const isWeekday = (date) => ![0, 6].includes(date.getDay());

  return (
    <div className="turnos-page">
      {loading && <div className="loading-overlay">Cargando...</div>}
      <section className="mis-turnos-box">
        <h2>Mis turnos ({turnosActivos.length})</h2>
        {turnosActivos.length === 0 ? (
          <p className="sin-turnos-msg">No tienes turnos reservados.</p>
        ) : (
          <div className="turnos-grid-horizontal">
            {[...turnosActivos]
              .sort((a, b) => a.fecha_timestamp - b.fecha_timestamp)
              .map((t) => {
                return (
                  <div key={t.id} className="turno-card-horizontal">
                    <h3 className="card-title">Resumen</h3>
                    <p><strong>Hora:</strong> {formatHora(t.fecha_timestamp, config.timeZone)}</p>
                    <p><strong>Fecha:</strong> {formatFecha(t.fecha_timestamp, config.timeZone)}</p>
                    <p><strong>Estilista:</strong> {t.peluquero_nombre}</p>
                    <p><strong>Servicio:</strong> {t.servicio_nombre}</p>
                    <button className="btn-cancelar" onClick={() => handleCancelarClick(t)}>Cancelar turno</button>
                  </div>
                );
              })}
          </div>
        )}
        <button className="historial-btn" onClick={toggleMockHistory}>Historial de turnos</button>

        {ReactDOM.createPortal(
          <AnimatePresence>
            {mockHistoryVisible && (
              <motion.div className="modal-overlay" onClick={() => setMockHistoryVisible(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}>
                  <h3>Historial de turnos</h3>
                  <div className="historial-cards">
                    {historialTurnos.length > 0 ? (
                      [...historialTurnos]
                        .sort((a, b) => b.fecha_timestamp - a.fecha_timestamp)
                        .map((t) => {
                          return (
                            <div key={t.id} className={`historial-card ${t.estado}`}>
                              <strong>Hora:</strong> {formatHora(t.fecha_timestamp, config.timeZone)} - <strong>Fecha:</strong> {formatFecha(t.fecha_timestamp, config.timeZone)} - <strong>Estilista:</strong> {t.peluquero_nombre} - <strong>Servicio:</strong> {t.servicio_nombre}
                              {t.estado === 'cancelado' && ' (Cancelado)'}
                              {t.estado === 'no_asistio' && ' (No se presentó)'}
                            </div>
                          );
                        })
                    ) : (
                      <p className="sin-turnos-msg" style={{ textAlign: 'center', width: '100%' }}>No tienes turnos en tu historial.</p>
                    )}
                  </div>
                  <button className="btn-cancelar" onClick={() => setMockHistoryVisible(false)}>Cerrar</button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>, document.body
        )}

        {ReactDOM.createPortal(
          <AnimatePresence>
            {confirmModal.visible && (
              <motion.div className="confirm-modal-overlay" onClick={cerrarConfirmModal} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="confirm-modal" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                  <h3>¿Cancelar turno?</h3>
                  <p>{confirmModal.turno && `¿Seguro que quieres cancelar el turno del ${formatFechaHoraCompleta(confirmModal.turno.fecha_timestamp, config.timeZone)}?`}</p>
                  <div className="confirm-buttons">
                    <button className="btn-confirmar" onClick={confirmarCancelacion}>Cancelar turno</button>
                    <button className="btn-volver" onClick={cerrarConfirmModal}>Volver</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>, document.body
        )}

        {ReactDOM.createPortal(
          <AnimatePresence>
            {infoModal.visible && (
              <motion.div className="confirm-modal-overlay" onClick={cerrarInfoModal} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="confirm-modal" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3>Notificación</h3>
              <p>{infoModal.message}</p>
              <div className="confirm-buttons" style={{ justifyContent: 'center' }}>
                <button className="btn-volver" onClick={cerrarInfoModal}>Entendido</button>
              </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>, document.body
        )}
      </section>

      <section className="turnos-info">
        <h2>Cómo reservar tu turno</h2>
        <p><strong>Horarios:</strong> Lunes a viernes de 9:00 a 12:00 y de 17:00 a 21:00.</p>
        <p><strong>Servicios:</strong></p>
        <ul>
          <li>Corte: 30 minutos</li>
          <li>Corte + Barba: 60 minutos</li>
        </ul>
        <p><strong>Turnos activos:</strong> Solo puedes tener hasta 3 turnos activos. Tus turnos actuales aparecen arriba.</p>
        <p><strong>Cancelar un turno:</strong> Hacerlo con al menos 3 horas de anticipación para evitar inconvenientes.</p>
      </section>

      <section className="reservador-turnos">
        <h3>Reservar un turno</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Fecha:</label>
            <DatePicker
              selected={selectedDate ? new Date(`${selectedDate}T00:00:00`) : null}
              onChange={(date) => {
                // Formateamos la fecha a YYYY-MM-DD para mantener la consistencia con el backend
                const pad = (n) => String(n).padStart(2, '0');
                const formattedDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
                setSelectedDate(formattedDate);
                setSelectedTime('');
              }}
              minDate={new Date()}
              filterDate={isWeekday}
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha"
              className="custom-datepicker-input" // Clase para el input
              calendarClassName="custom-datepicker-calendar" // Clase para el calendario
              wrapperClassName="datepicker-wrapper"
              locale="es" // ¡Aquí establecemos el idioma!
              disabledKeyboardNavigation // Evita el foco automático al cambiar de mes
              popperContainer={AnimatedPopper}
            />
          </div>

          <div className="form-group">
            <label>Servicio:</label>
            <div className="turnos-dropdown" ref={serviceDropdownRef}>
              <button type="button" className="turnos-dropdown-trigger" onClick={() => setServiceDropdownOpen(prev => !prev)}>
                {selectedService?.nombre || 'Seleccionar...'}
                <span className="turnos-dropdown-arrow">{serviceDropdownOpen ? '▲' : '▼'}</span>
              </button>
              <AnimatePresence>
                {serviceDropdownOpen && (
                  <motion.div
                    className="turnos-dropdown-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {servicios.map(s => (
                      <div
                        key={s.id}
                        className={`turnos-dropdown-item ${selectedService?.id === s.id ? 'active' : ''}`}
                        onClick={() => handleSelect(setSelectedService, s, setServiceDropdownOpen)}>
                        {s.nombre}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="form-group">
            <label>Peluquero:</label>
            <div className="turnos-dropdown" ref={stylistDropdownRef}>
              <button type="button" className="turnos-dropdown-trigger" onClick={() => setStylistDropdownOpen(prev => !prev)}>
                {selectedStylist?.nombre || 'Seleccionar...'}
                <span className="turnos-dropdown-arrow">{stylistDropdownOpen ? '▲' : '▼'}</span>
              </button>
              <AnimatePresence>
                {stylistDropdownOpen && (
                  <motion.div
                    className="turnos-dropdown-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {peluqueros.map(p => (
                      <div
                        key={p.id}
                        className={`turnos-dropdown-item ${selectedStylist?.id === p.id ? 'active' : ''}`}
                        onClick={() => handleSelect(setSelectedStylist, p, setStylistDropdownOpen)}>
                        {p.nombre}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="horarios-section">
          <div className="horarios-container">
            <h4>Por la mañana</h4>
            <div className="horarios-grid">{morningSlots.map(renderHorarioButton)}</div>
          </div>
          <div className="horarios-container">
            <h4>Por la tarde</h4>
            <div className="horarios-grid">{eveningSlots.map(renderHorarioButton)}</div>
          </div>
        </div>

        <button
          className="reservar-btn"
          disabled={!selectedDate || !selectedTime || !selectedService || !selectedStylist}
          onClick={handleReservarTurno}
        >
          Reservar turno
        </button>
      </section>

    </div>
  );
};

export default Turnos;
