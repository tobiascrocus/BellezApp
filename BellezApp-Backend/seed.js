// seed.js
// Ejecutar: node seed.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { promisify } = require('util');

const DB_FILE = './bellezapp.db';
const SALT_ROUNDS = 10;
const db = new sqlite3.Database(DB_FILE);

db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};
db.allAsync = promisify(db.all.bind(db));
db.getAsync = promisify(db.get.bind(db));

// ---------- USUARIOS ----------
const USERS_ADMIN = [
  { nombre: 'Admin', apellido: 'Uno', email: 'admin1@hotmail.com', telefono: '123456789', rol: 'admin', password: '123456' },
  { nombre: 'Admin', apellido: 'Dos', email: 'admin2@hotmail.com', telefono: '123456789', rol: 'admin', password: '123456' },
  { nombre: 'Admin', apellido: 'Tres', email: 'admin3@hotmail.com', telefono: '123456789', rol: 'admin', password: '123456' }
];

const PELUQUEROS = [
  { nombre: 'Peluquero', apellido: 'Uno', email: 'peluquero1@hotmail.com', telefono: '123456789', rol: 'peluquero', password: '123456' },
  { nombre: 'Peluquero', apellido: 'Dos', email: 'peluquero2@hotmail.com', telefono: '123456789', rol: 'peluquero', password: '123456' },
  { nombre: 'Peluquero', apellido: 'Tres', email: 'peluquero3@hotmail.com', telefono: '123456789', rol: 'peluquero', password: '123456' },
  { nombre: 'Peluquero', apellido: 'Cuatro', email: 'peluquero4@hotmail.com', telefono: '123456789', rol: 'peluquero', password: '123456' }
];

// 30 clientes
const CLIENTES = [
  ['Juan','Pérez'],['Martín','González'],['Lucía','Rodríguez'],['Sofía','López'],['Mateo','Gómez'],
  ['Valentina','Martínez'],['Agustín','Sosa'],['Camila','Fernández'],['Benjamín','Ruiz'],['Julieta','Díaz'],
  ['Federico','Castro'],['Mía','Rossi'],['Tomás','Silva'],['Isabella','Vargas'],['Nicolás','Álvarez'],
  ['María','Hernández'],['Diego','Flores'],['Paula','Morales'],['Emilio','Ortiz'],['Ana','Bellini'],
  ['Santiago','Molina'],['Laura','Ramos'],['Facundo','Giménez'],['Carla','Paz'],['Bruno','Aguilar'],
  ['Noelia','Ibáñez'],['Hugo','Campos'],['Lautaro','Medina'],['Mara','Domínguez'],['Federica','Luna']
].map(p => {
  const email = `${p[0].toLowerCase()}${p[1].toLowerCase()}@example.com`
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '');
  return {
    nombre: p[0],
    apellido: p[1],
    email,
    telefono: '123456789',
    rol: 'cliente',
    password: '123456'
  };
});

// ---------- HORARIOS / FECHAS ----------
const SLOT_TEMPLATE = (() => {
  const arr = [];
  for (let h = 9; h < 12; h++) { arr.push([h, 0]); arr.push([h, 30]); }
  for (let h = 17; h < 21; h++) { arr.push([h, 0]); arr.push([h, 30]); }
  return arr; // 14 slots/día
})();

function pad(n) { return String(n).padStart(2, '0'); }

function getWorkingDates() {
  const start = new Date(2025, 10, 15); // 15/11/2025
  const end = new Date(2025, 10, 25);   // 25/11/2025
  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const wk = d.getDay(); // 0=Dom, 6=Sab
    if (wk !== 0 && wk !== 6) {
      dates.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }
  }
  return dates;
}

