import type { output, ZodTypeAny } from 'zod';
import { errorValidacion } from './errores.js';

/**
 * Valida `datos` con un esquema zod y devuelve su tipo de salida
 * (aplica transforms). Si falla, lanza un error 400 con el primer
 * mensaje (sin exponer detalles internos).
 */
export function validar<T extends ZodTypeAny>(esquema: T, datos: unknown): output<T> {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    const primer = resultado.error.issues[0];
    throw errorValidacion(primer?.message ?? 'Datos inválidos');
  }
  return resultado.data;
}
