// server.js

// ---------- IMPORTS ----------
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const util = require('util');
require('dotenv').config();

// ---------- CONSTANTES ----------
const SERVER_PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('ERROR FATAL: La variable de entorno JWT_SECRET no está definida en el archivo .env');
  process.exit(1);
}

const SALT_ROUNDS = 10;

const USER_ROLES = { ADMIN: 'admin', PELUQUERO: 'peluquero', CLIENTE: 'cliente' };
const APPOINTMENT_STATUS = { CONFIRMADO: 'confirmado', CANCELADO: 'cancelado', ASISTIO: 'asistio', NO_ASISTIO: 'no_asistio' };
const BUSINESS_HOURS = [{ start: 9, end: 12 }, { start: 17, end: 21 }];
const SLOT_INTERVAL = 30; // minutos
const MAX_TURNOS_CLIENTE = 3;

const BUSINESS_TIMEZONE_OFFSET = parseInt(process.env.BUSINESS_TIMEZONE_OFFSET || '-3'); // Offset del negocio (ej. Argentina = -3)

// --- Constantes para el Límite de Intentos de Contraseña ---
const PASSWORD_ATTEMPT_LIMIT = 5; // Máximo de intentos fallidos
const PASSWORD_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutos en milisegundos
const PASSWORD_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos de bloqueo
const failedPasswordAttempts = new Map(); // Almacén en memoria para los intentos

// --- Constantes para el Límite de Intentos de LOGIN ---
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000;
const LOGIN_LOCKOUT_DURATION = 15 * 60 * 1000;
const failedLoginAttempts = new Map(); // Almacén en memoria para los intentos de login

// ---------- INICIALIZACIÓN EXPRESS ----------
const server = express();

const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

server.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true
}));
server.use(express.json());

// ---------- BASE DE DATOS ----------
const db = new sqlite3.Database('./bellezapp.db', err => {
  if (err) {
    console.error('Error al conectar DB:', err.message);
    process.exit(1);
  }
});

// Promisify para async/await
db.get = util.promisify(db.get);
db.all = util.promisify(db.all);
db.runAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err); else resolve(this);
    });
  });
};

// ---------- UTILIDADES ----------
const sendResponse = (res, ok, data = null, message = '', code = 200) =>
  res.status(code).json({ ok, data, message });

const parseDate = input => {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d.getTime();
};

const formatDate = timestamp => {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().replace('T', ' ').slice(0, 19);
};

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const hashPassword = async password => bcrypt.hash(password, SALT_ROUNDS);

// ---------- VALIDACIÓN DE USUARIOS ----------
const validateUser = (p, isUpdate = false) => {
  const { nombre, apellido, email, telefono, rol, password } = p;
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/; // Permite letras (con acentos, ñ, ü), espacios, apóstrofes y guiones.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const telRegex = /^\+?\d+$/;

  // Para creación (isUpdate=false), todos los campos requeridos deben estar.
  // Para actualización (isUpdate=true), solo validamos los campos que se envían (no son undefined).

  if (nombre !== undefined) {
    if (typeof nombre !== 'string' || nombre.length < 3 || nombre.length > 15) return 'Nombre debe tener entre 3 y 15 caracteres.';
    if (!nameRegex.test(nombre)) return 'Nombre contiene caracteres inválidos.';
  }
  if (apellido !== undefined) {
    if (typeof apellido !== 'string' || apellido.length < 3 || apellido.length > 15) return 'Apellido debe tener entre 3 y 15 caracteres.';
    if (!nameRegex.test(apellido)) return 'Apellido contiene caracteres inválidos.';
  }
  if (email !== undefined) {
    if (typeof email !== 'string' || !emailRegex.test(email)) return 'Email inválido.';
  }
  if (telefono !== undefined && telefono !== null && telefono !== '') {
    if (typeof telefono !== 'string' || !telRegex.test(telefono) || telefono.length < 7 || telefono.length > 15) return 'Teléfono inválido.';
  }
  if (rol !== undefined && !Object.values(USER_ROLES).includes(rol)) return 'Rol inválido.';
  if ((!isUpdate && (!password || password.length < 6)) || (isUpdate && password !== undefined && password.length < 6)) return 'Password debe tener al menos 6 caracteres.';

  return null;
};

