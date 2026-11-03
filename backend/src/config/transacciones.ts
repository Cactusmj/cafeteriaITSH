import type { PoolConnection } from 'mysql2/promise';
import { pool } from './db.js';

/**
 * Ejecuta una operación dentro de una transacción y garantiza commit o
 * rollback según el resultado.
 */
export async function conTransaccion<T>(
  operacion: (conexion: PoolConnection) => Promise<T>,
): Promise<T> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await operacion(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    try {
      await conexion.rollback();
    } catch {
      // Se conserva el error original de la operación.
    }
    throw error;
  } finally {
    conexion.release();
  }
}
