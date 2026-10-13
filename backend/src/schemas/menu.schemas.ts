import { z } from 'zod';
import { esFechaISO } from '../utils/fecha.js';

const precio = z
  .union([z.number(), z.string()])
  .refine((valor) => {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero > 0;
  }, 'El precio debe ser un número mayor que cero')
  .refine((valor) => {
    const numero = Number(valor);
    return Math.abs(numero * 100 - Math.round(numero * 100)) < 1e-6;
  }, 'El precio debe tener como máximo 2 decimales')
  .transform((valor) => Number(valor));

const fecha = z
  .string()
  .refine(esFechaISO, 'La fecha debe tener el formato YYYY-MM-DD');

export const esquemaAgregarMenu = z.object({
  fecha: fecha.optional(),
  platillo_id: z.number().int().positive('El platillo es obligatorio'),
  precio,
  especial: z.boolean().optional(),
});

export const esquemaEditarMenu = z
  .object({
    precio: precio.optional(),
    disponible: z.boolean().optional(),
    especial: z.boolean().optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'No hay campos para actualizar',
  });

export type AgregarMenuEntrada = z.infer<typeof esquemaAgregarMenu>;
export type EditarMenuEntrada = z.infer<typeof esquemaEditarMenu>;