// ---------- HELPERS DB ----------
const getUserById = async id =>
  db.get('SELECT id, nombre, apellido, email, telefono, rol, avatar, creado_en FROM usuarios WHERE id = ?', [id]);

const ensureExists = async (table, id, roleCheck) => {
  const row = await db.get(`SELECT * FROM ${table} WHERE id=?`, [id]);
  if (!row) throw new Error(`${table} id inválido`);
  if (roleCheck && row.rol !== roleCheck) throw new Error(`${table} rol inválido`);
  return row;
};

const updateTable = async (table, id, fields) => {
  const updates = [];
  const values = [];
  for (const key in fields) if (fields[key] !== undefined) { updates.push(`${key}=?`); values.push(fields[key]); }
  if (updates.length) await db.runAsync(`UPDATE ${table} SET ${updates.join(',')} WHERE id=?`, [...values, id]);
};

// ---------- TURNOS HELPERS ----------
const isWithinBusinessHours = timestamp => {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return false;
  // Convertir hora UTC a la hora local del negocio usando el offset
  const hUTC = d.getUTCHours();
  const hLocal = (hUTC + BUSINESS_TIMEZONE_OFFSET + 24) % 24;
  const m = d.getUTCMinutes();
  return BUSINESS_HOURS.some(b => (hLocal >= b.start && hLocal < b.end)) && (m === 0 || m === 30);
};

const getLocalDayOfWeek = (timestamp) => {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return null;

  // Calculamos la hora local teórica para ver si el offset nos movió de día
  const hLocal = d.getUTCHours() + BUSINESS_TIMEZONE_OFFSET;
  let day = d.getUTCDay(); // Día en UTC (0-6)

  if (hLocal < 0) {
    day = (day + 6) % 7; // Retrocedemos un día (domingo 0 -> sábado 6)
  } else if (hLocal >= 24) {
    day = (day + 1) % 7; // Avanzamos un día (sábado 6 -> domingo 0)
  }

  return day;
};

const checkConflict = async (peluqueroId, fechaHora, excludeId = null) => {
  const timestampMs = parseDate(fechaHora);
  const ts = Math.floor(timestampMs / 1000); // SQLite unixepoch usa segundos

  let sql = `
    SELECT t.id FROM turnos t
    JOIN servicios s ON t.servicio_id = s.id
    WHERE t.peluquero_id = ? AND t.estado = ?
    AND ? >= unixepoch(t.fecha_hora) 
    AND ? < (unixepoch(t.fecha_hora) + (s.duracion_minutos * 60))
  `;
  const params = [peluqueroId, APPOINTMENT_STATUS.CONFIRMADO, ts, ts];

  if (excludeId) { sql += ' AND t.id != ?'; params.push(excludeId); }
  return (await db.get(sql, params)) ? 'Horario ocupado para ese peluquero.' : null;
};

const checkUserTurnLimit = async (usuarioId, excludeId = null) => {
  const sql = `SELECT COUNT(*) AS c FROM turnos WHERE usuario_id=? AND estado=?${excludeId ? ' AND id!=?' : ''}`;
  const params = excludeId ? [usuarioId, APPOINTMENT_STATUS.CONFIRMADO, excludeId] : [usuarioId, APPOINTMENT_STATUS.CONFIRMADO];
  const row = await db.get(sql, params);
  return row && row.c >= MAX_TURNOS_CLIENTE ? `Máximo ${MAX_TURNOS_CLIENTE} turnos confirmados permitidos.` : null;
};

