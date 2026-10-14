import { z } from 'zod';

export const DESTINOS_ESTADO = ['En preparación', 'Listo', 'Entregado', 'Cancelado'] as const;

export const esquemaCambiarEstado = z.object({
  estado: z
    .string()
    .refine(
      (valor) => (DESTINOS_ESTADO as readonly string[]).includes(valor),
      'Estado destino inválido',
    ),
});

export type CambiarEstadoEntrada = z.infer<typeof esquemaCambiarEstado>;
