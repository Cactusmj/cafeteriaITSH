import { randomBytes } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { ROL } from '../config/roles.js';
import { ErrorAplicacion, errorProhibido } from '../utils/errores.js';
import { anticipacionInsuficiente } from '../utils/fecha.js';
import { destinoPermitido } from '../config/estados.js';
import { obtenerProveedorPago, type ProveedorPago } from './pagos/proveedor-pago.js';

const ALFABETO_FOLIO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const INTENTOS_FOLIO = 3;

export interface LineaPedidoEntrada {
  menu_dia_id: number;
  cantidad: number;
}

export interface CrearPedidoParametros {
  usuarioId: number;
  fechaRecoleccion: string;
  claveIdempotencia: string;
  items: LineaPedidoEntrada[];
}

export interface Solicitante {
  id: number;
  rol: string;
}

export interface LineaPedidoRespuesta {
  menu_dia_id: number;
  platillo: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
}

export interface PagoRespuesta {
  metodo: string;
  monto: string;
  referencia: string | null;
  fecha: string;
}

export interface PedidoRespuesta {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  fecha_recoleccion: string | null;
  total: string;
  creado_en: string;
  detalle: LineaPedidoRespuesta[];
  pago: PagoRespuesta | null;
}

/** Confirmación devuelta tras pagar (sin el detalle del pedido). */
export interface ConfirmacionPago {
  id: number;
  numero: string;
  estado: string;
  total: string;
  fecha_recoleccion: string | null;
  pago: PagoRespuesta;
}

/** Resultado de un cambio de estado válido. */
export interface CambioEstadoRespuesta {
  id: number;
  numero: string;
  estado_anterior: string;
  estado: string;
}

export interface FilaPedido extends RowDataPacket {
  id: number;
  numero: string;
  tipo: string;
  usuario_id: number | null;
  estado: string;
  fecha_recoleccion: Date | null;
  total: string;
  creado_en: Date;
}

interface FilaMenuDia extends RowDataPacket {
  id: number;
  precio: string;
  disponible: number;
  activo: number;
  platillo: string;
}

interface FilaDetalle extends RowDataPacket {
  menu_dia_id: number;
  platillo: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
}

interface FilaPago extends RowDataPacket {
  metodo: string;
  monto: string;
  referencia: string | null;
  fecha: Date;
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

export function formatearImporte(valor: string | number): string {
  return Number(valor).toFixed(2);
}

export function formatearFechaHora(valor: Date | string): string {
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return (
    `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}` +
    `T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}:${dosDigitos(fecha.getSeconds())}`
  );
}

function normalizarFechaHora(valor: string): string {
  return valor.length === 16 ? `${valor}:00` : valor;
}

export function generarFolio(): string {
  const bytes = randomBytes(8);
  let numero = '';
  for (const byte of bytes) {
    numero += ALFABETO_FOLIO[byte % ALFABETO_FOLIO.length];
  }
  return `PED-${numero}`;
}

export function esDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ER_DUP_ENTRY'
  );
}

const SQL_PEDIDO = `SELECT p.id, p.numero, p.tipo, p.usuario_id, ep.nombre AS estado,
           p.fecha_recoleccion, p.total, p.creado_en
    FROM pedido p
    INNER JOIN estado_pedido ep ON ep.id = p.estado_id`;

export async function cargarPedido(id: number): Promise<FilaPedido | undefined> {
  const [filas] = await pool.execute<FilaPedido[]>(`${SQL_PEDIDO} WHERE p.id = ? LIMIT 1`, [id]);
  return filas[0];
}

async function cargarDetalle(pedidoId: number): Promise<LineaPedidoRespuesta[]> {
  const [filas] = await pool.execute<FilaDetalle[]>(
    `SELECT pd.menu_dia_id, pl.nombre AS platillo, pd.cantidad,
            pd.precio_unitario, pd.subtotal
     FROM pedido_detalle pd
     INNER JOIN menu_dia md ON md.id = pd.menu_dia_id
     INNER JOIN platillo pl ON pl.id = md.platillo_id
     WHERE pd.pedido_id = ?
     ORDER BY pd.id`,
    [pedidoId],
  );
  return filas.map((fila) => ({
    menu_dia_id: fila.menu_dia_id,
    platillo: fila.platillo,
    cantidad: fila.cantidad,
    precio_unitario: formatearImporte(fila.precio_unitario),
    subtotal: formatearImporte(fila.subtotal),
  }));
}

