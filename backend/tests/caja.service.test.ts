import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/db.js', () => ({
  pool: { execute: vi.fn() },
}));

import { pool } from '../src/config/db.js';
import { obtenerPendientes } from '../src/services/caja.service.js';

const ejecutar = pool.execute as unknown as import('vitest').Mock;

beforeEach(() => {
  ejecutar.mockReset();
});

describe('caja.service.obtenerPendientes', () => {
  it('lista Listo de ambos orígenes y mostrador pendiente de cobro, por llegada', async () => {
    ejecutar
      .mockResolvedValueOnce([
        [
          {
            id: 9,
            numero: 'PED-MOSTRADOR',
            tipo: 'mostrador',
            estado: 'Listo',
            total: '70.00',
            cliente_nombre: 'Marta',
            creado_en: new Date(2026, 10, 11, 13, 2),
          },
          {
            id: 4,
            numero: 'PED-ANTICIPADO',
            tipo: 'anticipado',
            estado: 'Listo',
            total: '95.00',
            cliente_nombre: null,
            creado_en: new Date(2026, 10, 11, 13, 5),
          },
          {
            id: 10,
            numero: 'PED-PENDIENTE',
            tipo: 'mostrador',
            estado: 'Pendiente',
            total: '25.00',
            cliente_nombre: null,
            creado_en: new Date(2026, 10, 11, 13, 6),
          },
        ],
        [],
      ])
      .mockResolvedValueOnce([
        [
          { pedido_id: 9, lineas: 2 },
          { pedido_id: 4, lineas: 3 },
          { pedido_id: 10, lineas: 1 },
        ],
        [],
      ]);

    const pendientes = await obtenerPendientes();

    expect(pendientes).toHaveLength(3);
    expect(pendientes[0]).toMatchObject({
      numero: 'PED-MOSTRADOR',
      estado: 'Listo',
      cliente_nombre: 'Marta',
      lineas: 2,
    });
    expect(pendientes[1]).toMatchObject({ numero: 'PED-ANTICIPADO', lineas: 3 });
    expect(pendientes[2]).toMatchObject({ numero: 'PED-PENDIENTE', estado: 'Pendiente' });
    expect(ejecutar).toHaveBeenCalledTimes(2);
  });

  it('devuelve lista vacía sin pendientes', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(obtenerPendientes()).resolves.toEqual([]);
    expect(ejecutar).toHaveBeenCalledTimes(1);
  });
});