function fechaToDBString(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes() )}:00`;
}

// ---------- RNG simple para reproducibilidad ----------
let seed = 987654321;
function rnd() {
  seed = (1103515245 * seed + 12345) % 2147483648;
  return seed / 2147483648;
}
function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

// ---------- MAIN ----------
(async () => {
  try {
    console.log('Iniciando seed...');

    // 1) Insertar usuarios
    const allUsers = [...USERS_ADMIN, ...PELUQUEROS, ...CLIENTES];
    const insertedUsers = [];

    for (const u of allUsers) {
      const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
      const res = await db.runAsync(
        'INSERT INTO usuarios (nombre, apellido, email, telefono, rol, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
        [u.nombre, u.apellido, u.email, u.telefono, u.rol, hash]
      );
      insertedUsers.push({
        id: res.lastID,
        rol: u.rol,
        email: u.email,
        nombre: u.nombre,
        apellido: u.apellido
      });
    }

    const peluquerosInserted = insertedUsers.filter(x => x.rol === 'peluquero');
    const clientesInserted = insertedUsers.filter(x => x.rol === 'cliente');

    console.log(`Admins: ${insertedUsers.filter(u => u.rol === 'admin').length}`);
    console.log(`Peluqueros: ${peluquerosInserted.length}`);
    console.log(`Clientes: ${clientesInserted.length}`);

    // 2) Generar slots para cada peluquero
    const dates = getWorkingDates();
    const totalSlotsPerPeluquero = dates.length * SLOT_TEMPLATE.length;
    const targetOccupied = Math.round(totalSlotsPerPeluquero * 0.65);   // ~65%

    console.log('Días laborales en rango:', dates.length);
    console.log('Slots/día:', SLOT_TEMPLATE.length);
    console.log('Slots totales/peluquero:', totalSlotsPerPeluquero);
    console.log('Slots ocupados objetivo/peluquero:', targetOccupied);

    // 3) Construir lista de turnos (sin estado todavía)
    const allTurns = []; // {usuario_id, peluquero_id, servicio_id, fecha_hora (Date)}

    for (const p of peluquerosInserted) {
      const possibleSlots = [];

      for (const day of dates) {
        for (const [h, m] of SLOT_TEMPLATE) {
          const dt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0);
          possibleSlots.push(dt);
        }
      }

      const chosenSlots = sample(possibleSlots, targetOccupied).sort((a, b) => a - b);

      for (const dt of chosenSlots) {
        const cliente = clientesInserted[Math.floor(rnd() * clientesInserted.length)];
        const servicio_id = rnd() < 0.5 ? 1 : 2; // corte o corte+barba

        allTurns.push({
          usuario_id: cliente.id,
          peluquero_id: p.id,
          servicio_id,
          fecha_hora: dt
        });
      }
    }

    console.log('Turnos generados (sin estado):', allTurns.length);

    // 4) Asignar estados respetando:
    //    - Distribución global aprox:
    //        asistio:       35%
    //        confirmado:    35%
    //        cancelado:     15%
    //        no_asistio:    15%
    //    - asistio / no_asistio: SOLO antes del 19/11/2025
    //    - confirmado / cancelado: cualquier fecha
    //    - Máx 3 confirmados por cliente
    //    - Bien distribuido por peluquero y día (no todo un día en un mismo estado salvo que haya 1 turno)

    const totalTurns = allTurns.length;
    const targetPercent = {
      asistio: 0.35,
      confirmado: 0.35,
      cancelado: 0.15,
      no_asistio: 0.15
    };

    const globalTargets = {};
    let assignedTotal = 0;
    const estados = ['asistio', 'confirmado', 'cancelado', 'no_asistio'];
    for (let i = 0; i < estados.length; i++) {
      const e = estados[i];
      if (i === estados.length - 1) {
        globalTargets[e] = totalTurns - assignedTotal;
      } else {
        const v = Math.round(totalTurns * targetPercent[e]);
        globalTargets[e] = v;
        assignedTotal += v;
      }
    }

    console.log('Targets globales aproximados:', globalTargets);

    const CUTOFF_DATE = new Date(2025, 10, 19); // 19/11/2025 00:00

    // Helper para sacar solo la parte de fecha (YYYY-MM-DD)
    function dateKey(d) {
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    // Agrupar turnos por (peluquero, fecha)
    const groups = {}; // key: `${peluquero_id}|YYYY-MM-DD` -> array indices de allTurns
    allTurns.forEach((t, idx) => {
      const k = `${t.peluquero_id}|${dateKey(t.fecha_hora)}`;
      if (!groups[k]) groups[k] = [];
      groups[k].push(idx);
    });

    // Contador confirmados por cliente
    const confirmadosPorCliente = {};
    clientesInserted.forEach(c => { confirmadosPorCliente[c.id] = 0; });

    // Contador global por estado
    const statusCounts = { asistio: 0, confirmado: 0, cancelado: 0, no_asistio: 0 };

    // Función que calcula mini-targets locales para un grupo
    function localTargets(numTurnos, estadosPosibles) {
      const perc = {
        asistio: 0.35,
        confirmado: 0.35,
        cancelado: 0.15,
        no_asistio: 0.15
      };
      const targets = {};
      let used = 0;
      for (let i = 0; i < estadosPosibles.length; i++) {
        const e = estadosPosibles[i];
        if (i === estadosPosibles.length - 1) {
          targets[e] = numTurnos - used;
        } else {
          const v = Math.round(numTurnos * (perc[e] || (1 / estadosPosibles.length)));
          targets[e] = v;
          used += v;
        }
      }
      return targets;
    }

    // Asignar estados por grupo (peluquero, fecha)
    const groupKeys = Object.keys(groups);
    for (const gKey of groupKeys) {
      const indices = shuffle(groups[gKey]); // aleatorizar orden dentro del grupo
      if (!indices.length) continue;

      // Determinar si este grupo es fecha pasada o futura respecto a 19/11
      const anyTurn = allTurns[indices[0]];
      const isPast = anyTurn.fecha_hora < CUTOFF_DATE;

      let estadosPosibles = [];
      if (isPast) {
        estadosPosibles = ['asistio', 'confirmado', 'cancelado', 'no_asistio'];
      } else {
        estadosPosibles = ['confirmado', 'cancelado'];
      }

      const localTarget = localTargets(indices.length, estadosPosibles);
      const localCounts = {};
      estadosPosibles.forEach(e => localCounts[e] = 0);

      // Helper de asignación dentro de grupo
      function asignarEstadoGrupo(turno, isPastDate) {
        const ordered = estadosPosibles
          .map(s => ({
            s,
            globalDiff: (globalTargets[s] || 0) - (statusCounts[s] || 0),
            localDiff: (localTarget[s] || 0) - (localCounts[s] || 0)
          }))
          // priorizar los que faltan más tanto local como globalmente
          .sort((a, b) => {
            const da = a.localDiff + a.globalDiff * 0.5;
            const db = b.localDiff + b.globalDiff * 0.5;
            return db - da;
          })
          .map(o => o.s);

        let assigned = null;

        for (const estado of ordered) {
          if (!isPastDate && (estado === 'asistio' || estado === 'no_asistio')) continue;
          if (estado === 'confirmado' && confirmadosPorCliente[turno.usuario_id] >= 3) continue;

          // evitar que TODO el grupo quede en el mismo estado (salvo grupo de 1)
          const remaining = indices.length - (localCounts['asistio'] + localCounts['confirmado'] + localCounts['cancelado'] + (localCounts['no_asistio'] || 0));
          if (indices.length > 1 && remaining === 1) {
            // si asignar este estado haría que el grupo tenga todos el mismo estado, evitamos
            const currentNonZero = estadosPosibles.filter(e => localCounts[e] > 0);
            if (currentNonZero.length === 1 && currentNonZero[0] === estado) {
              continue;
            }
          }

          assigned = estado;
          break;
        }

        if (!assigned) {
          // fallback: respetando reglas de negocio
          for (const estado of estadosPosibles) {
            if (!isPastDate && (estado === 'asistio' || estado === 'no_asistio')) continue;
            if (estado === 'confirmado' && confirmadosPorCliente[turno.usuario_id] >= 3) continue;
            assigned = estado;
            break;
          }
        }

        return assigned;
      }

      // Asignar para cada turno del grupo
      for (const idx of indices) {
        const t = allTurns[idx];
        const estado = asignarEstadoGrupo(t, isPast);
        t.estado = estado;
        statusCounts[estado] += 1;
        localCounts[estado] += 1;
        if (estado === 'confirmado') {
          confirmadosPorCliente[t.usuario_id] += 1;
        }
      }
    }

    console.log('Distribución final de estados global:', statusCounts);
    console.log('Ejemplo confirmados por cliente (primeros 10):',
      Object.entries(confirmadosPorCliente).slice(0, 10)
    );

    // 5) Insertar turnos en la DB
    for (const t of allTurns) {
      const fechaStr = fechaToDBString(t.fecha_hora);
      await db.runAsync(
        'INSERT INTO turnos (usuario_id, peluquero_id, servicio_id, fecha_hora, estado) VALUES (?, ?, ?, ?, ?)',
        [t.usuario_id, t.peluquero_id, t.servicio_id, fechaStr, t.estado]
      );
    }

    console.log('Seed completado:');
    console.log('- Usuarios insertados:', insertedUsers.length);
    console.log('- Turnos insertados:', allTurns.length);
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err);
    process.exit(1);
  }
})();
