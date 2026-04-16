export const formatHora = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
};

export const formatFecha = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
};

export const formatFechaHoraCompleta = (timestamp) => {
  return `${formatFecha(timestamp)} a las ${formatHora(timestamp)}`;
};