import { useContext } from 'react';
import { TurnosContext } from '../context/TurnosContext';
import FormularioTurno from '../components/FormularioTurno';
import TurnosDisponibles from '../components/TurnosDisponibles';

export default function Turnos() {
  const { turnos, setTurnos } = useContext(TurnosContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const nuevoTurno = {
      dia: form.dia.value,
      tipo: form.tipo.value,
      peluquero: form.peluquero.value,
      hora: '09:00' // placeholder
    };
    setTurnos([...turnos, nuevoTurno]);
  };

  return (
    <div>
      <h1>Turnos</h1>
      <FormularioTurno onSubmit={handleSubmit} />
      <h2>Turnos Disponibles</h2>
      <TurnosDisponibles turnos={turnos} />
    </div>
  );
}