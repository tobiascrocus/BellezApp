export const formatHora = (timestamp, timeZone = 'America/Argentina/Buenos_Aires') => {
  return new Date(timestamp).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timeZone,
  });
};

export const formatFecha = (timestamp, timeZone = 'America/Argentina/Buenos_Aires') => {
  return new Date(timestamp).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: timeZone,
  });
};

export const formatFechaHoraCompleta = (timestamp, timeZone = 'America/Argentina/Buenos_Aires') => {
  return `${formatFecha(timestamp, timeZone)} a las ${formatHora(timestamp, timeZone)}`;
};