export async function cargarPago(pedidoId: number): Promise<PagoRespuesta | null> {
  const [filas] = await pool.execute<FilaPago[]>(
    'SELECT metodo, monto, referencia, fecha FROM pago WHERE pedido_id = ? LIMIT 1',
    [pedidoId],
  );
  const fila = filas[0];
  if (!fila) {
    return null;
  }
  return {
    metodo: fila.metodo,
    monto: formatearImporte(fila.monto),
    referencia: fila.referencia,
    fecha: formatearFechaHora(fila.fecha),
  };
}

function mapearPedido(fila: FilaPedido, detalle: LineaPedidoRespuesta[], pago: PagoRespuesta | null): PedidoRespuesta {
  return {
    id: fila.id,
    numero: fila.numero,
    tipo: fila.tipo,
    estado: fila.estado,
    fecha_recoleccion: fila.fecha_recoleccion ? formatearFechaHora(fila.fecha_recoleccion) : null,
    total: formatearImporte(fila.total),
    creado_en: formatearFechaHora(fila.creado_en),
    detalle,
    pago,
  };
}

/** Valida líneas contra el menú de hoy y calcula total con precios vigentes. */
export async function validarItemsMenuDia(items: LineaPedidoEntrada[]): Promise<{
  lineas: LineaPedidoRespuesta[];
  total: number;
  porId: Map<number, FilaMenuDia>;
}> {
  const idsMenu = items.map((item) => item.menu_dia_id);
  const [entradas] = await pool.execute<FilaMenuDia[]>(
    `SELECT md.id, md.precio, md.disponible, p.activo, p.nombre AS platillo
     FROM menu_dia md
     INNER JOIN platillo p ON p.id = md.platillo_id
     WHERE md.fecha = CURRENT_DATE AND md.id IN (${idsMenu.map(() => '?').join(', ')})`,
    idsMenu,
  );
  const porId = new Map(entradas.map((entrada) => [entrada.id, entrada]));

  let total = 0;
  const lineas: LineaPedidoRespuesta[] = [];
  for (const item of items) {
    const entrada = porId.get(item.menu_dia_id);
    if (!entrada) {
      throw new ErrorAplicacion(
        404,
        'MENU_DIA_NO_ENCONTRADO',
        'Uno de los platillos seleccionados no está en el menú de hoy',
      );
    }
    if (!entrada.disponible || !entrada.activo) {
      throw new ErrorAplicacion(
        409,
        'PLATILLO_NO_DISPONIBLE',
        'Uno de los platillos seleccionados ya no está disponible',
      );
    }
    const precio = Number(entrada.precio);
    const subtotal = precio * item.cantidad;
    total += subtotal;
    lineas.push({
      menu_dia_id: item.menu_dia_id,
      platillo: entrada.platillo,
      cantidad: item.cantidad,
      precio_unitario: formatearImporte(precio),
      subtotal: formatearImporte(subtotal),
    });
  }
  return { lineas, total, porId };
}

/** Consulta un pedido; lo ve el dueño, un administrador o el cajero (mostrador). */
export async function obtenerPedidoPorId(id: number, solicitante: Solicitante): Promise<PedidoRespuesta> {
  const fila = await cargarPedido(id);
  if (!fila) {
    throw new ErrorAplicacion(404, 'PEDIDO_NO_ENCONTRADO', 'Pedido no encontrado');
  }
  const esMostradorDeCaja = fila.tipo === 'mostrador' && solicitante.rol === ROL.CAJERO;
  if (fila.usuario_id !== solicitante.id && solicitante.rol !== ROL.ADMINISTRADOR && !esMostradorDeCaja) {
    throw errorProhibido('No tienes permiso para ver este pedido');
  }

  const [detalle, pago] = await Promise.all([cargarDetalle(id), cargarPago(id)]);
  return mapearPedido(fila, detalle, pago);
}

