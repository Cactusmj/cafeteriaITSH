import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/db.js', () => ({
  pool: { execute: vi.fn() },
}));

import { pool } from '../src/config/db.js';
import {
  agregarAlMenu,
  editarEntradaMenu,
  eliminarEntradaMenu,
  listarMenuAdmin,
} from '../src/services/menu.service.js';

const ejecutar = pool.execute as unknown as import('vitest').Mock;

const entradaFila = {
  id: 10,
  fecha: '2026-10-13',
  platillo_id: 1,
  platillo: 'Enchiladas verdes',
  categoria: 'comidas',
  precio: '65.00',
  disponible: 1,
  especial: 0,
  platillo_activo: 1,
};

beforeEach(() => {
  ejecutar.mockReset();
});

describe('menu.service.listarMenuAdmin', () => {
  it('lista las entradas del menú de la fecha', async () => {
    ejecutar.mockResolvedValueOnce([[entradaFila], []]);

    const entradas = await listarMenuAdmin('2026-10-13');
    expect(entradas).toHaveLength(1);
    expect(entradas[0]).toMatchObject({
      platillo: 'Enchiladas verdes',
      precio: '65.00',
      disponible: true,
      especial: false,
      platillo_activo: true,
    });
  });
});

describe('menu.service.agregarAlMenu', () => {
  it('agrega un platillo activo al menú de la fecha', async () => {
    ejecutar
      .mockResolvedValueOnce([[{ id: 1, activo: 1 }], []])
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 20 }, []]);

    const entrada = await agregarAlMenu({
      fecha: '2026-10-13',
      platillo_id: 1,
      precio: 65,
      especial: false,
    });

    expect(entrada).toMatchObject({
      id: 20,
      fecha: '2026-10-13',
      platillo_id: 1,
      precio: '65.00',
      disponible: true,
      especial: false,
    });
  });

  it('rechaza DUPLICADO si el platillo ya está en el menú de ese día', async () => {
    ejecutar
      .mockResolvedValueOnce([[{ id: 1, activo: 1 }], []])
      .mockResolvedValueOnce([[{ existe: 1 }], []]);

    await expect(
      agregarAlMenu({ fecha: '2026-10-13', platillo_id: 1, precio: 65 }),
    ).rejects.toMatchObject({ codigo: 'DUPLICADO', estadoHttp: 409 });
  });

  it('rechaza PLATILLO_INACTIVO si el platillo está desactivado', async () => {
    ejecutar.mockResolvedValueOnce([[{ id: 1, activo: 0 }], []]);

    await expect(
      agregarAlMenu({ fecha: '2026-10-13', platillo_id: 1, precio: 65 }),
    ).rejects.toMatchObject({ codigo: 'PLATILLO_INACTIVO', estadoHttp: 409 });
  });

  it('lanza NO_ENCONTRADO si el platillo no existe', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(
      agregarAlMenu({ fecha: '2026-10-13', platillo_id: 99, precio: 65 }),
    ).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO', estadoHttp: 404 });
  });
});

describe('menu.service.editarEntradaMenu', () => {
  it('actualiza precio, disponibilidad y especial', async () => {
    ejecutar
      .mockResolvedValueOnce([[entradaFila], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([[{ ...entradaFila, precio: '70.00', disponible: 0, especial: 1 }], []]);

    const entrada = await editarEntradaMenu(10, { precio: 70, disponible: false, especial: true });
    expect(entrada).toMatchObject({ precio: '70.00', disponible: false, especial: true });
  });

  it('lanza NO_ENCONTRADO con id inexistente', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(editarEntradaMenu(99, { disponible: false })).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });
});

describe('menu.service.eliminarEntradaMenu', () => {
  it('elimina una entrada sin pedidos', async () => {
    ejecutar
      .mockResolvedValueOnce([[entradaFila], []])
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]);

    await expect(eliminarEntradaMenu(10)).resolves.toEqual({ eliminado: true });
  });

  it('rechaza REFERENCIADO si la entrada tiene pedidos', async () => {
    ejecutar
      .mockResolvedValueOnce([[entradaFila], []])
      .mockResolvedValueOnce([[{ existe: 1 }], []]);

    await expect(eliminarEntradaMenu(10)).rejects.toMatchObject({
      codigo: 'REFERENCIADO',
      estadoHttp: 409,
    });
  });
});