const validateAppointment = async ({ id, usuarioId, peluqueroId, fechaHora, estado, servicioId }) => {
  const timestamp = parseDate(fechaHora);
  if (!usuarioId || !peluqueroId || !timestamp) return { ok: false, message: 'Datos de turno inválidos' };
  if ([0, 6].includes(getLocalDayOfWeek(timestamp))) return { ok: false, message: 'No se pueden reservar turnos en fines de semana' };
  if (!isWithinBusinessHours(timestamp)) return { ok: false, message: 'Turnos solo entre 9-12 y 17-21 con intervalos de 30 min.' };

  // Verificar que el cliente no tenga otro turno a la misma hora (con cualquier peluquero)
  const mismoHorarioCliente = await db.get(
    `SELECT id FROM turnos 
     WHERE usuario_id = ? 
     AND fecha_hora = ? 
     AND estado = ? 
     AND id != ?`,
    [usuarioId, formatDate(timestamp), APPOINTMENT_STATUS.CONFIRMADO, id || 0]
  );
  if (mismoHorarioCliente) {
    return { ok: false, message: 'Ya tenés un turno confirmado en ese mismo horario con otro peluquero.' };
  }

  const serv = await db.get('SELECT duracion_minutos FROM servicios WHERE id=?', [servicioId]);
  if (!serv) return { ok: false, message: 'Servicio inválido.' };

  // Verificar solapamiento con cualquier otro turno confirmado del cliente (incluso parcial)
  const fechaStrSql = formatDate(timestamp);
  const turnosSolapados = await db.all(
    `SELECT t.id 
     FROM turnos t
     JOIN servicios s ON t.servicio_id = s.id
     WHERE t.usuario_id = ? 
       AND t.estado = ? 
       AND t.id != ?
       AND datetime(t.fecha_hora) < datetime(?, '+' || ? || ' minutes')
       AND datetime(t.fecha_hora, '+' || s.duracion_minutos || ' minutes') > datetime(?)`,
    [usuarioId, APPOINTMENT_STATUS.CONFIRMADO, id || 0, fechaStrSql, serv.duracion_minutos, fechaStrSql]
  );

  if (turnosSolapados.length > 0) {
    return { ok: false, message: 'El horario seleccionado se solapa con otro turno que ya tenés confirmado.' };
  }

  if (estado === APPOINTMENT_STATUS.CONFIRMADO) {
    if (timestamp < Date.now()) return { ok: false, message: 'No se pueden confirmar turnos en el pasado.' };
    const limite = await checkUserTurnLimit(usuarioId, id);
    if (limite) return { ok: false, message: limite };
    const start = new Date(timestamp);
    for (let offset = 0; offset < serv.duracion_minutos; offset += SLOT_INTERVAL) {
      const checkStart = new Date(start.getTime() + offset * 60 * 1000);
      const conflict = await checkConflict(peluqueroId, checkStart, id);
      if (conflict) return { ok: false, message: conflict };
    }
  }
  return { ok: true };
};

// ---------- AUTENTICACIÓN Y AUTORIZACIÓN ----------
const authenticateToken = asyncHandler(async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return sendResponse(res, false, null, 'Token requerido', 401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return sendResponse(res, false, null, 'Token inválido', 401);
    req.usuario = user;
    next();
  });
});

const authorizeRoles = (...roles) => asyncHandler(async (req, res, next) => {
  if (!req.usuario || !roles.includes(req.usuario.rol)) return sendResponse(res, false, null, 'Permiso denegado', 403);
  next();
});

// ---------- INICIALIZACIÓN DB ----------
async function initDB() {
  await db.runAsync('PRAGMA foreign_keys = ON;');
  const sqls = [
    `CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telefono TEXT,
      rol TEXT CHECK(rol IN ('${USER_ROLES.ADMIN}','${USER_ROLES.PELUQUERO}','${USER_ROLES.CLIENTE}')) NOT NULL DEFAULT '${USER_ROLES.CLIENTE}',
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT '/assets/images/Perfil/Avatar.png',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      duracion_minutos INTEGER NOT NULL CHECK(duracion_minutos>0)
    );`,
    `CREATE TABLE IF NOT EXISTS turnos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      peluquero_id INTEGER NOT NULL,
      servicio_id INTEGER NOT NULL DEFAULT 1,
      fecha_hora DATETIME NOT NULL,
      estado TEXT CHECK(estado IN ('${APPOINTMENT_STATUS.CONFIRMADO}','${APPOINTMENT_STATUS.CANCELADO}','${APPOINTMENT_STATUS.ASISTIO}','${APPOINTMENT_STATUS.NO_ASISTIO}')) NOT NULL DEFAULT '${APPOINTMENT_STATUS.CONFIRMADO}',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY(peluquero_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY(servicio_id) REFERENCES servicios(id)
    );`
  ];
  for (const sql of sqls) await db.runAsync(sql);

  const serviciosBase = [
    { nombre: 'Corte', duracion_minutos: 30 },
    { nombre: 'Corte + Barba', duracion_minutos: 60 }
  ];
  for (const s of serviciosBase) {
    if (!await db.get('SELECT id FROM servicios WHERE nombre=?', [s.nombre])) {
      await db.runAsync('INSERT INTO servicios(nombre,duracion_minutos) VALUES (?,?)', [s.nombre, s.duracion_minutos]);
    }
  }

  await db.runAsync('CREATE INDEX IF NOT EXISTS idx_turnos_peluquero_fecha ON turnos(peluquero_id, fecha_hora);');
  await db.runAsync(`CREATE UNIQUE INDEX IF NOT EXISTS ux_turno_peluquero_fecha_confirmado ON turnos(peluquero_id, fecha_hora) WHERE estado='confirmado';`);
}

