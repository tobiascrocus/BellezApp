// ----------------------
// CONFIG & DEPENDENCIAS
// ----------------------
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const util = require('util');

const server = express();
const SERVER_PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'REPLACE_WITH_SECURE_KEY';

server.use(cors());
server.use(bodyParser.json());

// ----------------------
// CONSTANTES DEL SISTEMA
// ----------------------
const USER_ROLES = { ADMIN: 'admin', PELUQUERO: 'peluquero', CLIENTE: 'cliente' };
const APPOINTMENT_STATUS = { CONFIRMADO: 'confirmado', CANCELADO: 'cancelado' };
const CANCELLATION_MIN_HOURS = 3;

// ----------------------
// UTILIDADES DE FECHA
// ----------------------
function formatToSqlDatetime(input) {
  const d = (input instanceof Date) ? input : new Date(input);
  if (isNaN(d)) return null;
  const pad = n => String(n).padStart(2, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

function parseIsoOrSpaceDate(input) {
  if (!input) return null;
  const s = String(input).includes('T') ? input : String(input).replace(' ', 'T');
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

// ----------------------
// BASE DE DATOS (SQLite)
// ----------------------
const database = new sqlite3.Database('./bellezapp.db', (err) => {
  if (err) {
    console.error('Error abriendo la base de datos:', err.message);
    process.exit(1);
  }
});
database.get = util.promisify(database.get);
database.all = util.promisify(database.all);
database.runAsync = function (sql, params) {
  return new Promise((resolve, reject) => {
    database.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// ----------------------
// CREACIÓN DE TABLAS Y SEED
// ----------------------
async function initializeDatabase() {
  const sqlUsuarios = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telefono TEXT,
      rol TEXT CHECK(rol IN ('${USER_ROLES.ADMIN}', '${USER_ROLES.PELUQUERO}', '${USER_ROLES.CLIENTE}')) NOT NULL DEFAULT '${USER_ROLES.CLIENTE}',
      password_hash TEXT NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  const sqlTurnos = `
    CREATE TABLE IF NOT EXISTS turnos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      peluquero_id INTEGER NOT NULL,
      fecha_hora DATETIME NOT NULL,
      estado TEXT CHECK(estado IN ('${APPOINTMENT_STATUS.CONFIRMADO}', '${APPOINTMENT_STATUS.CANCELADO}')) NOT NULL DEFAULT '${APPOINTMENT_STATUS.CONFIRMADO}',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (peluquero_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
  `;
  await database.runAsync(sqlUsuarios, []);
  await database.runAsync(sqlTurnos, []);

  // Seed si no existen
  const seeds = [
    { nombre: 'Admin', apellido: 'Admin', email: 'admin@hotmail.com', telefono: '0123456789', rol: USER_ROLES.ADMIN, password: 'admin' },
    { nombre: 'Juan', apellido: 'Salas', email: '1@hotmail.com', telefono: '0123456789', rol: USER_ROLES.PELUQUERO, password: '123456' },
    { nombre: 'Tobias', apellido: 'Tinaro', email: '2@hotmail.com', telefono: '0123456789', rol: USER_ROLES.CLIENTE, password: '123456' }
  ];

  for (const u of seeds) {
    const existe = await database.get(`SELECT * FROM usuarios WHERE email = ?`, [u.email]);
    if (!existe) {
      await database.runAsync(
        `INSERT INTO usuarios (nombre, apellido, email, telefono, rol, password_hash) VALUES (?, ?, ?, ?, ?, ?)`,
        [u.nombre, u.apellido, u.email, u.telefono, u.rol, u.password]
      );
    }
  }
}
initializeDatabase().catch(err => {
  console.error('Error creando tablas:', err.message);
  process.exit(1);
});

// ----------------------
// VALIDACIONES
// ----------------------
function validateUserPayload(payload, isUpdate = false) {
  const { nombre, apellido, email, telefono, rol, password_hash } = payload;

  if (!isUpdate || (nombre !== undefined)) {
    if (!nombre || nombre.length < 2 || nombre.length > 50) return 'Nombre debe tener entre 2 y 50 caracteres.';
  }
  if (!isUpdate || (apellido !== undefined)) {
    if (!apellido || apellido.length < 2 || apellido.length > 50) return 'Apellido debe tener entre 2 y 50 caracteres.';
  }
  if (!isUpdate || (email !== undefined)) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) return 'Email inválido.';
  }
  if (telefono !== undefined) {
    if (telefono) {
      const telRegex = /^\+?\d+$/;
      if (!telRegex.test(telefono)) return 'Teléfono solo puede contener números y un "+" al inicio.';
      if (telefono.length < 7 || telefono.length > 15) return 'Teléfono debe tener entre 7 y 15 caracteres.';
    }
  }
  if (rol !== undefined && !Object.values(USER_ROLES).includes(rol)) return 'Rol inválido.';
  if (!isUpdate || (password_hash !== undefined)) {
    if (!password_hash || password_hash.length < 6) return 'Password debe tener al menos 6 caracteres.';
  }
  return null;
}

function validateAppointmentBasic(payload, isUpdate = false) {
  const { usuario_id, peluquero_id, fecha_hora, estado } = payload;
  if (!usuario_id) return 'usuario_id es obligatorio.';
  if (!peluquero_id) return 'peluquero_id es obligatorio.';
  if (!fecha_hora || !parseIsoOrSpaceDate(fecha_hora)) return 'fecha_hora inválida.';
  if (!isUpdate && parseIsoOrSpaceDate(fecha_hora) <= new Date()) return 'La fecha y hora debe ser futura.';
  if (estado && !Object.values(APPOINTMENT_STATUS).includes(estado)) return 'Estado inválido.';
  return null;
}

function isWithinBusinessHours(fecha_hora) {
  const date = parseIsoOrSpaceDate(fecha_hora);
  if (!date) return false;
  const hora = date.getHours();
  const minutos = date.getMinutes();

  const withinMorning = (hora >= 9 && hora < 12);
  const withinEvening = (hora >= 17 && hora < 21);
  const validMinutes = (minutos === 0 || minutos === 30);

  return (withinMorning || withinEvening) && validMinutes;
}

async function validateAppointmentFull({ id, usuario_id, peluquero_id, fecha_hora, estado }) {
  const basicErr = validateAppointmentBasic({ usuario_id, peluquero_id, fecha_hora, estado }, Boolean(id));
  if (basicErr) return { ok: false, code: 'invalido', message: basicErr };

  if (!isWithinBusinessHours(fecha_hora)) return { ok: false, code: 'fuera_horario', message: 'Turnos solo entre 9-12 y 17-21 con intervalos de 30 minutos.' };

  if (estado === APPOINTMENT_STATUS.CONFIRMADO) {
    const countRow = await database.get(
      `SELECT COUNT(*) AS count FROM turnos WHERE usuario_id = ? AND estado = ? ${id ? 'AND id != ?' : ''}`,
      id ? [usuario_id, APPOINTMENT_STATUS.CONFIRMADO, id] : [usuario_id, APPOINTMENT_STATUS.CONFIRMADO]
    );
    if (countRow && countRow.count >= 3) return { ok: false, code: 'limite_turnos', message: 'Máximo 3 turnos confirmados permitidos.' };

    const fechaFmt = formatToSqlDatetime(fecha_hora);
    const conflicto = await database.get(
      `SELECT id FROM turnos WHERE peluquero_id = ? AND fecha_hora = ? AND estado = ? ${id ? 'AND id != ?' : ''}`,
      id ? [peluquero_id, fechaFmt, APPOINTMENT_STATUS.CONFIRMADO, id] : [peluquero_id, fechaFmt, APPOINTMENT_STATUS.CONFIRMADO]
    );
    if (conflicto) return { ok: false, code: 'conflicto', message: 'El horario ya está ocupado para ese peluquero.' };
  }

  return { ok: true };
}

// ----------------------
// MIDDLEWARES DE AUTORIZACIÓN
// ----------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token requerido' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.usuario = usuario;
    next();
  });
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Permiso denegado' });
    next();
  };
}

