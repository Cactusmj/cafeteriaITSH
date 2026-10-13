import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import type { Categoria } from '../config/categorias.js';
import { errorConflicto, errorNoEncontrado } from '../utils/errores.js';

interface FilaPlatillo extends RowDataPacket {
  id: number;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  activo: number;
}

export interface Platillo {
  id: number;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  activo: boolean;
}

const CONSULTA_PLATILLO = `
  SELECT p.id, p.nombre, p.categoria, p.descripcion, p.activo
  FROM platillo p
`;

function mapear(fila: FilaPlatillo): Platillo {
  return {
    id: fila.id,
    nombre: fila.nombre,
    categoria: fila.categoria,
    descripcion: fila.descripcion,
    activo: Boolean(fila.activo),
  };
}

/** Lista el catálogo; por defecto solo platillos activos. */
export async function listarPlatillos(incluirInactivos = false): Promise<Platillo[]> {
  if (incluirInactivos) {
    const [filas] = await pool.execute<FilaPlatillo[]>(
      `${CONSULTA_PLATILLO} ORDER BY p.categoria, p.nombre`,
    );
    return filas.map(mapear);
  }

  const [filas] = await pool.execute<FilaPlatillo[]>(
    `${CONSULTA_PLATILLO} WHERE p.activo = TRUE ORDER BY p.categoria, p.nombre`,
  );
  return filas.map(mapear);
}

/** Obtiene un platillo por id o lanza 404. */
async function obtenerPlatillo(id: number): Promise<FilaPlatillo> {
  const [filas] = await pool.execute<FilaPlatillo[]>(
    `${CONSULTA_PLATILLO} WHERE p.id = ? LIMIT 1`,
    [id],
  );
  const fila = filas[0];
  if (!fila) {
    throw errorNoEncontrado('Platillo no encontrado');
  }
  return fila;
}

async function verificarNombreDisponible(nombre: string, exceptoId?: number): Promise<void> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT p.id FROM platillo p WHERE p.nombre = ? AND p.activo = TRUE LIMIT 1`,
    [nombre],
  );
  const existente = filas[0];
  if (existente && existente.id !== exceptoId) {
    throw errorConflicto('NOMBRE_EN_USO', 'Ya existe un platillo activo con ese nombre');
  }
}

/** Crea un platillo activo en el catálogo. */
export async function crearPlatillo(entrada: {
  nombre: string;
  categoria: Categoria;
  descripcion?: string;
}): Promise<Platillo> {
  await verificarNombreDisponible(entrada.nombre);

  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO platillo (nombre, categoria, descripcion, activo) VALUES (?, ?, ?, TRUE)`,
    [entrada.nombre, entrada.categoria, entrada.descripcion ?? null],
  );

  return {
    id: resultado.insertId,
    nombre: entrada.nombre,
    categoria: entrada.categoria,
    descripcion: entrada.descripcion ?? null,
    activo: true,
  };
}

/** Edita nombre, categoría o descripción de un platillo. */
export async function editarPlatillo(
  id: number,
  entrada: { nombre?: string; categoria?: Categoria; descripcion?: string },
): Promise<Platillo> {
  const actual = await obtenerPlatillo(id);

  if (entrada.nombre && entrada.nombre !== actual.nombre) {
    await verificarNombreDisponible(entrada.nombre, id);
  }

  const campos: string[] = [];
  const valores: (string | null)[] = [];

  if (entrada.nombre !== undefined) {
    campos.push('nombre = ?');
    valores.push(entrada.nombre);
  }
  if (entrada.categoria !== undefined) {
    campos.push('categoria = ?');
    valores.push(entrada.categoria);
  }
  if (entrada.descripcion !== undefined) {
    campos.push('descripcion = ?');
    valores.push(entrada.descripcion);
  }

  await pool.execute(`UPDATE platillo SET ${campos.join(', ')} WHERE id = ?`, [
    ...valores,
    id,
  ]);

  return mapear(await obtenerPlatillo(id));
}

/** Activa o desactiva un platillo (baja lógica; nunca se borra físicamente). */
export async function cambiarActivoPlatillo(id: number, activo: boolean): Promise<Platillo> {
  await obtenerPlatillo(id);
  await pool.execute('UPDATE platillo SET activo = ? WHERE id = ?', [activo, id]);
  return mapear(await obtenerPlatillo(id));
}