initDB().catch(e => { console.error('Error inicializando DB:', e); process.exit(1); });

// ---------- RUTAS AUTENTICACIÓN ----------

// Registro de cliente
server.post('/api/register', asyncHandler(async (req, res) => {
  const error = validateUser(req.body);
  if (error) return sendResponse(res, false, null, error, 400);

  const { nombre, apellido, email, telefono, password } = req.body;
  const existing = await db.get('SELECT id FROM usuarios WHERE email=?', [email]);
  if (existing) return sendResponse(res, false, null, 'Email ya registrado.', 400);

  const passwordHash = await hashPassword(password);
  await db.runAsync(
    'INSERT INTO usuarios (nombre, apellido, email, telefono, rol, password_hash) VALUES (?,?,?,?,?,?)',
    [nombre, apellido, email, telefono, USER_ROLES.CLIENTE, passwordHash]
  );

  sendResponse(res, true, null, '¡Te registraste correctamente! Inicia sesión para continuar.');
}));

// Login
server.post('/api/login', asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) return sendResponse(res, false, null, 'Email y contraseña requeridos', 400);

  // --- NUEVO: Lógica de Rate Limiting para Login ---
  const now = Date.now();
  const attemptInfo = failedLoginAttempts.get(email.toLowerCase());

  if (attemptInfo && attemptInfo.lockoutUntil > now) {
    const remainingMinutes = Math.ceil((attemptInfo.lockoutUntil - now) / 60000);
    return sendResponse(res, false, null, `Demasiados intentos fallidos. Por favor, inténtalo de nuevo en ${remainingMinutes} minutos.`, 429);
  }

  const recordFailedAttempt = () => {
    let newAttemptInfo = attemptInfo || { count: 0, firstAttempt: now };
    if (now - newAttemptInfo.firstAttempt > LOGIN_ATTEMPT_WINDOW) {
      newAttemptInfo = { count: 0, firstAttempt: now };
    }
    newAttemptInfo.count++;
    if (newAttemptInfo.count >= LOGIN_ATTEMPT_LIMIT) {
      newAttemptInfo.lockoutUntil = now + LOGIN_LOCKOUT_DURATION;
    }
    failedLoginAttempts.set(email.toLowerCase(), newAttemptInfo);
  };

  const user = await db.get('SELECT * FROM usuarios WHERE email=?', [email]);
  if (!user) {
    recordFailedAttempt();
    return sendResponse(res, false, null, 'El email o la contraseña no coinciden', 401);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    recordFailedAttempt();
    return sendResponse(res, false, null, 'El email o la contraseña no coinciden', 401);
  }

  failedLoginAttempts.delete(email.toLowerCase()); // Limpiamos los intentos si el login es exitoso
  const expiresIn = rememberMe ? '30d' : '8h';
  const token = jwt.sign({ id: user.id, rol: user.rol }, JWT_SECRET, { expiresIn });
  sendResponse(res, true, { token, rol: user.rol, id: user.id }, 'Login exitoso');
}));

// Obtener perfil propio
server.get('/api/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await getUserById(req.usuario.id);
  if (!user) return sendResponse(res, false, null, 'Usuario no encontrado', 404);
  sendResponse(res, true, user);
}));

