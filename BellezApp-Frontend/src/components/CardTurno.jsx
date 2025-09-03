export default function CardTurno({ turno }) {
  return (
    <div style={{ border: '1px solid #666', padding: '0.5rem', margin: '0.5rem 0' }}>
      <p>Hora: {turno?.hora || '---'}</p>
      <p>Peluquero: {turno?.peluquero || '---'}</p>
      <p>Tipo de corte: {turno?.tipo || '---'}</p>
    </div>
  );
}