import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { ROLES_OPERATIVOS, type RolOperativo } from '../config/roles.js';
import { errorConflicto, errorNoEncontrado, errorValidacion } from '../utils/errores.js';
import { hashear } from '../utils/hash.js';
import { aPublico, buscarPorCorreo, type UsuarioPublico } from './auth.service.js';

interface FilaOperativa extends RowDataPacket {
  id: number;
  nombre: string;
  correo: string;
  activo: number;
  rol: string;
}

const CONSULTA_LISTA = `
  SELECT u.id, u.nombre, u.correo, u.activo, r.nombre AS rol
  FROM usuario u
  INNER JOIN rol r ON r.id = u.rol_id
`;

function mapear(fila: FilaOperativa): UsuarioPublico & { activo: boolean } {
  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo,
    rol: fila.rol,
    activo: Boolean(fila.activo),
  };
}

function esRolOperativo(valor: string): valor is RolOperativo {
  return (ROLES_OPERATIVOS as readonly string[]).includes(valor);
}

/** Lista las cuentas operativas, opcionalmente filtradas por rol. */
export async function listarUsuarios(filtroRol?: string): Promise<(UsuarioPublico & { activo: boolean })[]> {
  if (filtroRol !== undefined && !esRolOperativo(filtroRol)) {
    throw errorValidacion('El filtro de rol debe ser cajero o cocinero');
  }

  if (filtroRol) {
    const [filas] = await pool.execute<FilaOperativa[]>(
      `${CONSULTA_LISTA} WHERE r.nombre = ? ORDER BY u.creado_en`,
      [filtroRol],
    );
    return filas.map(mapear);
  }

  const [filas] = await pool.execute<FilaOperativa[]>(
    `${CONSULTA_LISTA} WHERE r.nombre IN (?, ?) ORDER BY u.creado_en`,
    [...ROLES_OPERATIVOS],
  );
  return filas.map(mapear);
}

/** Obtiene una cuenta operativa por id o lanza 404. */
async function obtenerOperativo(id: number): Promise<FilaOperativa> {
  const [filas] = await pool.execute<FilaOperativa[]>(
    `${CONSULTA_LISTA} WHERE u.id = ? AND r.nombre IN (?, ?) LIMIT 1`,
    [id, ...ROLES_OPERATIVOS],
  );
  const fila = filas[0];
  if (!fila) {
    throw errorNoEncontrado('Usuario no encontrado');
  }
  return fila;
}

/** Crea una cuenta operativa (cajero o cocinero). */
export async function crearUsuario(entrada: {
  nombre: string;
  correo: string;
  password: string;
  rol: RolOperativo;
}): Promise<UsuarioPublico & { activo: boolean }> {
  const existente = await buscarPorCorreo(entrada.correo);
  if (existente) {
    throw errorConflicto('CORREO_EN_USO', 'El correo ya está registrado');
  }

  const passwordHash = await hashear(entrada.password);
  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
     SELECT ?, ?, ?, TRUE, r.id FROM rol r WHERE r.nombre = ?`,
    [entrada.nombre, entrada.correo, passwordHash, entrada.rol],
  );

  return {
    id: resultado.insertId,
    nombre: entrada.nombre,
    correo: entrada.correo,
    rol: entrada.rol,
    activo: true,
  };
}

/** Edita una cuenta operativa (campos opcionales). */
export async function editarUsuario(
  id: number,
  entrada: { nombre?: string; correo?: string; password?: string; rol?: RolOperativo },
): Promise<UsuarioPublico & { activo: boolean }> {
  const actual = await obtenerOperativo(id);

  if (entrada.correo && entrada.correo !== actual.correo) {
    const duplicado = await buscarPorCorreo(entrada.correo);
    if (duplicado && duplicado.id !== id) {
      throw errorConflicto('CORREO_EN_USO', 'El correo ya está registrado por otro usuario');
    }
  }

  const campos: string[] = [];
  const valores: (string | number | boolean | null)[] = [];

  if (entrada.nombre !== undefined) {
    campos.push('nombre = ?');
    valores.push(entrada.nombre);
  }
  if (entrada.correo !== undefined) {
    campos.push('correo = ?');
    valores.push(entrada.correo);
  }
  if (entrada.password !== undefined) {
    campos.push('password_hash = ?');
    valores.push(await hashear(entrada.password));
  }
  if (entrada.rol !== undefined) {
    campos.push('rol_id = (SELECT id FROM rol WHERE nombre = ?)');
    valores.push(entrada.rol);
  }

  await pool.execute(
    `UPDATE usuario SET ${campos.join(', ')} WHERE id = ?`,
    [...valores, id],
  );

  const actualizado = await obtenerOperativo(id);
  return mapear(actualizado);
}

/** Habilita o deshabilita una cuenta operativa. No permite deshabilitarse a sí mismo. */
export async function cambiarEstado(
  id: number,
  activo: boolean,
  solicitanteId: number,
): Promise<UsuarioPublico & { activo: boolean }> {
  if (!activo && id === solicitanteId) {
    throw errorConflicto('CONFLICTO', 'No puedes deshabilitar tu propia cuenta');
  }

  await obtenerOperativo(id);

  await pool.execute('UPDATE usuario SET activo = ? WHERE id = ?', [activo, id]);
  const actualizado = await obtenerOperativo(id);
  return mapear(actualizado);
}