// Actualizar perfil propio
server.put('/api/me', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.usuario.id;
  const { nombre, apellido, telefono, oldPassword, newPassword, avatar } = req.body;

  // Validamos los campos, pasando newPassword como 'password' para la validación de longitud.
  // El email se ignora intencionadamente para no permitir su modificación desde este endpoint.
  const error = validateUser({ nombre, apellido, telefono, password: newPassword || undefined }, true);
  if (error) return sendResponse(res, false, null, error, 400);

  // --- Lógica de Contraseña ---
  // Si se está intentando cambiar la contraseña (o se ha introducido la contraseña vieja por error),
  // la validación es lo primero que debe ocurrir.
  if (oldPassword) {
    // --- NUEVO: Lógica de Rate Limiting ---
    const now = Date.now();
    const attemptInfo = failedPasswordAttempts.get(userId);

    if (attemptInfo && attemptInfo.lockoutUntil > now) {
      const remainingMinutes = Math.ceil((attemptInfo.lockoutUntil - now) / 60000);
      return sendResponse(res, false, null, `Demasiados intentos fallidos. Por favor, inténtalo de nuevo en ${remainingMinutes} minutos.`, 429);
    }

    const user = await db.get('SELECT password_hash FROM usuarios WHERE id = ?', [userId]);
    if (!user) return sendResponse(res, false, null, 'Usuario no encontrado.', 404);

    const validOldPassword = await bcrypt.compare(oldPassword, user.password_hash);

    if (!validOldPassword) {
      // --- NUEVO: Registrar intento fallido ---
      let newAttemptInfo = attemptInfo || { count: 0, firstAttempt: now };
      
      // Si el primer intento fue hace más de 15 minutos, reseteamos el contador.
      if (now - newAttemptInfo.firstAttempt > PASSWORD_ATTEMPT_WINDOW) {
        newAttemptInfo = { count: 0, firstAttempt: now };
      }
      newAttemptInfo.count++;
      if (newAttemptInfo.count >= PASSWORD_ATTEMPT_LIMIT) {
        newAttemptInfo.lockoutUntil = now + PASSWORD_LOCKOUT_DURATION;
      }
      failedPasswordAttempts.set(userId, newAttemptInfo);
      // Si la contraseña anterior es incorrecta, detenemos TODO. No se actualiza nada.
      return sendResponse(res, false, null, 'La contraseña anterior es incorrecta.', 403);
    }
  }

  // --- Lógica de Actualización de Campos ---
  // El email no se incluye en los campos a actualizar directamente aquí.
  const fields = { nombre, apellido, telefono, avatar };
  // Si la contraseña anterior fue válida Y se proporcionó una nueva, la hasheamos y la añadimos para actualizarla.
  if (oldPassword && newPassword) {
    // --- NUEVO: Limpiar intentos fallidos si el cambio es exitoso ---
    failedPasswordAttempts.delete(userId);
    fields.password_hash = await hashPassword(newPassword);
  }

  await updateTable('usuarios', userId, fields);

  const actualizado = await getUserById(userId); // Obtenemos el usuario actualizado sin el hash
  sendResponse(res, true, actualizado, 'Perfil actualizado correctamente');
}));

// ---------- RUTAS USUARIOS (solo admin) ----------
server.get('/api/usuarios', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), asyncHandler(async (req, res) => {
  const usuarios = await db.all('SELECT id, nombre, apellido, email, telefono, rol, avatar, creado_en FROM usuarios');
  sendResponse(res, true, usuarios);
}));

server.post('/api/usuarios', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), asyncHandler(async (req, res) => {
  const error = validateUser(req.body);
  if (error) return sendResponse(res, false, null, error, 400);

  const { nombre, apellido, email, telefono, rol, password, avatar } = req.body;

  const existing = await db.get('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (existing) return sendResponse(res, false, null, 'El email ya está registrado.', 400);

  const passwordHash = await hashPassword(password);
  const avatarFinal = avatar || '/assets/images/Perfil/Avatar.png';
  const result = await db.runAsync(
    'INSERT INTO usuarios (nombre, apellido, email, telefono, rol, password_hash, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nombre, apellido, email, telefono, rol || USER_ROLES.CLIENTE, passwordHash, avatarFinal]
  );
  const newUser = await getUserById(result.lastID);
  sendResponse(res, true, newUser, 'Usuario creado correctamente', 201);
}));

server.get('/api/usuarios/:id', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) return sendResponse(res, false, null, 'Usuario no encontrado', 404);
  sendResponse(res, true, user);
}));

