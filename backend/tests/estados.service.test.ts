import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/db.js', () => ({
  pool: { execute: vi.fn() },
}));

import { pool } from '../src/config/db.js';
import { avanzarEstado } from '../src/services/pedidos.service.js';

const ejecutar = pool.execute as unknown as import('vitest').Mock;

const filaPagado = {
  id: 4,
  numero: 'PED-ANTICIPADO',
  tipo: 'anticipado',
  usuario_id: 7,
  estado: 'Pagado',
  fecha_recoleccion: new Date(2026, 10, 10, 13, 45),
  total: '95.00',
  creado_en: new Date(2026, 10, 10, 12, 30),
};

const cocinero = { id: 3, rol: 'cocinero' };
const cajero = { id: 2, rol: 'cajero' };

beforeEach(() => {
  ejecutar.mockReset();
});

describe('pedidos.service.avanzarEstado (cocinero)', () => {
  it('avanza de Pagado a En preparación con historial', async () => {
    ejecutar
      .mockResolvedValueOnce([[filaPagado], []])
      .mockResolvedValueOnce([[{ valida: 1 }], []])
      .mockResolvedValueOnce([
        [
          { id: 2, nombre: 'Pagado' },
          { id: 3, nombre: 'En preparación' },
        ],
        [],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([{ insertId: 9 }, []]);

    const cambio = await avanzarEstado(4, cocinero, 'En preparación');

    expect(cambio).toEqual({
      id: 4,
      numero: 'PED-ANTICIPADO',
      estado_anterior: 'Pagado',
      estado: 'En preparación',
    });
    expect(ejecutar).toHaveBeenCalledTimes(5);
  });

  it('rechaza el salto directo de Pagado a Listo', async () => {
    ejecutar
      .mockResolvedValueOnce([[filaPagado], []])
      .mockResolvedValueOnce([[], []]);

    await expect(avanzarEstado(4, cocinero, 'Listo')).rejects.toMatchObject({
      codigo: 'ESTADO_INVALIDO',
      estadoHttp: 409,
    });
    expect(ejecutar).toHaveBeenCalledTimes(2);
  });

  it('rechaza cambios sobre un pedido Entregado', async () => {
    ejecutar.mockResolvedValueOnce([[{ ...filaPagado, estado: 'Entregado' }], []]);

    await expect(avanzarEstado(4, cocinero, 'Listo')).rejects.toMatchObject({
      codigo: 'ESTADO_INVALIDO',
      estadoHttp: 409,
    });
    expect(ejecutar).toHaveBeenCalledTimes(1);
  });

  it('rechaza con 403 al cajero en destinos de cocina', async () => {
    await expect(avanzarEstado(4, cajero, 'En preparación')).rejects.toMatchObject({
      estadoHttp: 403,
    });
    expect(ejecutar).not.toHaveBeenCalled();
  });

  it('lanza PEDIDO_NO_ENCONTRADO con id inexistente', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(avanzarEstado(99, cocinero, 'En preparación')).rejects.toMatchObject({
      codigo: 'PEDIDO_NO_ENCONTRADO',
      estadoHttp: 404,
    });
  });
});

describe('pedidos.service.avanzarEstado (cajero)', () => {
  it('marca Entregado desde Listo', async () => {
    ejecutar
      .mockResolvedValueOnce([[{ ...filaPagado, estado: 'Listo' }], []])
      .mockResolvedValueOnce([[{ valida: 1 }], []])
      .mockResolvedValueOnce([
        [
          { id: 4, nombre: 'Listo' },
          { id: 5, nombre: 'Entregado' },
        ],
        [],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([{ insertId: 9 }, []]);

    const cambio = await avanzarEstado(4, cajero, 'Entregado');

    expect(cambio).toEqual({
      id: 4,
      numero: 'PED-ANTICIPADO',
      estado_anterior: 'Listo',
      estado: 'Entregado',
    });
  });

  it.each(['Pendiente', 'Pagado', 'En preparación', 'Listo'])(
    'cancela desde %s',
    async (estado) => {
      ejecutar
        .mockResolvedValueOnce([[{ ...filaPagado, estado }], []])
        .mockResolvedValueOnce([[{ valida: 1 }], []])
        .mockResolvedValueOnce([
          [
            { id: 1, nombre: estado },
            { id: 0, nombre: 'Cancelado' },
          ],
          [],
        ])
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])
        .mockResolvedValueOnce([{ insertId: 9 }, []]);

      const cambio = await avanzarEstado(4, cajero, 'Cancelado');
      expect(cambio.estado).toBe('Cancelado');
      expect(cambio.estado_anterior).toBe(estado);
    },
  );

  it('rechaza con 403 al cocinero en Entregado y Cancelado', async () => {
    await expect(avanzarEstado(4, cocinero, 'Entregado')).rejects.toMatchObject({
      estadoHttp: 403,
    });
    await expect(avanzarEstado(4, cocinero, 'Cancelado')).rejects.toMatchObject({
      estadoHttp: 403,
    });
    expect(ejecutar).not.toHaveBeenCalled();
  });
});

describe('pedidos.service.avanzarEstado dispara avisos', () => {
  const filaEnPreparacion = { ...filaPagado, estado: 'En preparación' };

  it('genera el aviso al confirmar Listo con dueño', async () => {
    ejecutar
      .mockResolvedValueOnce([[filaEnPreparacion], []])
      .mockResolvedValueOnce([[{ valida: 1 }], []])
      .mockResolvedValueOnce([
        [
          { id: 3, nombre: 'En preparación' },
          { id: 4, nombre: 'Listo' },
        ],
        [],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([{ insertId: 9 }, []])
      .mockResolvedValueOnce([{ insertId: 11 }, []]);

    const cambio = await avanzarEstado(4, cocinero, 'Listo');

    expect(cambio.estado).toBe('Listo');
    expect(ejecutar).toHaveBeenCalledTimes(6);
    const sqlAviso = String(ejecutar.mock.calls[5]?.[0] ?? '');
    expect(sqlAviso).toContain('INSERT INTO notificacion');
  });

  it('no genera aviso en otros destinos', async () => {
    ejecutar
      .mockResolvedValueOnce([[filaPagado], []])
      .mockResolvedValueOnce([[{ valida: 1 }], []])
      .mockResolvedValueOnce([
        [
          { id: 2, nombre: 'Pagado' },
          { id: 3, nombre: 'En preparación' },
        ],
        [],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([{ insertId: 9 }, []]);

    await avanzarEstado(4, cocinero, 'En preparación');

    const consultas = ejecutar.mock.calls.map((llamada) => String(llamada[0] ?? ''));
    expect(consultas.some((sql) => sql.includes('notificacion'))).toBe(false);
  });

  it('no genera aviso sin dueño (mostrador anónimo)', async () => {
    ejecutar
      .mockResolvedValueOnce([
        [{ ...filaEnPreparacion, tipo: 'mostrador', usuario_id: null }],
        [],
      ])
      .mockResolvedValueOnce([[{ valida: 1 }], []])
      .mockResolvedValueOnce([
        [
          { id: 3, nombre: 'En preparación' },
          { id: 4, nombre: 'Listo' },
        ],
        [],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([{ insertId: 9 }, []]);

    await avanzarEstado(4, cocinero, 'Listo');

    expect(ejecutar).toHaveBeenCalledTimes(5);
  });
});