async function ensureBarberExists(peluquero_id) {
  const row = await database.get('SELECT rol FROM usuarios WHERE id = ?', [peluquero_id]);
  if (!row || row.rol !== USER_ROLES.PELUQUERO) throw new Error('peluquero_id inválido.');
}

async function ensureUserExists(usuario_id) {
  const row = await database.get('SELECT id FROM usuarios WHERE id = ?', [usuario_id]);
  if (!row) throw new Error('usuario_id inválido.');
}

// ----------------------
// ENDPOINTS: USUARIOS
// ----------------------

// Registro cliente
server.post('/registro', async (req, res) => {
  try {
    const error = validateUserPayload(req.body);
    if (error) return res.status(400).json({ error });

    const { nombre, apellido, email, telefono, password_hash } = req.body;
    const existeEmail = await database.get('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existeEmail) return res.status(400).json({ error: 'Email ya registrado.' });

    const rol = USER_ROLES.CLIENTE;
    const result = await database.runAsync(
      `INSERT INTO usuarios (nombre, apellido, email, telefono, rol, password_hash) VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, email, telefono || null, rol, password_hash]
    );
    res.json({ id: result.lastID, nombre, apellido, email, telefono, rol });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registro usuario (solo admin)
server.post('/usuarios', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const error = validateUserPayload(req.body);
    if (error) return res.status(400).json({ error });

    const { nombre, apellido, email, telefono, rol, password_hash } = req.body;
    if (rol === USER_ROLES.CLIENTE) return res.status(400).json({ error: 'Clientes se registran desde /registro' });

    const existeEmail = await database.get('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existeEmail) return res.status(400).json({ error: 'Email ya registrado.' });

    const result = await database.runAsync(
      `INSERT INTO usuarios (nombre, apellido, email, telefono, rol, password_hash) VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, email, telefono || null, rol, password_hash]
    );
    res.json({ id: result.lastID, nombre, apellido, email, telefono, rol });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
server.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });

    const user = await database.get('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!user || password !== user.password_hash) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    const token = jwt.sign({ id: user.id, email: user.email, rol: user.rol }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener usuario logueado
server.get('/me', authenticateToken, async (req, res) => {
  try {
    const usuario = await database.get(
      'SELECT id, nombre, apellido, email, telefono, rol, creado_en FROM usuarios WHERE id = ?',
      [req.usuario.id]
    );
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cambiar contraseña
server.put('/usuarios/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password_hash } = req.body;

    if (!password_hash || password_hash.length < 6) {
      return res.status(400).json({ error: 'Password debe tener al menos 6 caracteres.' });
    }

    if (req.usuario.id != id && req.usuario.rol !== USER_ROLES.ADMIN) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const usuario = await database.get('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    await database.runAsync('UPDATE usuarios SET password_hash = ? WHERE id = ?', [password_hash, id]);
    res.json({ mensaje: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar usuarios (admin)
server.get('/usuarios', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT id, nombre, apellido, email, telefono, rol, creado_en FROM usuarios`;
    let params = [];

    if (search) {
      query += ` WHERE nombre LIKE ? OR apellido LIKE ? OR email LIKE ?`;
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    query += ` ORDER BY id LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await database.all(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener usuario por ID
server.get('/usuarios/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioSolicitado = await database.get(
      `SELECT id, nombre, apellido, email, telefono, rol, creado_en FROM usuarios WHERE id = ?`,
      [id]
    );

    if (!usuarioSolicitado) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (req.usuario.rol === USER_ROLES.ADMIN || req.usuario.id == id) return res.json(usuarioSolicitado);

    return res.status(403).json({ error: 'No autorizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar usuario (admin)
server.put('/usuarios/:id', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    const error = validateUserPayload(req.body, true);
    if (error) return res.status(400).json({ error });

    if (req.body.email) {
      const emailExistente = await database.get('SELECT id FROM usuarios WHERE email = ? AND id != ?', [req.body.email, id]);
      if (emailExistente) return res.status(400).json({ error: 'Email ya registrado en otro usuario.' });
    }

    const usuarioActual = await database.get('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (!usuarioActual) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const { nombre, apellido, email, telefono, rol, password_hash } = { ...usuarioActual, ...req.body };

    await database.runAsync(
      `UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, telefono = ?, rol = ?, password_hash = ? WHERE id = ?`,
      [nombre, apellido, email, telefono, rol, password_hash, id]
    );

    res.json({ id, nombre, apellido, email, telefono, rol });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar usuario (admin)
server.delete('/usuarios/:id', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await database.runAsync(`DELETE FROM usuarios WHERE id = ?`, [id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ mensaje: 'Usuario eliminado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------
// ENDPOINTS: TURNOS
// ----------------------

// Disponibilidad por peluquero y fecha
server.get('/disponibilidad/:peluquero_id/:fecha', authenticateToken, async (req, res) => {
  try {
    const { peluquero_id, fecha } = req.params;
    await ensureBarberExists(peluquero_id);

    const horarios = [];
    const fechaBase = new Date(`${fecha}T00:00:00`);
    const intervalos = 30;

    const generarBloques = (inicio, fin) => {
      for (let h = inicio; h < fin; h++) {
        for (let m = 0; m < 60; m += intervalos) {
          const hora = new Date(fechaBase);
          hora.setHours(h, m, 0, 0);
          horarios.push(formatToSqlDatetime(hora));
        }
      }
    };
    generarBloques(9, 12);
    generarBloques(17, 21);

    const turnosOcupados = await database.all(
      `SELECT fecha_hora FROM turnos WHERE peluquero_id = ? AND DATE(fecha_hora) = ? AND estado = ?`,
      [peluquero_id, fecha, APPOINTMENT_STATUS.CONFIRMADO]
    );
    const ocupadosSet = new Set(turnosOcupados.map(t => formatToSqlDatetime(t.fecha_hora)));

    const ahora = new Date();

    const disponibilidad = horarios.map(hora => {
      const fechaDate = parseIsoOrSpaceDate(hora);
      if (fechaDate <= ahora) {
        return { fecha_hora: hora, disponible: false, motivo: 'pasado' };
      }
      if (ocupadosSet.has(hora)) {
        return { fecha_hora: hora, disponible: false, motivo: 'ocupado' };
      }
      return { fecha_hora: hora, disponible: true, motivo: 'disponible' };
    });

    res.json(disponibilidad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear turno
server.post('/turnos', authenticateToken, async (req, res) => {
  try {
    let { usuario_id, peluquero_id, fecha_hora, estado } = req.body;

    if (req.usuario.rol === USER_ROLES.CLIENTE) {
      usuario_id = req.usuario.id;
      if (!peluquero_id) return res.status(400).json({ error: 'peluquero_id es obligatorio para turno' });
      await ensureBarberExists(peluquero_id);
    } else if (req.usuario.rol === USER_ROLES.PELUQUERO) {
      if (!usuario_id) return res.status(400).json({ error: 'usuario_id es obligatorio para turno creado por peluquero' });
      await ensureUserExists(usuario_id);
      peluquero_id = req.usuario.id;
    } else if (req.usuario.rol === USER_ROLES.ADMIN) {
      if (!usuario_id || !peluquero_id) return res.status(400).json({ error: 'usuario_id y peluquero_id son obligatorios' });
      await ensureUserExists(usuario_id);
      await ensureBarberExists(peluquero_id);
    } else {
      return res.status(403).json({ error: 'No autorizado para crear turnos' });
    }

    if (!fecha_hora) return res.status(400).json({ error: 'fecha_hora es obligatorio' });
    if (!estado) estado = APPOINTMENT_STATUS.CONFIRMADO;

    const fechaDate = parseIsoOrSpaceDate(fecha_hora);
    if (!fechaDate) return res.status(400).json({ error: 'fecha_hora inválida' });
    const fechaFmt = formatToSqlDatetime(fechaDate);

    const validation = await validateAppointmentFull({ usuario_id, peluquero_id, fecha_hora: fechaFmt, estado });
    if (!validation.ok) {
      return res.status(400).json({ error: validation.message, motivo: validation.code });
    }

    const result = await database.runAsync(
      `INSERT INTO turnos (usuario_id, peluquero_id, fecha_hora, estado) VALUES (?, ?, ?, ?)`,
      [usuario_id, peluquero_id, fechaFmt, estado]
    );
    res.json({ id: result.lastID, usuario_id, peluquero_id, fecha_hora: fechaFmt, estado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar turnos
server.get('/turnos', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 10, fecha, estado } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT t.id, t.fecha_hora, t.estado,
             c.nombre || ' ' || c.apellido AS cliente,
             p.nombre || ' ' || p.apellido AS peluquero
      FROM turnos t
      JOIN usuarios c ON t.usuario_id = c.id
      JOIN usuarios p ON t.peluquero_id = p.id
    `;
    const params = [];
    const where = [];

    if (req.usuario.rol === USER_ROLES.CLIENTE) {
      where.push('t.usuario_id = ?');
      params.push(req.usuario.id);
    } else if (req.usuario.rol === USER_ROLES.PELUQUERO) {
      where.push('t.peluquero_id = ?');
      params.push(req.usuario.id);
    } else if (search) {
      where.push('(c.nombre LIKE ? OR c.apellido LIKE ? OR p.nombre LIKE ? OR p.apellido LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (fecha) {
      where.push('DATE(t.fecha_hora) = ?');
      params.push(fecha);
    }
    if (estado) {
      where.push('t.estado = ?');
      params.push(estado);
    }

    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ` ORDER BY t.fecha_hora DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const turnos = await database.all(query, params);
    res.json(turnos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancelar turno
server.post('/turnos/:id/cancelar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const turno = await database.get('SELECT * FROM turnos WHERE id = ?', [id]);
    if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });

    const user = req.usuario;
    if (
      (user.rol === USER_ROLES.CLIENTE && turno.usuario_id !== user.id) &&
      (user.rol === USER_ROLES.PELUQUERO && turno.peluquero_id !== user.id) &&
      user.rol !== USER_ROLES.ADMIN
    ) {
      return res.status(403).json({ error: 'No autorizado para cancelar' });
    }

    if (turno.estado === APPOINTMENT_STATUS.CANCELADO) return res.status(400).json({ error: 'Turno ya cancelado' });

    const fechaTurno = parseIsoOrSpaceDate(turno.fecha_hora);
    const ahora = new Date();
    const diffMs = fechaTurno - ahora;
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs < CANCELLATION_MIN_HOURS) {
      return res.status(400).json({ error: `No se puede cancelar con menos de ${CANCELLATION_MIN_HOURS} horas de anticipación.` });
    }

    await database.runAsync(`UPDATE turnos SET estado = ? WHERE id = ?`, [APPOINTMENT_STATUS.CANCELADO, id]);
    res.json({ mensaje: 'Turno cancelado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar turno (admin)
server.delete('/turnos/:id', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await database.runAsync('DELETE FROM turnos WHERE id = ?', [id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Turno no encontrado' });
    res.json({ mensaje: 'Turno eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------
// INICIO DEL SERVIDOR
// ----------------------
server.listen(SERVER_PORT, () => console.log(`Servidor corriendo en http://localhost:${SERVER_PORT}`));