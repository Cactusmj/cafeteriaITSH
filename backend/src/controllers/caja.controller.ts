import type { Request, Response } from 'express';
import { obtenerPendientes } from '../services/caja.service.js';

/** GET /api/caja/pendientes — pendientes de entrega y cobro. */
export async function pendientes(_req: Request, res: Response): Promise<void> {
  const lista = await obtenerPendientes();
  res.status(200).json({ pendientes: lista });
}
