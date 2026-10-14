import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../../config/db.js';
import { obtenerProveedorAvisos, type ProveedorAvisos } from './proveedor-avisos.js';

export interface DatosAvisoListo {
  pedidoId: number;
  usuarioId: number;
  numero: string;
}

export interface Aviso {
  id: number;
  pedido_id: number;
  numero: string | null;
  tipo: string;
  canal: string;
  estado_envio: string;
  fecha: string;
}

export interface PedidoPropio {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  total: string;
  fecha_recoleccion: string | null;
  creado_en: string;
  lineas: number;
}

interface FilaAviso extends RowDataPacket {
  id: number;
  pedido_id: number;
  numero: string;
  tipo: string;
  canal: string;
  estado_envio: string;
  fecha: Date;
}

interface FilaPedidoPropio extends RowDataPacket {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  total: number;
  fecha_recoleccion: Date | null;
  creado_en: Date;
  lineas: number;
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

function formatearFechaHora(valor: Date): string {
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return (
    `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}` +
    `T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}:${dosDigitos(fecha.getSeconds())}`
  );
}

function mapearAviso(fila: FilaAviso): Aviso {
  return {
    id: fila.id,
    pedido_id: fila.pedido_id,
    numero: fila.numero,
    tipo: fila.tipo,
    canal: fila.canal,
    estado_envio: fila.estado_envio,
    fecha: formatearFechaHora(fila.fecha),
  };
}

/**
 * Registra el aviso en-app de pedido listo. El proveedor externo es opcional:
 * su ausencia o fallo nunca bloquea el aviso en-app.
 */
export async function emitirAvisoListo(
  datos: DatosAvisoListo,
  proveedor: ProveedorAvisos = obtenerProveedorAvisos(),
): Promise<Aviso> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO notificacion (pedido_id, tipo, canal, estado_envio)
     VALUES (?, 'pedido_listo', 'app', 'enviada')`,
    [datos.pedidoId],
  );

  try {
    await proveedor.enviarAviso({
      pedidoId: datos.pedidoId,
      usuarioId: datos.usuarioId,
      numero: datos.numero,
    });
  } catch {
    // El aviso en-app ya quedó registrado; lo externo es oportunista.
  }

  return {
    id: resultado.insertId,
    pedido_id: datos.pedidoId,
    numero: datos.numero,
    tipo: 'pedido_listo',
    canal: 'app',
    estado_envio: 'enviada',
    fecha: formatearFechaHora(new Date()),
  };
}

/** Lista los avisos del cliente (o todos si es administrador), pendientes primero. */
export async function listarAvisos(solicitante: {
  id: number;
  rol: string;
}): Promise<Aviso[]> {
  const esAdmin = solicitante.rol === 'administrador';
  const [filas] = await pool.execute<FilaAviso[]>(
    `SELECT n.id, n.pedido_id, p.numero, n.tipo, n.canal, n.estado_envio, n.fecha
     FROM notificacion n
     INNER JOIN pedido p ON p.id = n.pedido_id
     ${esAdmin ? '' : 'WHERE p.usuario_id = ?'}
     ORDER BY (n.estado_envio = 'enviada') DESC, n.fecha DESC
     ${esAdmin ? 'LIMIT 100' : ''}`,
    esAdmin ? [] : [solicitante.id],
  );
  return filas.map(mapearAviso);
}

/** Marca como vistos los avisos pendientes del dueño. */
export async function marcarVistos(usuarioId: number): Promise<{ actualizados: number }> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `UPDATE notificacion n
     INNER JOIN pedido p ON p.id = n.pedido_id
     SET n.estado_envio = 'vista'
     WHERE p.usuario_id = ? AND n.estado_envio = 'enviada'`,
    [usuarioId],
  );
  return { actualizados: resultado.affectedRows };
}

/** Lista los pedidos propios del más reciente al más antiguo. */
export async function obtenerMisPedidos(usuarioId: number): Promise<PedidoPropio[]> {
  const [filas] = await pool.execute<FilaPedidoPropio[]>(
    `SELECT p.id, p.numero, p.tipo, ep.nombre AS estado, p.total,
            p.fecha_recoleccion, p.creado_en, COUNT(pd.id) AS lineas
     FROM pedido p
     INNER JOIN estado_pedido ep ON ep.id = p.estado_id
     LEFT JOIN pedido_detalle pd ON pd.pedido_id = p.id
     WHERE p.usuario_id = ?
     GROUP BY p.id, p.numero, p.tipo, ep.nombre, p.total, p.fecha_recoleccion, p.creado_en
     ORDER BY p.creado_en DESC`,
    [usuarioId],
  );
  return filas.map((fila) => ({
    id: fila.id,
    numero: fila.numero,
    tipo: fila.tipo,
    estado: fila.estado,
    total: Number(fila.total).toFixed(2),
    fecha_recoleccion: fila.fecha_recoleccion ? formatearFechaHora(fila.fecha_recoleccion) : null,
    creado_en: formatearFechaHora(fila.creado_en),
    lineas: Number(fila.lineas),
  }));
}
