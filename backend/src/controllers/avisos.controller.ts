import type { Request, Response } from 'express';
import {
  listarAvisos,
  marcarVistos,
  obtenerMisPedidos,
} from '../services/avisos/avisos.service.js';
import { errorValidacion } from '../utils/errores.js';

/** GET /api/mis-pedidos — pedidos del cliente en sesión. */
export async function misPedidos(req: Request, res: Response): Promise<void> {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    throw errorValidacion('Sesión requerida');
  }
  const pedidos = await obtenerMisPedidos(usuarioId);
  res.status(200).json({ pedidos });
}

/** GET /api/avisos — avisos del cliente en sesión (o todos si es admin). */
export async function avisos(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario;
  if (!usuario?.id) {
    throw errorValidacion('Sesión requerida');
  }
  const lista = await listarAvisos({ id: usuario.id, rol: usuario.rol });
  res.status(200).json({ avisos: lista });
}

/** PATCH /api/avisos/vistos — marca como vistos los avisos pendientes. */
export async function vistos(req: Request, res: Response): Promise<void> {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    throw errorValidacion('Sesión requerida');
  }
  const resultado = await marcarVistos(usuarioId);
  res.status(200).json({ actualizados: resultado.actualizados });
}
