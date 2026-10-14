import type { Request, Response } from 'express';
import { obtenerTablero } from '../services/cocina.service.js';

/** GET /api/cocina/pedidos — tablero de cocina. */
export async function tablero(_req: Request, res: Response): Promise<void> {
  const pedidos = await obtenerTablero();
  res.status(200).json({ pedidos });
}