server.put('/api/usuarios/:id', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const current = await getUserById(id);
  if (!current) return sendResponse(res, false, null, 'Usuario no encontrado', 404);

  const error = validateUser(req.body, true);
  if (error) return sendResponse(res, false, null, error, 400);

  const { nombre, apellido, email, telefono, rol, password, avatar } = req.body;
  const fields = { nombre, apellido, email, telefono, rol, avatar };
  if (password) fields.password_hash = await hashPassword(password);

  await updateTable('usuarios', id, fields);
  const updated = await getUserById(id);
  sendResponse(res, true, updated, 'Usuario actualizado');
}));

server.delete('/api/usuarios/:id', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), asyncHandler(async (req, res) => {
  const idToDelete = parseInt(req.params.id);
  const loggedUserId = req.usuario.id;

  // 1. Evitar que el administrador se elimine a sí mismo
  if (idToDelete === loggedUserId) {
    return sendResponse(res, false, null, 'No puedes eliminarte a ti mismo', 400);
  }

  // 2. Verificar si el usuario existe y su rol
  const userToDelete = await db.get('SELECT rol FROM usuarios WHERE id = ?', [idToDelete]);
  if (!userToDelete) {
    return sendResponse(res, false, null, 'Usuario no encontrado', 404);
  }

  // 3. Evitar eliminar al último administrador
  if (userToDelete.rol === USER_ROLES.ADMIN) {
    const admins = await db.get('SELECT COUNT(*) as total FROM usuarios WHERE rol = ?', [USER_ROLES.ADMIN]);
    if (admins.total <= 1) {
      return sendResponse(res, false, null, 'No puedes eliminar al último administrador del sistema', 400);
    }
  }

  await db.runAsync('DELETE FROM usuarios WHERE id=?', [idToDelete]);
  sendResponse(res, true, null, 'Usuario eliminado');
}));

// ---------- RUTA PELUQUEROS ----------
server.get('/api/peluqueros', authenticateToken, asyncHandler(async (req, res) => {
  const peluqueros = await db.all("SELECT id, nombre, apellido FROM usuarios WHERE rol = ?", [USER_ROLES.PELUQUERO]);
  sendResponse(res, true, peluqueros);
}));
// ---------- RUTAS SERVICIOS ----------
server.get('/api/servicios', authenticateToken, asyncHandler(async (req, res) => {
  const servicios = await db.all('SELECT * FROM servicios');
  sendResponse(res, true, servicios);
}));

// ---------- RUTAS TURNOS ----------
server.get('/api/turnos', authenticateToken, asyncHandler(async (req, res) => {
  const { rol, id } = req.usuario;
  const { view } = req.query; // Leemos el parámetro 'view'
  let query = `
    SELECT t.*, unixepoch(t.fecha_hora) * 1000 as fecha_timestamp, (u.nombre || ' ' || u.apellido) AS cliente_nombre, (p.nombre || ' ' || p.apellido) AS peluquero_nombre, s.nombre AS servicio_nombre
    FROM turnos t
    LEFT JOIN usuarios u ON t.usuario_id=u.id
    LEFT JOIN usuarios p ON t.peluquero_id=p.id
    LEFT JOIN servicios s ON t.servicio_id=s.id
  `;
  const params = [];

  // Si es la vista de agenda, el peluquero ve sus turnos asignados y el admin ve todos.
  if (view === 'agenda') {
    if (rol === USER_ROLES.PELUQUERO) {
      query += ' WHERE t.peluquero_id=?';
      params.push(id);
    }
    // Si es admin, no se añade filtro, lo cual es correcto.
  } else { // Si no, es la vista "Mis Turnos" (personal)
    query += ' WHERE t.usuario_id=?';
    params.push(id);
  }
  query += ' ORDER BY t.fecha_hora DESC';

  const turnos = await db.all(query, params);

  // Lógica para tratar turnos pasados como "asistio" si siguen "confirmado"
  const ahora = new Date();
  const turnosProcesados = turnos.map(turno => {
    const fechaTurno = turno.fecha_timestamp;
    if (turno.estado === APPOINTMENT_STATUS.CONFIRMADO && fechaTurno < ahora) {
      return { ...turno, estado: APPOINTMENT_STATUS.ASISTIO };
    }
    return turno;
  });
  sendResponse(res, true, turnosProcesados);
}));