/** Busca un pedido por su clave de idempotencia (lo ve el dueño o un administrador). */
export async function buscarPedidoPorClave(
  claveIdempotencia: string,
  solicitante: Solicitante,
): Promise<PedidoRespuesta | null> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM pedido WHERE clave_idempotencia = ? LIMIT 1',
    [claveIdempotencia],
  );
  const fila = filas[0];
  if (!fila) {
    return null;
  }
  return obtenerPedidoPorId(fila.id, solicitante);
}

/** Crea un pedido anticipado en estado Pendiente con su folio y total recalculado. */
export async function crearPedido(parametros: CrearPedidoParametros): Promise<PedidoRespuesta> {
  const [previos] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM pedido WHERE clave_idempotencia = ? LIMIT 1',
    [parametros.claveIdempotencia],
  );
  if (previos[0]) {
    return obtenerPedidoPorId(previos[0].id, { id: parametros.usuarioId, rol: ROL.CLIENTE });
  }

  if (anticipacionInsuficiente(parametros.fechaRecoleccion)) {
    throw new ErrorAplicacion(
      400,
      'ANTICIPACION_INSUFICIENTE',
      'El pedido debe hacerse con al menos 10 minutos de anticipación',
    );
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
        `INSERT INTO pedido (numero, tipo, estado_id, usuario_id, fecha_recoleccion, total, creado_por, clave_idempotencia)
         VALUES (?, 'anticipado', ?, ?, ?, ?, ?, ?)`,
        [
          numero,
          estadoId,
          parametros.usuarioId,
          parametros.fechaRecoleccion,
          formatearImporte(total),
          parametros.usuarioId,
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
      return obtenerPedidoPorId(existentes[0].id, { id: parametros.usuarioId, rol: ROL.CLIENTE });
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
    [pedidoId, estadoId, parametros.usuarioId],
  );

  return {
    id: pedidoId,
    numero,
    tipo: 'anticipado',
    estado: 'Pendiente',
    fecha_recoleccion: normalizarFechaHora(parametros.fechaRecoleccion),
    total: formatearImporte(total),
    creado_en: formatearFechaHora(new Date()),
    detalle: lineas,
    pago: null,
  };
}

async function existeTransicion(desde: string, hacia: string): Promise<boolean> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    `SELECT 1 AS valida
     FROM transicion_estado te
     INNER JOIN estado_pedido d ON d.id = te.desde_id
     INNER JOIN estado_pedido h ON h.id = te.hacia_id
     WHERE d.nombre = ? AND h.nombre = ?
     LIMIT 1`,
    [desde, hacia],
  );
  return filas.length > 0;
}

/**
 * Avanza un pedido al estado destino validando la matriz de roles y la tabla
 * de transiciones. Los pedidos Entregados o Cancelados son inmutables.
 */
export async function avanzarEstado(
  id: number,
  solicitante: Solicitante,
  destino: string,
): Promise<CambioEstadoRespuesta> {
  if (!destinoPermitido(solicitante.rol, destino)) {
    throw errorProhibido('Tu rol no puede llevar el pedido a ese estado');
  }

  const fila = await cargarPedido(id);
  if (!fila) {
    throw new ErrorAplicacion(404, 'PEDIDO_NO_ENCONTRADO', 'Pedido no encontrado');
  }
  if (fila.estado === 'Entregado' || fila.estado === 'Cancelado') {
    throw new ErrorAplicacion(409, 'ESTADO_INVALIDO', 'El pedido ya está cerrado');
  }
  if (!(await existeTransicion(fila.estado, destino))) {
    throw new ErrorAplicacion(409, 'ESTADO_INVALIDO', 'Transición de estado no válida');
  }

  const [estados] = await pool.execute<RowDataPacket[]>(
    'SELECT id, nombre FROM estado_pedido WHERE nombre IN (?, ?)',
    [fila.estado, destino],
  );
  const anterior = estados.find((estado) => estado.nombre === fila.estado);
  const nuevo = estados.find((estado) => estado.nombre === destino);
  if (!anterior || !nuevo) {
    throw new Error('Faltan estados en la base de datos');
  }

  await pool.execute<ResultSetHeader>('UPDATE pedido SET estado_id = ? WHERE id = ?', [
    nuevo.id,
    id,
  ]);
  await pool.execute<ResultSetHeader>(
    `INSERT INTO pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
     VALUES (?, ?, ?, ?)`,
    [id, anterior.id, nuevo.id, solicitante.id],
  );

  return { id: fila.id, numero: fila.numero, estado_anterior: fila.estado, estado: destino };
}

