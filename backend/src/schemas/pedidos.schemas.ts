import { z } from 'zod';
import { esFechaHoraISO } from '../utils/fecha.js';

const fechaRecoleccion = z
  .string()
  .refine(esFechaHoraISO, 'La fecha de recolección debe tener el formato YYYY-MM-DDTHH:mm');

const claveIdempotencia = z
  .string()
  .uuid('La clave de idempotencia debe ser un UUID');

const lineaItem = z.object({
  menu_dia_id: z.number().int().positive('El platillo del menú es obligatorio'),
  cantidad: z
    .number()
    .int()
    .min(1, 'La cantidad debe ser al menos 1')
    .max(20, 'La cantidad máxima por línea es 20'),
});

export const esquemaCrearPedido = z.object({
  fecha_recoleccion: fechaRecoleccion,
  clave_idempotencia: claveIdempotencia,
  items: z
    .array(lineaItem)
    .min(1, 'El pedido debe incluir al menos un platillo')
    .max(20, 'El pedido no puede tener más de 20 líneas')
    .superRefine((items, contexto) => {
      const vistos = new Set<number>();
      for (const item of items) {
        if (vistos.has(item.menu_dia_id)) {
          contexto.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'No se permiten líneas repetidas del mismo platillo',
          });
          return;
        }
        vistos.add(item.menu_dia_id);
      }
    }),
});

export type CrearPedidoEntrada = z.infer<typeof esquemaCrearPedido>;
