import type { NextFunction, Request, Response } from 'express';
import { errorNoAutorizado } from '../utils/errores.js';
import { verificar } from '../utils/jwt.js';

/**
 * Valida el encabezado `Authorization: Bearer <token>` y adjunta `req.usuario`.
 * Responde 401 si el token falta, es inválido o expiró.
 */
export function autenticar(req: Request, _res: Response, next: NextFunction): void {
  const cabecera = req.headers.authorization;
  if (!cabecera || !cabecera.startsWith('Bearer ')) {
    next(errorNoAutorizado('Sesión requerida'));
    return;
  }

  const token = cabecera.slice('Bearer '.length).trim();
  try {
    req.usuario = verificar(token);
    next();
  } catch {
    next(errorNoAutorizado('Token inválido o expirado'));
  }
}
