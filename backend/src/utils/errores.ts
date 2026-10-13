import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger.js';

/**
 * Error de aplicación con código HTTP y código de negocio.
 * Se traduce a una respuesta JSON sin detalles internos.
 */
export class ErrorAplicacion extends Error {
  readonly estadoHttp: number;
  readonly codigo: string;

  constructor(estadoHttp: number, codigo: string, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorAplicacion';
    this.estadoHttp = estadoHttp;
    this.codigo = codigo;
  }
}

export const errorValidacion = (mensaje = 'Datos inválidos'): ErrorAplicacion =>
  new ErrorAplicacion(400, 'VALIDACION', mensaje);
export const errorNoAutorizado = (mensaje = 'No autorizado'): ErrorAplicacion =>
  new ErrorAplicacion(401, 'NO_AUTORIZADO', mensaje);
export const errorProhibido = (mensaje = 'Acceso denegado'): ErrorAplicacion =>
  new ErrorAplicacion(403, 'PROHIBIDO', mensaje);
export const errorNoEncontrado = (mensaje = 'No encontrado'): ErrorAplicacion =>
  new ErrorAplicacion(404, 'NO_ENCONTRADO', mensaje);
export const errorConflicto = (codigo: string, mensaje: string): ErrorAplicacion =>
  new ErrorAplicacion(409, codigo, mensaje);

/**
 * Envuelve un handler async para propagar errores al manejador central.
 */
export function envolverAsync(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/**
 * Manejador de errores de Express: nunca expone stack traces ni el error crudo.
 */
export function manejadorErrores(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ErrorAplicacion) {
    res.status(err.estadoHttp).json({ error: { codigo: err.codigo, mensaje: err.message } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: { codigo: 'VALIDACION', mensaje: 'Datos inválidos' },
    });
    return;
  }

  logger.error(`Error interno: ${err instanceof Error ? err.message : 'desconocido'}`);
  res.status(500).json({
    error: { codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor' },
  });
}
