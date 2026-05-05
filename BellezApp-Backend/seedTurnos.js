require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { zonedTimeToUtc } = require('date-fns-tz');

const DB_PATH = './bellezapp.db';

const USER_ROLES = { PELUQUERO: 'peluquero' };
const APPOINTMENT_STATUS = { CONFIRMADO: 'confirmado', CANCELADO: 'cancelado', ASISTIO: 'asistio', NO_ASISTIO: 'no_asistio' };
const BUSINESS_HOURS = [{ start: 9, end: 12 }, { start: 17, end: 21 }];
const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || 'America/Argentina/Buenos_Aires';

function getWeekdaysInRange(startDate, endDate) {
  const weekdays = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      weekdays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return weekdays;
}

function getSlotsForDay() {
  const slots = [];
  for (const block of BUSINESS_HOURS) {
    for (let h = block.start; h < block.end; h++) {
      slots.push({ hour: h, minute: 0 });
      slots.push({ hour: h, minute: 30 });
    }
  }
  return slots;
}

const db = new sqlite3.Database(DB_PATH, async (err) => {
  if (err) {
    console.error('Error conectando a la DB:', err.message);
    process.exit(1);
  }
  console.log('Conectado a la base de datos.');

  try {
    const peluqueros = await new Promise((resolve, reject) => {
      db.all('SELECT id FROM usuarios WHERE rol = ?', [USER_ROLES.PELUQUERO], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    if (peluqueros.length === 0) throw new Error('No hay peluqueros. Ejecuta seedUsuarios.js primero.');

    const clientes = await new Promise((resolve, reject) => {
      db.all('SELECT id FROM usuarios WHERE rol = ?', ['cliente'], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    if (clientes.length === 0) throw new Error('No hay clientes. Ejecuta seedUsuarios.js primero.');

    const servicios = await new Promise((resolve, reject) => {
      db.all('SELECT id, duracion_minutos FROM servicios', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    if (servicios.length === 0) throw new Error('No hay servicios. Verifica initDB.');

    // Genera turnos en un rango de 31 días (actual +/- 15)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 15);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 15);
    
    console.log(`Generando turnos desde ${startDate.toISOString().split('T')[0]} hasta ${endDate.toISOString().split('T')[0]}`);
    
    const weekdays = getWeekdaysInRange(startDate, endDate);
    console.log(`Días hábiles en el rango: ${weekdays.length}`);
    
    const slotsPorDia = getSlotsForDay();
    console.log(`Slots por día: ${slotsPorDia.length}`);
    
    // Probabilidad de asignación de turno por slot para cada peluquero
    const PROB_TURNO = 0.25;
    
    let turnosCreados = 0;
    let turnosFallidos = 0;
    
    for (const dia of weekdays) {
      // Evita conversiones UTC prematuras para mantener la fecha local correcta
      const fechaLocal = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
      const esPasado = dia < today;
      
      for (const peluquero of peluqueros) {
        for (const slot of slotsPorDia) {
          if (Math.random() > PROB_TURNO) continue;
          
          const servicio = servicios[Math.floor(Math.random() * servicios.length)];
          const duracionHoras = servicio.duracion_minutos / 60;
          let horaFin = slot.hour + duracionHoras;

          // Asegura que el turno finalice dentro del bloque horario correspondiente
          const bloque = (slot.hour < 12) ? BUSINESS_HOURS[0] : BUSINESS_HOURS[1];
          if (horaFin > bloque.end) continue;
          
          const cliente = clientes[Math.floor(Math.random() * clientes.length)];
          
          // Define el estado del turno según si la fecha es pasada
          let estado;
          if (esPasado) {
            const rand = Math.random();
            if (rand < 0.6) estado = APPOINTMENT_STATUS.ASISTIO;
            else if (rand < 0.8) estado = APPOINTMENT_STATUS.NO_ASISTIO;
            else estado = APPOINTMENT_STATUS.CANCELADO;
          } else {
            const rand = Math.random();
            estado = rand < 0.9 ? APPOINTMENT_STATUS.CONFIRMADO : APPOINTMENT_STATUS.CANCELADO;
          }
          
          const horaStr = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}:00`;
          const fechaHoraLocalStr = `${fechaLocal} ${horaStr}`;
          
          // Convierte a UTC utilizando la zona horaria configurada para el negocio
          const utcDate = zonedTimeToUtc(fechaHoraLocalStr, BUSINESS_TIMEZONE);
          const fechaHora = utcDate.toISOString().replace('T', ' ').slice(0, 19);
          
          try {
            await new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO turnos (usuario_id, peluquero_id, servicio_id, fecha_hora, estado)
                 VALUES (?, ?, ?, ?, ?)`,
                [cliente.id, peluquero.id, servicio.id, fechaHora, estado],
                function(err) {
                  if (err) reject(err);
                  else {
                    turnosCreados++;
                    resolve();
                  }
                }
              );
            });
          } catch (err) {
            if (err.message.includes('UNIQUE constraint failed')) turnosFallidos++;
            else console.error('Error inesperado:', err.message);
          }
        }
      }
    }
    
    console.log(`Seed de turnos completado.`);
    console.log(`  - Turnos creados: ${turnosCreados}`);
    console.log(`  - Omitidos (conflictos): ${turnosFallidos}`);
    db.close();
  } catch (error) {
    console.error('Error:', error);
    db.close();
    process.exit(1);
  }
});