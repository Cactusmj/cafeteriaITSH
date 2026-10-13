import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { errorConflicto, errorNoEncontrado, errorValidacion } from '../utils/errores.js';
import { esFechaISO, hoyISO } from '../utils/fecha.js';

interface FilaEntradaAdmin extends RowDataPacket {
  id: number;
  fecha: string;
  platillo_id: number;
  platillo: string;
  categoria: string | null;
  precio: string;
  disponible: number;
  especial: number;
  platillo_activo: number;
}

interface FilaEntradaPublica extends RowDataPacket {
  id: number;
  platillo: string;
  categoria: string | null;
  descripcion: string | null;
  precio: string;
  disponible: number;
  especial: number;
  activo: number;
}

export interface EntradaMenuAdmin {
  id: number;
  fecha: string;
  platillo_id: number;
  platillo: string;
  categoria: string | null;
  precio: string;
  disponible: boolean;
  especial: boolean;
  platillo_activo: boolean;
}

export interface EntradaMenuPublica {
  id: number;
  platillo: string;
  categoria: string | null;
  descripcion: string | null;
  precio: string;
  disponible: boolean;
  especial: boolean;
}

function formatearPrecio(valor: string | number): string {
  return Number(valor).toFixed(2);
}

function mapearAdmin(fila: FilaEntradaAdmin): EntradaMenuAdmin {
  return {
    id: fila.id,
    fecha: fila.fecha,
    platillo_id: fila.platillo_id,
    platillo: fila.platillo,
    categoria: fila.categoria,
    precio: formatearPrecio(fila.precio),
    disponible: Boolean(fila.disponible),
    especial: Boolean(fila.especial),
    platillo_activo: Boolean(fila.platillo_activo),
  };
}

/** Lista las entradas del menú de una fecha (gestión). */
export async function listarMenuAdmin(fechaISO: string): Promise<EntradaMenuAdmin[]> {
  const [filas] = await pool.execute<FilaEntradaAdmin[]>(
    `SELECT md.id, md.fecha, md.platillo_id, p.nombre AS platillo, p.categoria,
            md.precio, md.disponible, md.especial, p.activo AS platillo_activo
     FROM menu_dia md
     INNER JOIN platillo p ON p.id = md.platillo_id
     WHERE md.fecha = ?
     ORDER BY p.categoria, md.especial DESC, p.nombre`,
    [fechaISO],
  );
  return filas.map(mapearAdmin);
}

async function obtenerEntradaAdmin(id: number): Promise<FilaEntradaAdmin> {
  const [filas] = await pool.execute<FilaEntradaAdmin[]>(
    `SELECT md.id, md.fecha, md.platillo_id, p.nombre AS platillo, p.categoria,
            md.precio, md.disponible, md.especial, p.activo AS platillo_activo
     FROM menu_dia md
     INNER JOIN platillo p ON p.id = md.platillo_id
     WHERE md.id = ?
     LIMIT 1`,
    [id],
  );
  const fila = filas[0];
  if (!fila) {
    throw errorNoEncontrado('Entrada de menú no encontrada');
  }
  return fila;
}

/** Agrega un platillo al menú de una fecha (por defecto la del servidor). */
export async function agregarAlMenu(entrada: {
  fecha?: string;
  platillo_id: number;
  precio: number;
  especial?: boolean;
}): Promise<EntradaMenuAdmin> {
  const fecha = entrada.fecha ?? hoyISO();

  const [platillos] = await pool.execute<RowDataPacket[]>(
    'SELECT id, nombre, categoria, activo FROM platillo WHERE id = ? LIMIT 1',
    [entrada.platillo_id],
  );
  const platillo = platillos[0];
  if (!platillo) {
    throw errorNoEncontrado('Platillo no encontrado');
  }
  if (!platillo.activo) {
    throw errorConflicto('PLATILLO_INACTIVO', 'El platillo está desactivado y no puede agregarse al menú');
  }

  const [duplicados] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM menu_dia WHERE fecha = ? AND platillo_id = ? LIMIT 1',
    [fecha, entrada.platillo_id],
  );
  if (duplicados.length > 0) {
    throw errorConflicto('DUPLICADO', 'El platillo ya está en el menú de esa fecha');
  }

  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO menu_dia (fecha, platillo_id, precio, disponible, especial)
     VALUES (?, ?, ?, TRUE, ?)`,
    [fecha, entrada.platillo_id, entrada.precio, entrada.especial ? 1 : 0],
  );

  return {
    id: resultado.insertId,
    fecha,
    platillo_id: entrada.platillo_id,
    platillo: platillo.nombre,
    categoria: platillo.categoria ?? null,
    precio: formatearPrecio(entrada.precio),
    disponible: true,
    especial: entrada.especial ?? false,
    platillo_activo: true,
  };
}

/** Actualiza precio, disponibilidad o especial de una entrada del menú. */
export async function editarEntradaMenu(
  id: number,
  entrada: { precio?: number; disponible?: boolean; especial?: boolean },
): Promise<EntradaMenuAdmin> {
  await obtenerEntradaAdmin(id);

  const campos: string[] = [];
  const valores: (string | number)[] = [];

  if (entrada.precio !== undefined) {
    campos.push('precio = ?');
    valores.push(entrada.precio);
  }
  if (entrada.disponible !== undefined) {
    campos.push('disponible = ?');
    valores.push(entrada.disponible ? 1 : 0);
  }
  if (entrada.especial !== undefined) {
    campos.push('especial = ?');
    valores.push(entrada.especial ? 1 : 0);
  }

  await pool.execute(`UPDATE menu_dia SET ${campos.join(', ')} WHERE id = ?`, [...valores, id]);

  return mapearAdmin(await obtenerEntradaAdmin(id));
}

/** Elimina una entrada del menú; 409 si ya tiene pedidos referenciados. */
export async function eliminarEntradaMenu(id: number): Promise<{ eliminado: boolean }> {
  await obtenerEntradaAdmin(id);

  const [referencias] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM pedido_detalle WHERE menu_dia_id = ? LIMIT 1',
    [id],
  );
  if (referencias.length > 0) {
    throw errorConflicto('REFERENCIADO', 'No se puede eliminar: existen pedidos con este platillo');
  }

  await pool.execute('DELETE FROM menu_dia WHERE id = ?', [id]);
  return { eliminado: true };
}

/** Consulta pública del menú de una fecha con disponibilidad efectiva. */
export async function obtenerMenuPublico(fechaISO: string): Promise<EntradaMenuPublica[]> {
  if (!esFechaISO(fechaISO)) {
    throw errorValidacion('La fecha debe tener el formato YYYY-MM-DD');
  }

  const [filas] = await pool.execute<FilaEntradaPublica[]>(
    `SELECT md.id, p.nombre AS platillo, p.categoria, p.descripcion,
            md.precio, md.disponible, md.especial, p.activo
     FROM menu_dia md
     INNER JOIN platillo p ON p.id = md.platillo_id
     WHERE md.fecha = ?
     ORDER BY p.categoria, md.especial DESC, p.nombre`,
    [fechaISO],
  );

  return filas.map((fila) => ({
    id: fila.id,
    platillo: fila.platillo,
    categoria: fila.categoria,
    descripcion: fila.descripcion,
    precio: formatearPrecio(fila.precio),
    disponible: Boolean(fila.disponible) && Boolean(fila.activo),
    especial: Boolean(fila.especial),
  }));
}
