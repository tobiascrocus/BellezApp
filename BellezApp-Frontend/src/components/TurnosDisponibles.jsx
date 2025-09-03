import CardTurno from './CardTurno';

export default function TurnosDisponibles({ turnos }) {
  if (!turnos || turnos.length === 0) return <p>No hay turnos disponibles</p>;

  return (
    <div>
      {turnos.map((t, i) => (
        <CardTurno key={i} turno={t} />
      ))}
    </div>
  );
}