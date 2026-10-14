import type { Request, Response } from 'express';
import { esquemaCrearPedido } from '../schemas/pedidos.schemas.js';
import { esquemaCambiarEstado } from '../schemas/estado.schemas.js';
import { avanzarEstado, buscarPedidoPorClave, crearPedido, obtenerPedidoPorId, pagarPedido } from '../services/pedidos.service.js';
import { errorValidacion } from '../utils/errores.js';
import { validar } from '../utils/validar.js';

/** Convierte y valida un id de ruta. */
function idDeRuta(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw errorValidacion('Identificador inválido');
  }
  return id;
}

/** POST /api/pedidos — crea un pedido anticipado para el cliente en sesión. */
export async function crear(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario;
  if (!usuario?.id) {
    throw errorValidacion('Sesión requerida');
  }
  const datos = validar(esquemaCrearPedido, req.body);
  const existente = await buscarPedidoPorClave(datos.clave_idempotencia, {
    id: usuario.id,
    rol: usuario.rol,
  });
  if (existente) {
    res.status(200).json(existente);
    return;
  }
  const pedido = await crearPedido({
    usuarioId: usuario.id,
    fechaRecoleccion: datos.fecha_recoleccion,
    claveIdempotencia: datos.clave_idempotencia,
    items: datos.items,
  });
  res.status(201).json(pedido);
}

/** GET /api/pedidos/:id — detalle del pedido (dueño o administrador). */
export async function obtener(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario;
  if (!usuario) {
    throw errorValidacion('Sesión requerida');
  }
  const pedido = await obtenerPedidoPorId(idDeRuta(req), {
    id: usuario.id,
    rol: usuario.rol,
  });
  res.status(200).json(pedido);
}

/** POST /api/pedidos/:id/pago — confirma el pago en línea del pedido. */
export async function pagar(req: Request, res: Response): Promise<void> {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    throw errorValidacion('Sesión requerida');
  }
  const confirmacion = await pagarPedido(idDeRuta(req), usuarioId);
  res.status(200).json(confirmacion);
}

/** PATCH /api/pedidos/:id/estado — avanza el pedido según la matriz de roles. */
export async function cambiarEstado(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario;
  if (!usuario?.id) {
    throw errorValidacion('Sesión requerida');
  }
  const datos = validar(esquemaCambiarEstado, req.body);
  const cambio = await avanzarEstado(idDeRuta(req), { id: usuario.id, rol: usuario.rol }, datos.estado);
  res.status(200).json(cambio);
}
