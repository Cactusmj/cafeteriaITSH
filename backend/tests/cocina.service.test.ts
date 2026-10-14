import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/db.js', () => ({
  pool: { execute: vi.fn() },
}));

import { pool } from '../src/config/db.js';
import { obtenerTablero } from '../src/services/cocina.service.js';

const ejecutar = pool.execute as unknown as import('vitest').Mock;

beforeEach(() => {
  ejecutar.mockReset();
});

describe('cocina.service.obtenerTablero', () => {
  it('lista ambos orígenes ordenados por llegada con detalle y espera', async () => {
    const ahora = Date.now();
    ejecutar
      .mockResolvedValueOnce([
        [
          {
            id: 9,
            numero: 'PED-MOSTRADOR',
            tipo: 'mostrador',
            estado: 'Pagado',
            cliente_nombre: 'Marta',
            duenio: null,
            total: '70.00',
            creado_en: new Date(ahora - 360_000),
          },
          {
            id: 4,
            numero: 'PED-ANTICIPADO',
            tipo: 'anticipado',
            estado: 'En preparación',
            cliente_nombre: null,
            duenio: 'Alumno Prueba',
            total: '95.00',
            creado_en: new Date(ahora - 120_000),
          },
        ],
        [],
      ])
      .mockResolvedValueOnce([
        [
          { pedido_id: 9, platillo: 'Gordita de chicharrón', cantidad: 2 },
          { pedido_id: 4, platillo: 'Agua de horchata', cantidad: 1 },
        ],
        [],
      ]);

    const tablero = await obtenerTablero();

    expect(tablero).toHaveLength(2);
    expect(tablero[0]).toMatchObject({
      numero: 'PED-MOSTRADOR',
      tipo: 'mostrador',
      estado: 'Pagado',
      cliente: 'Marta',
      minutos_en_espera: 6,
    });
    expect(tablero[0]?.detalle).toEqual([{ platillo: 'Gordita de chicharrón', cantidad: 2 }]);
    expect(tablero[1]).toMatchObject({
      numero: 'PED-ANTICIPADO',
      tipo: 'anticipado',
      cliente: 'Alumno Prueba',
    });
    expect(ejecutar).toHaveBeenCalledTimes(2);
  });

  it('devuelve lista vacía sin pedidos en flujo', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(obtenerTablero()).resolves.toEqual([]);
    expect(ejecutar).toHaveBeenCalledTimes(1);
  });
});
