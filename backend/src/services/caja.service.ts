import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';

export interface PendienteCaja {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  total: string;
  cliente_nombre: string | null;
  lineas: number;
}

interface FilaPendiente extends RowDataPacket {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  total: number;
  cliente_nombre: string | null;
}

interface FilaConteo extends RowDataPacket {
  pedido_id: number;
  lineas: number;
}

/**
 * Pendientes de caja: pedidos Listo (ambos orígenes, para entregar) más
 * mostrador Pendiente/Pagado (para cobrar), ordenados por llegada.
 */
export async function obtenerPendientes(): Promise<PendienteCaja[]> {
  const [filas] = await pool.execute<FilaPendiente[]>(
    `SELECT p.id, p.numero, p.tipo, ep.nombre AS estado, p.total, p.cliente_nombre
     FROM pedido p
     INNER JOIN estado_pedido ep ON ep.id = p.estado_id
     WHERE ep.nombre = 'Listo'
        OR (p.tipo = 'mostrador' AND ep.nombre IN ('Pendiente', 'Pagado'))
     ORDER BY p.creado_en ASC`,
  );
  if (filas.length === 0) {
    return [];
  }

  const ids = filas.map((fila) => fila.id);
  const [conteos] = await pool.execute<FilaConteo[]>(
    `SELECT pedido_id, COUNT(*) AS lineas
     FROM pedido_detalle
     WHERE pedido_id IN (${ids.map(() => '?').join(', ')})
     GROUP BY pedido_id`,
    ids,
  );
  const porPedido = new Map(conteos.map((conteo) => [conteo.pedido_id, Number(conteo.lineas)]));

  return filas.map((fila) => ({
    id: fila.id,
    numero: fila.numero,
    tipo: fila.tipo,
    estado: fila.estado,
    total: Number(fila.total).toFixed(2),
    cliente_nombre: fila.cliente_nombre,
    lineas: porPedido.get(fila.id) ?? 0,
  }));
}