/**
 * Confirma el pago de un pedido Pendiente. El proveedor decide el resultado;
 * solo con aprobación pasa a Pagado. Un pedido ya Pagado responde la misma
 * confirmación (idempotente, sin duplicar el cobro).
 */
export async function pagarPedido(
  id: number,
  usuarioId: number,
  proveedor: ProveedorPago = obtenerProveedorPago(),
): Promise<ConfirmacionPago> {
  const fila = await cargarPedido(id);
  if (!fila) {
    throw new ErrorAplicacion(404, 'PEDIDO_NO_ENCONTRADO', 'Pedido no encontrado');
  }
  if (fila.usuario_id !== usuarioId) {
    throw errorProhibido('No tienes permiso para pagar este pedido');
  }

  if (fila.estado === 'Pagado') {
    const pago = await cargarPago(id);
    if (!pago) {
      throw new Error('El pedido está Pagado pero no tiene registro de pago');
    }
    return {
      id: fila.id,
      numero: fila.numero,
      estado: 'Pagado',
      total: formatearImporte(fila.total),
      fecha_recoleccion: fila.fecha_recoleccion ? formatearFechaHora(fila.fecha_recoleccion) : null,
      pago,
    };
  }

  if (fila.estado !== 'Pendiente' || !(await existeTransicion('Pendiente', 'Pagado'))) {
    throw new ErrorAplicacion(
      409,
      'ESTADO_INVALIDO',
      'El pedido no está pendiente de pago',
    );
  }

  const [estados] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM estado_pedido WHERE nombre = 'Pagado' LIMIT 1",
  );
  const pagadoId = estados[0]?.id;
  if (!pagadoId) {
    throw new Error('Falta el estado Pagado en la base de datos');
  }

  const monto = formatearImporte(fila.total);
  const resultado = await proveedor.procesarPago({
    numero: fila.numero,
    monto,
    idempotencia: fila.numero,
  });

  if (!resultado.aprobado) {
    throw new ErrorAplicacion(
      402,
      'PAGO_RECHAZADO',
      resultado.mensaje ?? 'El pago fue rechazado, intente de nuevo',
    );
  }

  await pool.execute<ResultSetHeader>('UPDATE pedido SET estado_id = ? WHERE id = ?', [
    pagadoId,
    id,
  ]);
  await pool.execute<ResultSetHeader>(
    `INSERT INTO pago (pedido_id, metodo, monto, referencia, registrado_por)
     VALUES (?, 'online', ?, ?, ?)`,
    [id, monto, resultado.referencia, usuarioId],
  );
  await pool.execute<ResultSetHeader>(
    `INSERT INTO pedido_estado_historial (pedido_id, estado_anterior_id, estado_nuevo_id, cambiado_por)
     VALUES (?, (SELECT id FROM estado_pedido WHERE nombre = 'Pendiente' LIMIT 1), ?, ?)`,
    [id, pagadoId, usuarioId],
  );

  return {
    id: fila.id,
    numero: fila.numero,
    estado: 'Pagado',
    total: monto,
    fecha_recoleccion: fila.fecha_recoleccion ? formatearFechaHora(fila.fecha_recoleccion) : null,
    pago: {
      metodo: 'online',
      monto,
      referencia: resultado.referencia,
      fecha: formatearFechaHora(new Date()),
    },
  };
}
