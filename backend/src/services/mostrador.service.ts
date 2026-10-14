import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { ROL } from '../config/roles.js';
import { ErrorAplicacion } from '../utils/errores.js';
import {
  cargarPago,
  cargarPedido,
  esDuplicado,
  formatearFechaHora,
  formatearImporte,
  generarFolio,
  obtenerPedidoPorId,
  validarItemsMenuDia,
  type LineaPedidoEntrada,
  type PedidoRespuesta,
} from './pedidos.service.js';

const INTENTOS_FOLIO = 3;

export interface CrearMostradorParametros {
  cajeroId: number;
  clienteNombre?: string;
  claveIdempotencia: string;
  items: LineaPedidoEntrada[];
}

export interface CobroRespuesta {
  id: number;
  numero: string;
  estado: string;
  total: string;
  monto_recibido: string;
  cambio: string;
  pago: {
    metodo: string;
    monto: string;
    referencia: string | null;
    fecha: string;
  };
}

/** Busca un mostrador por su clave de idempotencia (lo ve el cajero). */
export async function buscarPedidoPorClaveMostrador(
  claveIdempotencia: string,
  cajeroId: number,
): Promise<PedidoRespuesta | null> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM pedido WHERE clave_idempotencia = ? LIMIT 1',
    [claveIdempotencia],
  );
  const fila = filas[0];
  if (!fila) {
    return null;
  }
  return obtenerPedidoPorId(fila.id, { id: cajeroId, rol: ROL.CAJERO });
}

/** Crea un pedido de mostrador en estado Pendiente (sin horario de recolección). */
export async function crearMostrador(parametros: CrearMostradorParametros): Promise<PedidoRespuesta> {
  const [previos] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM pedido WHERE clave_idempotencia = ? LIMIT 1',
    [parametros.claveIdempotencia],
  );
  if (previos[0]) {
    return obtenerPedidoPorId(previos[0].id, { id: parametros.cajeroId, rol: ROL.CAJERO });
  }

  const [estados] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM estado_pedido WHERE nombre = 'Pendiente' LIMIT 1",
  );
  const estadoId = estados[0]?.id;
  if (!estadoId) {
    throw new Error('Falta el estado base Pendiente en la base de datos');
  }

  const { lineas, total, porId } = await validarItemsMenuDia(parametros.items);

  let resultado: ResultSetHeader | null = null;
  let numero = '';
  for (let intento = 0; intento < INTENTOS_FOLIO; intento += 1) {
    numero = generarFolio();
    try {
      const [insersion] = await pool.execute<ResultSetHeader>(
        `INSERT INTO pedido (numero, tipo, estado_id, usuario_id, cliente_nombre, fecha_recoleccion, total, creado_por, clave_idempotencia)
         VALUES (?, 'mostrador', ?, NULL, ?, NULL, ?, ?, ?)`,
        [
          numero,
          estadoId,
          parametros.clienteNombre?.trim() || null,
          formatearImporte(total),
          parametros.cajeroId,
          parametros.claveIdempotencia,
        ],
      );
      resultado = insersion;
      break;
    } catch (error) {
      if (!esDuplicado(error)) {
        throw error;
      }
    }
  }

  if (!resultado) {
    const [existentes] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM pedido WHERE clave_idempotencia = ? LIMIT 1',
      [parametros.claveIdempotencia],
    );
    if (existentes[0]) {
      return obtenerPedidoPorId(existentes[0].id, { id: parametros.cajeroId, rol: ROL.CAJERO });
    }
    throw new ErrorAplicacion(500, 'ERROR_INTERNO', 'No se pudo crear el pedido, intente de nuevo');
  }

  const pedidoId = resultado.insertId;
  for (const item of parametros.items) {
    const entrada = porId.get(item.menu_dia_id);
    if (!entrada) {
      continue;
    }
    await pool.execute<ResultSetHeader>(
      `INSERT INTO pedido_detalle (pedido_id, menu_dia_id, cantidad, precio_unitario, subtotal)
       VALUES (?, ?, ?, ?, ?)`,
      [
        pedidoId,
        item.menu_dia_id,
        item.cantidad,
        formatearImporte(entrada.precio),
        formatearImporte(Number(entrada.precio) * item.cantidad),
      ],
    );
  }

  await pool.execute<ResultSetHeader>(
    `INSERT INTO pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
     VALUES (?, NULL, ?, ?)`,
    [pedidoId, estadoId, parametros.cajeroId],
  );

  return {
    id: pedidoId,
    numero,
    tipo: 'mostrador',
    estado: 'Pendiente',
    fecha_recoleccion: null,
    total: formatearImporte(total),
    creado_en: formatearFechaHora(new Date()),
    detalle: lineas,
    pago: null,
  };
}

/**
 * Registra el cobro en efectivo de un mostrador Pendiente y lo pasa a Pagado.
 * Un pedido ya Pagado devuelve el mismo cobro (idempotente, sin duplicar).
 */
export async function cobrarMostrador(
  id: number,
  cajeroId: number,
  montoRecibido: number,
): Promise<CobroRespuesta> {
  const fila = await cargarPedido(id);
  if (!fila) {
    throw new ErrorAplicacion(404, 'PEDIDO_NO_ENCONTRADO', 'Pedido no encontrado');
  }
  if (fila.tipo !== 'mostrador') {
    throw new ErrorAplicacion(409, 'ESTADO_INVALIDO', 'Solo los pedidos de mostrador se cobran en caja');
  }

  if (fila.estado === 'Pagado') {
    const pago = await cargarPago(id);
    if (!pago) {
      throw new Error('El pedido está Pagado pero no tiene registro de cobro');
    }
    return {
      id: fila.id,
      numero: fila.numero,
      estado: 'Pagado',
      total: formatearImporte(fila.total),
      monto_recibido: formatearImporte(fila.total),
      cambio: '0.00',
      pago,
    };
  }

  if (fila.estado !== 'Pendiente') {
    throw new ErrorAplicacion(409, 'ESTADO_INVALIDO', 'El pedido no está pendiente de cobro');
  }

  const total = Number(fila.total);
  if (montoRecibido < total) {
    throw new ErrorAplicacion(
      402,
      'COBRO_INSUFICIENTE',
      'El monto recibido es menor que el total',
    );
  }

  const [estados] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM estado_pedido WHERE nombre = 'Pagado' LIMIT 1",
  );
  const pagadoId = estados[0]?.id;
  if (!pagadoId) {
    throw new Error('Falta el estado Pagado en la base de datos');
  }

  const referencia = `efectivo-${fila.numero}`;
  const monto = formatearImporte(total);

  await pool.execute<ResultSetHeader>('UPDATE pedido SET estado_id = ? WHERE id = ?', [
    pagadoId,
    id,
  ]);
  await pool.execute<ResultSetHeader>(
    `INSERT INTO pago (pedido_id, metodo, monto, referencia, registrado_por)
     VALUES (?, 'efectivo', ?, ?, ?)`,
    [id, monto, referencia, cajeroId],
  );
  await pool.execute<ResultSetHeader>(
    `INSERT INTO pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
     VALUES (?, (SELECT id FROM estado_pedido WHERE nombre = 'Pendiente' LIMIT 1), ?, ?)`,
    [id, pagadoId, cajeroId],
  );

  return {
    id: fila.id,
    numero: fila.numero,
    estado: 'Pagado',
    total: monto,
    monto_recibido: formatearImporte(montoRecibido),
    cambio: formatearImporte(montoRecibido - total),
    pago: {
      metodo: 'efectivo',
      monto,
      referencia,
      fecha: formatearFechaHora(new Date()),
    },
  };
}
