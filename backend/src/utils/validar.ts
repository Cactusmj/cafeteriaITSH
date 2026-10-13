import type { ZodSchema } from 'zod';
import { errorValidacion } from './errores.js';

/**
 * Valida `datos` con un esquema zod. Si falla, lanza un error 400
 * con el primer mensaje (sin exponer detalles internos).
 */
export function validar<T>(esquema: ZodSchema<T>, datos: unknown): T {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    const primer = resultado.error.issues[0];
    throw errorValidacion(primer?.message ?? 'Datos inválidos');
  }
  return resultado.data;
}
