import { z } from 'zod';

const lineaItem = z.object({
  menu_dia_id: z.number().int().positive('El platillo del menú es obligatorio'),
  cantidad: z
    .number()
    .int()
    .min(1, 'La cantidad debe ser al menos 1')
    .max(20, 'La cantidad máxima por línea es 20'),
});

const itemsSinRepetidos = (
  items: { menu_dia_id: number }[],
  contexto: z.RefinementCtx,
): void => {
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
};

export const esquemaCrearMostrador = z.object({
  cliente_nombre: z.string().trim().max(100, 'El nombre no puede exceder 100 caracteres').optional(),
  clave_idempotencia: z.string().uuid('La clave de idempotencia debe ser un UUID'),
  items: z
    .array(lineaItem)
    .min(1, 'El pedido debe incluir al menos un platillo')
    .max(20, 'El pedido no puede tener más de 20 líneas')
    .superRefine(itemsSinRepetidos),
});

const monto = z
  .union([z.number(), z.string()])
  .refine((valor) => {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero >= 0;
  }, 'El monto debe ser un número mayor o igual a cero')
  .refine((valor) => {
    const numero = Number(valor);
    return Math.abs(numero * 100 - Math.round(numero * 100)) < 1e-6;
  }, 'El monto debe tener como máximo 2 decimales')
  .transform((valor) => Number(valor));

export const esquemaCobro = z.object({
  monto_recibido: monto,
});

export type CrearMostradorEntrada = z.infer<typeof esquemaCrearMostrador>;
export type CobroEntrada = z.infer<typeof esquemaCobro>;
