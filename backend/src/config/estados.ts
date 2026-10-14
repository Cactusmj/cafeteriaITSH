import { ROL } from './roles.js';

/**
 * Destinos de transición permitidos por rol para `PATCH /api/pedidos/:id/estado`.
 * El cobro a "Pagado" vive en el servicio de mostrador; el pago en línea en el
 * servicio de pedidos. Todo destino además debe existir en `transicion_estado`.
 */
export const DESTINOS_POR_ROL: Record<string, readonly string[]> = {
  [ROL.COCINERO]: ['En preparación', 'Listo'],
  [ROL.CAJERO]: ['Entregado', 'Cancelado'],
};

/** Indica si un rol puede llevar un pedido al estado destino. */
export function destinoPermitido(rol: string, destino: string): boolean {
  return DESTINOS_POR_ROL[rol]?.includes(destino) ?? false;
}
