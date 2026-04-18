// seedUsuarios.js - Poblar la base de datos con datos de prueba
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const DB_PATH = './bellezapp.db';
const SALT_ROUNDS = 10;

// Roles
const USER_ROLES = { ADMIN: 'admin', PELUQUERO: 'peluquero', CLIENTE: 'cliente' };

// Datos predefinidos
const admins = [
  { nombre: 'Tobias', apellido: 'Tinaro', email: 'tobiascrocus@hotmail.com', telefono: '+5493548608805', rol: USER_ROLES.ADMIN, password: '123456' },
  { nombre: 'Admin', apellido: 'Admin', email: 'admin@hotmail.com', telefono: '+5493548304875', rol: USER_ROLES.ADMIN, password: 'admin' }
];

const peluqueros = [
  { nombre: 'Damian', apellido: 'Aguirre', email: 'peluquero1@hotmail.com', telefono: '+5493548204512', rol: USER_ROLES.PELUQUERO, password: 'peluquero1' },
  { nombre: 'Gustavo', apellido: 'Perez', email: 'peluquero2@hotmail.com', telefono: '+5493548358465', rol: USER_ROLES.PELUQUERO, password: 'peluquero2' },
  { nombre: 'Franco', apellido: 'Salas', email: 'peluquero3@hotmail.com', telefono: '+5493548120478', rol: USER_ROLES.PELUQUERO, password: 'peluquero3' },
  { nombre: 'Pedro', apellido: 'Gomez', email: 'peluquero4@hotmail.com', telefono: '+5493548334688', rol: USER_ROLES.PELUQUERO, password: 'peluquero4' }
];

// Función para barajar un array (Fisher-Yates)
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generar 44 clientes realistas (hombres argentinos)
const generarClientes = () => {
  const nombres = [
    'Juan', 'Carlos', 'Luis', 'Martín', 'Diego', 'Javier', 'Fernando', 'Pablo', 'Sergio', 'Alejandro',
    'Gabriel', 'Matías', 'Nicolás', 'Federico', 'Tomás', 'Emiliano', 'Lucas', 'Franco', 'Bruno', 'Leandro',
    'Gonzalo', 'Fabián', 'Rodrigo', 'Ezequiel', 'Joaquín', 'Sebastián', 'Marcos', 'Adrián', 'Mauricio', 'Claudio'
  ];
  const apellidos = [
    'García', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'González', 'Pérez', 'Gómez', 'Díaz', 'Suárez',
    'Álvarez', 'Romero', 'Sosa', 'Torres', 'Ramírez', 'Flores', 'Benítez', 'Acosta', 'Medina', 'Herrera',
    'Castro', 'Rojas', 'Ortega', 'Vega', 'Ramos', 'Molina', 'Figueroa', 'Correa', 'Aguirre', 'Navarro'
  ];
  const telefonos = [
    '1123456789', '1134567890', '1145678901', '1156789012', '1167890123', '1178901234', '1189012345', '1190123456',
    '3511234567', '3512345678', '3513456789', '3514567890', '3515678901', '3516789012', '3517890123', '3518901234',
    '3411234567', '3412345678', '3413456789', '3414567890', '2611234567', '2612345678', '2613456789', '2614567890',
    '2211234567', '2212345678', '2213456789', '2214567890', '2231234567', '2232345678', '2233456789', '2234567890'
  ];

  // Barajar nombres y apellidos para que no aparezcan siempre en el mismo orden
  const shuffledNombres = shuffleArray([...nombres]);
  const shuffledApellidos = shuffleArray([...apellidos]);

  const clientes = [];
  for (let i = 0; i < 44; i++) {
    // Índices con pasos primos para dispersar uniformemente
    const nombreIdx = (i * 13) % shuffledNombres.length;
    const apellidoIdx = (i * 7) % shuffledApellidos.length;
    const telefonoIdx = i % telefonos.length;

    const nombre = shuffledNombres[nombreIdx];
    const apellido = shuffledApellidos[apellidoIdx];
    const email = `${nombre.toLowerCase()}${apellido.toLowerCase()}${i + 1}@hotmail.com`;
    const telefono = `+549${telefonos[telefonoIdx]}`;

    clientes.push({
      nombre,
      apellido,
      email,
      telefono,
      rol: USER_ROLES.CLIENTE,
      password: 'cliente'  // contraseña más robusta
    });
  }
  return clientes;
};

const clientes = generarClientes();
const todosUsuarios = [...admins, ...peluqueros, ...clientes];

// Conectar a la DB
const db = new sqlite3.Database(DB_PATH, async (err) => {
  if (err) {
    console.error('Error conectando a la DB para seed:', err.message);
    process.exit(1);
  }
  console.log('Conectado a la base de datos para seed.');

  try {
    // Verificar si ya hay usuarios
    const count = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM usuarios', (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });

    if (count > 0) {
      console.log(`La tabla usuarios ya tiene ${count} registros. No se ejecuta seed.`);
      db.close();
      return;
    }

    console.log('Tabla usuarios vacía. Insertando datos de prueba...');

    // Hashear contraseñas e insertar
    let insertados = { admin: 0, peluquero: 0, cliente: 0 };
    for (const user of todosUsuarios) {
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO usuarios (nombre, apellido, email, telefono, rol, password_hash, avatar)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [user.nombre, user.apellido, user.email, user.telefono, user.rol, hashedPassword, '/assets/images/Perfil/Avatar.png'],
          function(err) {
            if (err) reject(err);
            else {
              insertados[user.rol]++;
              resolve();
            }
          }
        );
      });
    }

    console.log(`Seed completado:`);
    console.log(`  - ${insertados.admin} administradores`);
    console.log(`  - ${insertados.peluquero} peluqueros`);
    console.log(`  - ${insertados.cliente} clientes`);
    console.log(`Total: ${insertados.admin + insertados.peluquero + insertados.cliente} usuarios insertados.`);

    db.close();
  } catch (error) {
    console.error('Error durante el seed:', error);
    db.close();
    process.exit(1);
  }
});