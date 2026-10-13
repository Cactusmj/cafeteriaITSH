import type { NextFunction, Request, Response } from 'express';
import { errorNoAutorizado, errorProhibido } from '../utils/errores.js';

/**
 * Autoriza el acceso solo a los roles indicados.
 * Responde 401 si no hay sesión y 403 si el rol no está permitido.
 */
export function autorizarRol(...rolesPermitidos: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      next(errorNoAutorizado('Sesión requerida'));
      return;
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      next(errorProhibido('Acceso denegado'));
      return;
    }
    next();
  };
}
