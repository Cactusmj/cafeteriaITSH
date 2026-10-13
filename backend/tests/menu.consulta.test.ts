import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/db.js', () => ({
  pool: { execute: vi.fn() },
}));

import { pool } from '../src/config/db.js';
import { obtenerMenuPublico } from '../src/services/menu.service.js';

const ejecutar = pool.execute as unknown as import('vitest').Mock;

beforeEach(() => {
  ejecutar.mockReset();
});

describe('menu.service.obtenerMenuPublico', () => {
  it('expone la disponibilidad efectiva (menú y platillo activos)', async () => {
    ejecutar.mockResolvedValueOnce([
      [
        {
          id: 10,
          platillo: 'Enchiladas verdes',
          categoria: 'comidas',
          descripcion: 'Con arroz y frijoles',
          precio: '65.00',
          disponible: 1,
          especial: 0,
          activo: 1,
        },
        {
          id: 11,
          platillo: 'Jugo de naranja',
          categoria: 'bebidas',
          descripcion: null,
          precio: '25.00',
          disponible: 1,
          especial: 0,
          activo: 0,
        },
      ],
      [],
    ]);

    const platillos = await obtenerMenuPublico('2026-10-13');

    expect(platillos).toHaveLength(2);
    expect(platillos[0]).toMatchObject({ disponible: true });
    expect(platillos[1]).toMatchObject({ disponible: false });
  });

  it('devuelve lista vacía cuando no hay menú publicado', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    const platillos = await obtenerMenuPublico('2000-01-01');
    expect(platillos).toEqual([]);
  });
});
