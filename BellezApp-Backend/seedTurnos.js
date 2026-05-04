// seedTurnos.js - Generar turnos dinámicamente alrededor de la fecha actual
require('dotenv').config(); // Cargar variables de entorno
const sqlite3 = require('sqlite3').verbose();
const { zonedTimeToUtc } = require('date-fns-tz');

const DB_PATH = './bellezapp.db';

// Constantes (deben coincidir con backend)
const USER_ROLES = { PELUQUERO: 'peluquero' };
const APPOINTMENT_STATUS = { CONFIRMADO: 'confirmado', CANCELADO: 'cancelado', ASISTIO: 'asistio', NO_ASISTIO: 'no_asistio' };
const BUSINESS_HOURS = [{ start: 9, end: 12 }, { start: 17, end: 21 }];
const SLOT_INTERVAL = 30; // minutos
// Zona horaria del negocio desde .env (por defecto Argentina)
const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || 'America/Argentina/Buenos_Aires';

// Función para obtener días hábiles entre dos fechas
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

// Generar todos los slots de un día (horas disponibles)
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
    // Obtener peluqueros
    const peluqueros = await new Promise((resolve, reject) => {
      db.all('SELECT id FROM usuarios WHERE rol = ?', [USER_ROLES.PELUQUERO], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    if (peluqueros.length === 0) throw new Error('No hay peluqueros. Ejecuta seedUsuarios.js primero.');

    // Obtener clientes
    const clientes = await new Promise((resolve, reject) => {
      db.all('SELECT id FROM usuarios WHERE rol = ?', ['cliente'], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    if (clientes.length === 0) throw new Error('No hay clientes. Ejecuta seedUsuarios.js primero.');

    // Obtener servicios
    const servicios = await new Promise((resolve, reject) => {
      db.all('SELECT id, duracion_minutos FROM servicios', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    if (servicios.length === 0) throw new Error('No hay servicios. Verifica initDB.');

    // Fechas dinámicas: desde hoy -15 días hasta hoy +15 días (rango de 31 días)
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
    
    // Probabilidad de crear un turno en un slot dado (por peluquero)
    const PROB_TURNO = 0.25;
    
    let turnosCreados = 0;
    let turnosFallidos = 0;
    
    for (const dia of weekdays) {
      // Fecha local en YYYY-MM-DD (sin conversión UTC)
      const fechaLocal = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
      const esPasado = dia < today;
      
      for (const peluquero of peluqueros) {
        for (const slot of slotsPorDia) {
          if (Math.random() > PROB_TURNO) continue;
          
          // Elegir servicio aleatorio
          const servicio = servicios[Math.floor(Math.random() * servicios.length)];
          const duracionHoras = servicio.duracion_minutos / 60;
          let horaFin = slot.hour + duracionHoras;
          // Verificar que no exceda el bloque horario
          const bloque = (slot.hour < 12) ? BUSINESS_HOURS[0] : BUSINESS_HOURS[1];
          if (horaFin > bloque.end) continue;
          
          // Elegir cliente aleatorio
          const cliente = clientes[Math.floor(Math.random() * clientes.length)];
          
          // Determinar estado según fecha
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
          
          // Construir fecha/hora local en string (ej. "2026-05-18 09:30:00")
          const horaStr = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}:00`;
          const fechaHoraLocalStr = `${fechaLocal} ${horaStr}`;
          
          // Convertir a UTC usando la zona horaria del negocio
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