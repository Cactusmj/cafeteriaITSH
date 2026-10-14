import type { Request, Response } from 'express';
import { esquemaCobro, esquemaCrearMostrador } from '../schemas/mostrador.schemas.js';
import {
  buscarPedidoPorClaveMostrador,
  cobrarMostrador,
  crearMostrador,
} from '../services/mostrador.service.js';
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

/** POST /api/pedidos/mostrador — captura un pedido de mostrador. */
export async function crear(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario;
  if (!usuario?.id) {
    throw errorValidacion('Sesión requerida');
  }
  const datos = validar(esquemaCrearMostrador, req.body);

  const existente = await buscarPedidoPorClaveMostrador(datos.clave_idempotencia, usuario.id);
  if (existente) {
    res.status(200).json(existente);
    return;
  }

  const pedido = await crearMostrador({
    cajeroId: usuario.id,
    clienteNombre: datos.cliente_nombre,
    claveIdempotencia: datos.clave_idempotencia,
    items: datos.items,
  });
  res.status(201).json(pedido);
}

/** POST /api/pedidos/:id/cobro — registra el cobro en efectivo. */
export async function cobrar(req: Request, res: Response): Promise<void> {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    throw errorValidacion('Sesión requerida');
  }
  const datos = validar(esquemaCobro, req.body);
  const cobro = await cobrarMostrador(idDeRuta(req), usuarioId, datos.monto_recibido);
  res.status(200).json(cobro);
}
