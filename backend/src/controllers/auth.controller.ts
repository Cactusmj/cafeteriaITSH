import type { Request, Response } from 'express';
import { esquemaLogin, esquemaRegistro } from '../schemas/auth.schemas.js';
import { iniciarSesion, obtenerUsuarioPorId, registrarCliente } from '../services/auth.service.js';
import { errorNoAutorizado } from '../utils/errores.js';
import { validar } from '../utils/validar.js';

/** POST /api/auth/register — registro público de clientes. */
export async function registrar(req: Request, res: Response): Promise<void> {
  const datos = validar(esquemaRegistro, req.body);
  const sesion = await registrarCliente(datos);
  res.status(201).json(sesion);
}

/** POST /api/auth/login — inicio de sesión. */
export async function iniciar(req: Request, res: Response): Promise<void> {
  const datos = validar(esquemaLogin, req.body);
  const sesion = await iniciarSesion(datos);
  res.status(200).json(sesion);
}

/** GET /api/auth/me — identidad de la sesión actual. */
export async function yo(req: Request, res: Response): Promise<void> {
  const id = req.usuario?.id;
  if (!id) {
    throw errorNoAutorizado('Sesión requerida');
  }
  const usuario = await obtenerUsuarioPorId(id);
  if (!usuario) {
    throw errorNoAutorizado('Sesión inválida');
  }
  res.status(200).json({ usuario });
}

/** POST /api/auth/logout — el cliente descarta el token. */
export function cerrarSesion(_req: Request, res: Response): void {
  res.status(204).end();
}
