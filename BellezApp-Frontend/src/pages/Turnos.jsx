import { useContext } from 'react';
import { TurnosContext } from '../context/TurnosContext';

export default function Turnos() {
  const { turnos } = useContext(TurnosContext);

  return (
    <div>
      <h1>Turnos</h1>
      <p>Aquí se mostrarán los turnos cuando agregues los componentes correspondientes.</p>
      <ul>
        {turnos.map((t, index) => (
          <li key={index}>
            {t.dia} - {t.tipo} - {t.peluquero} - {t.hora}
          </li>
        ))}
      </ul>
    </div>
  );
}