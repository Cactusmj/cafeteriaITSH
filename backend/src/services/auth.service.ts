import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { ROL } from '../config/roles.js';
import { errorConflicto, errorNoAutorizado } from '../utils/errores.js';
import { hashear, verificar } from '../utils/hash.js';
import { firmar } from '../utils/jwt.js';

/** Datos de usuario aptos para devolver al cliente (sin hash). */
export interface UsuarioPublico {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

/** Usuario con datos internos (hash, estado). */
export interface UsuarioAlmacenado extends UsuarioPublico {
  passwordHash: string;
  activo: boolean;
}

export interface SesionCreada {
  token: string;
  usuario: UsuarioPublico;
}

interface FilaUsuario extends RowDataPacket {
  id: number;
  nombre: string;
  correo: string;
  password_hash: string;
  activo: number;
  rol: string;
}

const CONSULTA_BASE = `
  SELECT u.id, u.nombre, u.correo, u.password_hash, u.activo, r.nombre AS rol
  FROM usuario u
  INNER JOIN rol r ON r.id = u.rol_id
`;

function mapear(fila: FilaUsuario): UsuarioAlmacenado {
  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo,
    rol: fila.rol,
    passwordHash: fila.password_hash,
    activo: Boolean(fila.activo),
  };
}

export function aPublico(usuario: UsuarioAlmacenado): UsuarioPublico {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
  };
}

/** Busca un usuario por correo (case-sensitive según la BD). */
export async function buscarPorCorreo(correo: string): Promise<UsuarioAlmacenado | null> {
  const [filas] = await pool.execute<FilaUsuario[]>(
    `${CONSULTA_BASE} WHERE u.correo = ? LIMIT 1`,
    [correo],
  );
  const fila = filas[0];
  return fila ? mapear(fila) : null;
}

/** Obtiene un usuario por id. */
export async function obtenerUsuarioPorId(id: number): Promise<UsuarioPublico | null> {
  const [filas] = await pool.execute<FilaUsuario[]>(
    `${CONSULTA_BASE} WHERE u.id = ? LIMIT 1`,
    [id],
  );
  const fila = filas[0];
  return fila ? aPublico(mapear(fila)) : null;
}

/** Registra un cliente nuevo (rol `usuario`) y devuelve su sesión. */
export async function registrarCliente(entrada: {
  nombre: string;
  correo: string;
  password: string;
}): Promise<SesionCreada> {
  const existente = await buscarPorCorreo(entrada.correo);
  if (existente) {
    throw errorConflicto('CORREO_EN_USO', 'El correo ya está registrado');
  }

  const passwordHash = await hashear(entrada.password);
  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
     SELECT ?, ?, ?, TRUE, r.id FROM rol r WHERE r.nombre = ?`,
    [entrada.nombre, entrada.correo, passwordHash, ROL.CLIENTE],
  );

  const usuario: UsuarioPublico = {
    id: resultado.insertId,
    nombre: entrada.nombre,
    correo: entrada.correo,
    rol: ROL.CLIENTE,
  };
  return { token: firmar({ id: usuario.id, rol: usuario.rol }), usuario };
}

/** Inicia sesión verificando la contraseña y que la cuenta esté activa. */
export async function iniciarSesion(entrada: {
  correo: string;
  password: string;
}): Promise<SesionCreada> {
  const usuario = await buscarPorCorreo(entrada.correo);
  if (!usuario) {
    throw errorNoAutorizado('Credenciales inválidas');
  }

  const coincide = await verificar(entrada.password, usuario.passwordHash);
  if (!coincide || !usuario.activo) {
    throw errorNoAutorizado('Credenciales inválidas');
  }

  return { token: firmar({ id: usuario.id, rol: usuario.rol }), usuario: aPublico(usuario) };
}
