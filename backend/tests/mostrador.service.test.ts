import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/db.js', () => ({
  pool: { execute: vi.fn() },
}));

import { pool } from '../src/config/db.js';
import { cobrarMostrador, crearMostrador } from '../src/services/mostrador.service.js';
import { obtenerPedidoPorId } from '../src/services/pedidos.service.js';

const ejecutar = pool.execute as unknown as import('vitest').Mock;

const filasMenu = [
  { id: 12, precio: '35.00', disponible: 1, activo: 1, platillo: 'Gordita de chicharrón' },
  { id: 16, precio: '20.00', disponible: 1, activo: 1, platillo: 'Café de olla' },
];

const crearBase = {
  cajeroId: 2,
  clienteNombre: 'Marta',
  claveIdempotencia: '9f8e7d6c-1111-4222-8333-444455556666',
  items: [
    { menu_dia_id: 12, cantidad: 2 },
    { menu_dia_id: 16, cantidad: 1 },
  ],
};

const filaMostradorPendiente = {
  id: 9,
  numero: 'PED-3F8K2QZA',
  tipo: 'mostrador',
  usuario_id: null,
  estado: 'Pendiente',
  fecha_recoleccion: null,
  total: '90.00',
  creado_en: new Date(2026, 10, 11, 13, 2),
};

beforeEach(() => {
  ejecutar.mockReset();
});

describe('mostrador.service.crearMostrador', () => {
  it('crea el pedido de mostrador en Pendiente sin horario', async () => {
    ejecutar
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([filasMenu, []])
      .mockResolvedValueOnce([{ insertId: 9 }, []])
      .mockResolvedValueOnce([{ insertId: 41 }, []])
      .mockResolvedValueOnce([{ insertId: 42 }, []])
      .mockResolvedValueOnce([{ insertId: 43 }, []]);

    const pedido = await crearMostrador(crearBase);

    expect(pedido).toMatchObject({
      id: 9,
      tipo: 'mostrador',
      estado: 'Pendiente',
      total: '90.00',
      pago: null,
    });
    expect(pedido.detalle).toHaveLength(2);
    const insertPedido = String(ejecutar.mock.calls[3]?.[0] ?? '');
    expect(insertPedido).toContain("'mostrador'");
  });

  it('rechaza PLATILLO_NO_DISPONIBLE', async () => {
    ejecutar
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([[{ ...filasMenu[0] }, { ...filasMenu[1], disponible: 0 }], []]);

    await expect(crearMostrador(crearBase)).rejects.toMatchObject({
      codigo: 'PLATILLO_NO_DISPONIBLE',
      estadoHttp: 409,
    });
  });

  it('devuelve el pedido existente con la misma clave de idempotencia', async () => {
    ejecutar
      .mockResolvedValueOnce([[{ id: 7 }], []])
      .mockResolvedValueOnce([
        [{ ...filaMostradorPendiente, id: 7, numero: 'PED-EXISTENTE' }],
        [],
      ])
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[], []]);

    const pedido = await crearMostrador(crearBase);

    expect(pedido.id).toBe(7);
    expect(pedido.numero).toBe('PED-EXISTENTE');
    expect(ejecutar).toHaveBeenCalledTimes(4);
  });
});

describe('mostrador.service.cobrarMostrador', () => {
  it('cobra en efectivo con cambio y deja el pedido Pagado', async () => {
    ejecutar
      .mockResolvedValueOnce([[filaMostradorPendiente], []])
      .mockResolvedValueOnce([[{ id: 2 }], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([{ insertId: 1 }, []])
      .mockResolvedValueOnce([{ insertId: 2 }, []]);

    const cobro = await cobrarMostrador(9, 2, 100);

    expect(cobro).toMatchObject({
      id: 9,
      estado: 'Pagado',
      total: '90.00',
      monto_recibido: '100.00',
      cambio: '10.00',
      pago: { metodo: 'efectivo', monto: '90.00', referencia: 'efectivo-PED-3F8K2QZA' },
    });
    expect(ejecutar).toHaveBeenCalledTimes(5);
  });

  it('rechaza COBRO_INSUFICIENTE dejando el pedido Pendiente', async () => {
    ejecutar.mockResolvedValueOnce([[filaMostradorPendiente], []]);

    await expect(cobrarMostrador(9, 2, 50)).rejects.toMatchObject({
      codigo: 'COBRO_INSUFICIENTE',
      estadoHttp: 402,
    });
    expect(ejecutar).toHaveBeenCalledTimes(1);
  });

  it('devuelve el mismo cobro si el pedido ya está Pagado', async () => {
    ejecutar
      .mockResolvedValueOnce([[{ ...filaMostradorPendiente, estado: 'Pagado' }], []])
      .mockResolvedValueOnce([
        [
          {
            metodo: 'efectivo',
            monto: '90.00',
            referencia: 'efectivo-PED-3F8K2QZA',
            fecha: new Date(2026, 10, 11, 13, 3),
          },
        ],
        [],
      ]);

    const cobro = await cobrarMostrador(9, 2, 100);

    expect(cobro.estado).toBe('Pagado');
    expect(cobro.pago.referencia).toBe('efectivo-PED-3F8K2QZA');
    expect(ejecutar).toHaveBeenCalledTimes(2);
  });

  it('rechaza ESTADO_INVALIDO al cobrar un anticipado', async () => {
    ejecutar.mockResolvedValueOnce([
      [{ ...filaMostradorPendiente, tipo: 'anticipado', usuario_id: 7 }],
      [],
    ]);

    await expect(cobrarMostrador(9, 2, 100)).rejects.toMatchObject({
      codigo: 'ESTADO_INVALIDO',
      estadoHttp: 409,
    });
  });

  it('lanza PEDIDO_NO_ENCONTRADO con id inexistente', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(cobrarMostrador(99, 2, 100)).rejects.toMatchObject({
      codigo: 'PEDIDO_NO_ENCONTRADO',
      estadoHttp: 404,
    });
  });
});

describe('pedidos.service.obtenerPedidoPorId con mostrador', () => {
  it('permite al cajero ver un pedido de mostrador', async () => {
    ejecutar
      .mockResolvedValueOnce([[filaMostradorPendiente], []])
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[], []]);

    const pedido = await obtenerPedidoPorId(9, { id: 2, rol: 'cajero' });
    expect(pedido.id).toBe(9);
  });

  it('rechaza con 403 al cocinero en un pedido de mostrador', async () => {
    ejecutar.mockResolvedValueOnce([[filaMostradorPendiente], []]);

    await expect(obtenerPedidoPorId(9, { id: 3, rol: 'cocinero' })).rejects.toMatchObject({
      estadoHttp: 403,
    });
  });
});
