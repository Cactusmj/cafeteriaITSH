// ============================================================
// sembrar-usuarios.mjs
// Siembra las cuentas base del Sprint 1 (administrador, cajero, cocinero).
//
// La contraseña NO se guarda en el repositorio: se lee de la variable de
// entorno SEED_PASSWORD y se hashea con bcrypt en tiempo de ejecución.
//
// Uso (desde backend/, con dependencias instaladas y backend/.env configurado):
//   npm run seed:usuarios
// ============================================================

import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const DB_CONFIG = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'cafeteria_itsh',
};

const SEED_PASSWORD = process.env.SEED_PASSWORD;

const CUENTAS = [
  { nombre: 'Administrador ITSH', correo: 'admin@cafeteria-itsh.mx', rol: 'administrador' },
  { nombre: 'Cajero ITSH', correo: 'cajero@cafeteria-itsh.mx', rol: 'cajero' },
  { nombre: 'Cocinero ITSH', correo: 'cocinero@cafeteria-itsh.mx', rol: 'cocinero' },
];

async function obtenerRolId(conexion, nombreRol) {
  const [filas] = await conexion.execute(
    'SELECT id FROM rol WHERE nombre = ? LIMIT 1',
    [nombreRol],
  );
  if (filas.length === 0) {
    throw new Error(`No existe el rol "${nombreRol}". Ejecuta migrations/002_seed_inicial_mysql.sql primero.`);
  }
  return filas[0].id;
}

async function cuentaExiste(conexion, correo) {
  const [filas] = await conexion.execute(
    'SELECT id FROM usuario WHERE correo = ? LIMIT 1',
    [correo],
  );
  return filas.length > 0;
}

async function sembrar() {
  if (!SEED_PASSWORD) {
    throw new Error('Falta la variable de entorno SEED_PASSWORD. Configúrala en backend/.env.');
  }

  const conexion = await mysql.createConnection(DB_CONFIG);
  try {
    for (const cuenta of CUENTAS) {
      if (await cuentaExiste(conexion, cuenta.correo)) {
        console.log(`= ${cuenta.correo} ya existe (sin cambios)`);
        continue;
      }
      const rolId = await obtenerRolId(conexion, cuenta.rol);
      const hash = await bcrypt.hash(SEED_PASSWORD, 10);
      await conexion.execute(
        'INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id) VALUES (?, ?, ?, TRUE, ?)',
        [cuenta.nombre, cuenta.correo, hash, rolId],
      );
      console.log(`+ ${cuenta.correo} creado (rol ${cuenta.rol})`);
    }
  } finally {
    await conexion.end();
  }
}

sembrar().catch((error) => {
  console.error(`Error al sembrar usuarios: ${error.message}`);
  process.exitCode = 1;
});
