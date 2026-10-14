import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';

export interface LineaTablero {
  platillo: string;
  cantidad: number;
}

export interface PedidoTablero {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  cliente: string;
  minutos_en_espera: number;
  total: string;
  creado_en: string;
  detalle: LineaTablero[];
}

interface FilaTablero extends RowDataPacket {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  cliente_nombre: string | null;
  duenio: string | null;
  total: number;
  creado_en: Date;
}

interface FilaDetalleTablero extends RowDataPacket {
  pedido_id: number;
  platillo: string;
  cantidad: number;
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

/** Tablero de cocina: Pagado, En preparación y Listo de ambos orígenes por llegada. */
export async function obtenerTablero(): Promise<PedidoTablero[]> {
  const [filas] = await pool.execute<FilaTablero[]>(
    `SELECT p.id, p.numero, p.tipo, ep.nombre AS estado, p.cliente_nombre,
            u.nombre AS duenio, p.total, p.creado_en
     FROM pedido p
     INNER JOIN estado_pedido ep ON ep.id = p.estado_id
     LEFT JOIN usuario u ON u.id = p.usuario_id
     WHERE ep.nombre IN ('Pagado', 'En preparación', 'Listo')
     ORDER BY p.creado_en ASC`,
  );
  if (filas.length === 0) {
    return [];
  }

  const ids = filas.map((fila) => fila.id);
  const [lineas] = await pool.execute<FilaDetalleTablero[]>(
    `SELECT pd.pedido_id, pl.nombre AS platillo, pd.cantidad
     FROM pedido_detalle pd
     INNER JOIN menu_dia md ON md.id = pd.menu_dia_id
     INNER JOIN platillo pl ON pl.id = md.platillo_id
     WHERE pd.pedido_id IN (${ids.map(() => '?').join(', ')})
     ORDER BY pd.id`,
    ids,
  );
  const porPedido = new Map<number, LineaTablero[]>();
  for (const linea of lineas) {
    const lista = porPedido.get(linea.pedido_id) ?? [];
    lista.push({ platillo: linea.platillo, cantidad: linea.cantidad });
    porPedido.set(linea.pedido_id, lista);
  }

  const ahora = Date.now();
  return filas.map((fila) => {
    const creado = fila.creado_en instanceof Date ? fila.creado_en : new Date(fila.creado_en);
    return {
      id: fila.id,
      numero: fila.numero,
      tipo: fila.tipo,
      estado: fila.estado,
      cliente: fila.cliente_nombre ?? fila.duenio ?? 'Mostrador',
      minutos_en_espera: Math.max(0, Math.floor((ahora - creado.getTime()) / 60_000)),
      total: Number(fila.total).toFixed(2),
      creado_en: `${creado.getFullYear()}-${dosDigitos(creado.getMonth() + 1)}-${dosDigitos(creado.getDate())}T${dosDigitos(creado.getHours())}:${dosDigitos(creado.getMinutes())}:${dosDigitos(creado.getSeconds())}`,
      detalle: porPedido.get(fila.id) ?? [],
    };
  });
}
