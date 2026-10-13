import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/db.js', () => ({
  pool: { execute: vi.fn() },
}));

import { pool } from '../src/config/db.js';
import {
  cambiarActivoPlatillo,
  crearPlatillo,
  editarPlatillo,
  listarPlatillos,
} from '../src/services/platillos.service.js';

const ejecutar = pool.execute as unknown as import('vitest').Mock;

const platilloFila = {
  id: 1,
  nombre: 'Enchiladas verdes',
  categoria: 'comidas',
  descripcion: 'Con arroz y frijoles',
  activo: 1,
};

beforeEach(() => {
  ejecutar.mockReset();
});

describe('platillos.service.listarPlatillos', () => {
  it('lista solo activos por defecto', async () => {
    ejecutar.mockResolvedValueOnce([[platilloFila], []]);

    const platillos = await listarPlatillos();
    expect(ejecutar.mock.calls[0]?.[0]).toContain('p.activo');
    expect(platillos).toHaveLength(1);
    expect(platillos[0]).toMatchObject({ nombre: 'Enchiladas verdes', activo: true });
  });

  it('incluye inactivos cuando se pide', async () => {
    ejecutar.mockResolvedValueOnce([[platilloFila], []]);

    await listarPlatillos(true);
    expect(ejecutar.mock.calls[0]?.[0]).not.toContain('WHERE');
  });
});

describe('platillos.service.crearPlatillo', () => {
  it('crea un platillo activo', async () => {
    ejecutar
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 5 }, []]);

    const platillo = await crearPlatillo({
      nombre: 'Enchiladas verdes',
      categoria: 'comidas',
      descripcion: 'Con arroz y frijoles',
    });

    expect(platillo).toEqual({
      id: 5,
      nombre: 'Enchiladas verdes',
      categoria: 'comidas',
      descripcion: 'Con arroz y frijoles',
      activo: true,
    });
  });

  it('rechaza NOMBRE_EN_USO si ya existe un platillo activo con ese nombre', async () => {
    ejecutar.mockResolvedValueOnce([[{ id: 9 }], []]);

    await expect(
      crearPlatillo({ nombre: 'Enchiladas verdes', categoria: 'comidas' }),
    ).rejects.toMatchObject({ codigo: 'NOMBRE_EN_USO', estadoHttp: 409 });
  });
});

describe('platillos.service.editarPlatillo', () => {
  it('lanza NO_ENCONTRADO si el platillo no existe', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(editarPlatillo(99, { nombre: 'Otro' })).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
      estadoHttp: 404,
    });
  });

  it('edita nombre, categoría y descripción', async () => {
    ejecutar
      .mockResolvedValueOnce([[platilloFila], []])
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([[{ ...platilloFila, nombre: 'Enchiladas rojas' }], []]);

    const platillo = await editarPlatillo(1, { nombre: 'Enchiladas rojas' });
    expect(platillo.nombre).toBe('Enchiladas rojas');
  });
});

describe('platillos.service.cambiarActivoPlatillo', () => {
  it('desactiva un platillo (baja lógica)', async () => {
    ejecutar
      .mockResolvedValueOnce([[platilloFila], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([[{ ...platilloFila, activo: 0 }], []]);

    const platillo = await cambiarActivoPlatillo(1, false);
    expect(platillo.activo).toBe(false);
  });

  it('lanza NO_ENCONTRADO con id inexistente', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(cambiarActivoPlatillo(99, false)).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });
});