server.post('/api/turnos', authenticateToken, asyncHandler(async (req, res) => {
  const { rol, id: userIdFromToken } = req.usuario;
  let { usuario_id, peluquero_id, servicio_id, fecha, hora } = req.body;

  // Un cliente solo puede reservar para sí mismo.
  if (rol === USER_ROLES.CLIENTE) {
    usuario_id = userIdFromToken;
  }

  // Validar que llegaron fecha y hora
  if (!fecha || !hora) {
    return sendResponse(res, false, null, 'Debes enviar fecha y hora del turno.', 400);
  }

  // Construir timestamp usando la zona horaria del negocio (BUSINESS_TIMEZONE_OFFSET)
  const [year, month, day] = fecha.split('-').map(Number);
  const [hour, minute] = hora.split(':').map(Number);
  
  // Creamos un Date en UTC con la fecha y hora LOCAL del negocio
  const fechaHoraLocalUTC = Date.UTC(year, month - 1, day, hour, minute);
  // Ajustamos restando el offset del negocio (porque el negocio está adelantado/atrasado respecto a UTC)
  const timestamp = fechaHoraLocalUTC - BUSINESS_TIMEZONE_OFFSET * 60 * 60 * 1000;
  
  const fechaStr = formatDate(timestamp);
  if (!fechaStr) return sendResponse(res, false, null, 'Fecha inválida', 400);

  // Verificamos que los IDs existen
  await ensureExists('usuarios', usuario_id);
  await ensureExists('usuarios', peluquero_id, USER_ROLES.PELUQUERO);
  await ensureExists('servicios', servicio_id);

  const valid = await validateAppointment({ 
    id: null, 
    usuarioId: usuario_id, 
    peluqueroId: peluquero_id, 
    fechaHora: timestamp, 
    estado: APPOINTMENT_STATUS.CONFIRMADO, 
    servicioId: servicio_id 
  });
  if (!valid.ok) return sendResponse(res, false, null, valid.message, 400);

  await db.runAsync(
    'INSERT INTO turnos (usuario_id, peluquero_id, servicio_id, fecha_hora, estado) VALUES (?,?,?,?,?)',
    [usuario_id, peluquero_id, servicio_id, fechaStr, APPOINTMENT_STATUS.CONFIRMADO]
  );
  sendResponse(res, true, null, 'Turno creado correctamente');
}));

server.put('/api/turnos/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const turno = await db.get('SELECT * FROM turnos WHERE id=?', [id]);
  if (!turno) return sendResponse(res, false, null, 'Turno no encontrado', 404);
  
  const { rol, id: userIdFromToken } = req.usuario;
  // Solo el admin, el cliente dueño del turno o el peluquero asignado pueden modificarlo.
  if (rol !== USER_ROLES.ADMIN && turno.usuario_id !== userIdFromToken && turno.peluquero_id !== userIdFromToken) {
    return sendResponse(res, false, null, 'No tienes permiso para modificar este turno.', 403);
  }

  let { fecha_hora, estado, servicio_id, peluquero_id, usuario_id } = { ...turno, ...req.body };

  // Un cliente no puede reasignar el turno a otro usuario.
  if (rol === USER_ROLES.CLIENTE) {
    usuario_id = turno.usuario_id;
  }

  // El peluquero solo puede cambiar el estado, no la fecha ni otros detalles.
  // El admin puede cambiar todo.
  const fieldsToUpdate = {};
  if (rol === USER_ROLES.ADMIN) {
    fieldsToUpdate.fecha_hora = formatDate(fecha_hora);
    fieldsToUpdate.servicio_id = servicio_id;
  }

  // Solo validamos conflictos si se cambian datos que afectan la agenda y el turno está confirmado.
  if (rol === USER_ROLES.ADMIN && estado === APPOINTMENT_STATUS.CONFIRMADO) {
    const valid = await validateAppointment({ id, usuarioId: usuario_id, peluqueroId: peluquero_id, fechaHora: fecha_hora, estado, servicioId: servicio_id });
    if (!valid.ok) return sendResponse(res, false, null, valid.message, 400);
  }
  fieldsToUpdate.estado = estado;
  await updateTable('turnos', id, fieldsToUpdate);
  const actualizado = await db.get('SELECT * FROM turnos WHERE id=?', [id]);
  sendResponse(res, true, actualizado, 'Turno actualizado correctamente');
}));

server.delete('/api/turnos/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const turno = await db.get('SELECT * FROM turnos WHERE id=?', [id]);
  if (!turno) return sendResponse(res, false, null, 'Turno no encontrado', 404);

  const { rol, id: userIdFromToken } = req.usuario;
  // Solo el admin, el cliente dueño del turno o el peluquero asignado pueden cancelarlo.
  if (rol !== USER_ROLES.ADMIN && turno.usuario_id !== userIdFromToken && turno.peluquero_id !== userIdFromToken) {
    return sendResponse(res, false, null, 'No tienes permiso para cancelar este turno.', 403);
  }

  await updateTable('turnos', id, { estado: APPOINTMENT_STATUS.CANCELADO });
  sendResponse(res, true, null, 'Turno cancelado');
}));

// ---------- DISPONIBILIDAD ----------
server.get('/api/disponibilidad', authenticateToken, asyncHandler(async (req, res) => {
  const { fecha, peluquero_id } = req.query;
  if (!fecha) return sendResponse(res, false, null, 'Fecha requerida (YYYY-MM-DD)', 400);

  const [year, month, day] = fecha.split('-').map(Number);
  // Definimos el inicio y fin del día ajustados a la zona horaria del negocio
  const startOfDayUTC = Date.UTC(year, month - 1, day, 0, 0, 0) - (BUSINESS_TIMEZONE_OFFSET * 60 * 60 * 1000);
  const endOfDayUTC = startOfDayUTC + 86400000 - 1;

  // Validar fin de semana de forma directa usando los componentes de la fecha recibida
  // Esto es más robusto que calcularlo a partir del timestamp desplazado.
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  if ([0, 6].includes(dayOfWeek)) return sendResponse(res, false, null, 'No se pueden reservar turnos en fines de semana', 400);

  const peluqueros = peluquero_id
    ? [await ensureExists('usuarios', peluquero_id, USER_ROLES.PELUQUERO)]
    : await db.all('SELECT id, nombre, apellido FROM usuarios WHERE rol=?', [USER_ROLES.PELUQUERO]);

  // Obtener todos los turnos confirmados para la fecha y peluqueros seleccionados
  const turnosDelDia = await db.all(`
    SELECT t.peluquero_id, unixepoch(t.fecha_hora) * 1000 as start_ts, s.duracion_minutos
    FROM turnos t
    JOIN servicios s ON t.servicio_id = s.id
    WHERE t.estado = ? AND unixepoch(t.fecha_hora) * 1000 BETWEEN ? AND ?
      AND t.peluquero_id IN (${peluqueros.map(() => '?').join(',')})
  `, [APPOINTMENT_STATUS.CONFIRMADO, startOfDayUTC, endOfDayUTC, ...peluqueros.map(p => p.id)]);

  const disponibilidad = {};
  for (const p of peluqueros) {
    const turnosPeluquero = turnosDelDia.filter(t => t.peluquero_id === p.id);
    disponibilidad[p.id] = [];
    for (const bloque of BUSINESS_HOURS) {
      for (let h = bloque.start; h < bloque.end; h++) {
        for (let m of [0, 30]) {
          // Generamos el timestamp UTC exacto que corresponde a la hora local del negocio
          const slotTime = Date.UTC(year, month - 1, day, h, m) - (BUSINESS_TIMEZONE_OFFSET * 60 * 60 * 1000);
          
          const ocupado = turnosPeluquero.some(turno => {
            const turnoStart = turno.start_ts; // Usamos el timestamp directamente de la DB
            const turnoEnd = turnoStart + turno.duracion_minutos * 60 * 1000;
            return slotTime >= turnoStart && slotTime < turnoEnd;
          });

          disponibilidad[p.id].push({ hora: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`, disponible: !ocupado });
        }
      }
    }
  }

  sendResponse(res, true, disponibilidad);
}));

// ---------- MANEJO DE ERRORES ----------
server.use((err, req, res, next) => {
  console.error('Error interno:', err);
  sendResponse(res, false, null, 'Error interno del servidor', 500);
});

// ---------- INICIO DEL SERVIDOR ----------
server.listen(SERVER_PORT, () => console.log(`Servidor corriendo en puerto ${SERVER_PORT}`));