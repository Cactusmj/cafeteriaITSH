import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/db.js', () => ({
  pool: { execute: vi.fn() },
}));

import { pool } from '../src/config/db.js';
import { crearPedido, buscarPedidoPorClave, obtenerPedidoPorId } from '../src/services/pedidos.service.js';

const ejecutar = pool.execute as unknown as import('vitest').Mock;

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

function formatearLocal(fecha: Date): string {
  return (
    `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}` +
    `T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
  );
}

const enUnaHora = formatearLocal(new Date(Date.now() + 60 * 60_000));
const enCincoMinutos = formatearLocal(new Date(Date.now() + 5 * 60_000));

const pedidoBase = {
  usuarioId: 7,
  fechaRecoleccion: enUnaHora,
  claveIdempotencia: '3f1a2b4c-1111-4222-8333-444455556666',
  items: [
    { menu_dia_id: 10, cantidad: 2 },
    { menu_dia_id: 14, cantidad: 1 },
  ],
};

const filasMenu = [
  { id: 10, precio: '35.00', disponible: 1, activo: 1, platillo: 'Gordita de chicharrón' },
  { id: 14, precio: '25.00', disponible: 1, activo: 1, platillo: 'Agua de horchata' },
];

beforeEach(() => {
  ejecutar.mockReset();
});

describe('pedidos.service.crearPedido', () => {
  it('crea el pedido en Pendiente con folio, total recalculado e historial', async () => {
    ejecutar
      .mockResolvedValueOnce([[], []]) // sin pedido previo con la clave
      .mockResolvedValueOnce([[{ id: 1 }], []]) // estado Pendiente
      .mockResolvedValueOnce([filasMenu, []]) // menú del día
      .mockResolvedValueOnce([{ insertId: 3 }, []]) // INSERT pedido
      .mockResolvedValueOnce([{ insertId: 21 }, []]) // detalle 1
      .mockResolvedValueOnce([{ insertId: 22 }, []]) // detalle 2
      .mockResolvedValueOnce([{ insertId: 31 }, []]); // historial

    const pedido = await crearPedido(pedidoBase);

    expect(pedido).toMatchObject({
      id: 3,
      numero: expect.stringMatching(/^PED-[A-Z0-9]{8}$/),
      tipo: 'anticipado',
      estado: 'Pendiente',
      total: '95.00',
      pago: null,
    });
    expect(pedido.detalle).toHaveLength(2);
    expect(pedido.detalle[0]).toMatchObject({
      menu_dia_id: 10,
      platillo: 'Gordita de chicharrón',
      cantidad: 2,
      precio_unitario: '35.00',
      subtotal: '70.00',
    });
    expect(ejecutar).toHaveBeenCalledTimes(7);
  });

  it('rechaza ANTICIPACION_INSUFICIENTE con menos de 10 minutos', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(
      crearPedido({ ...pedidoBase, fechaRecoleccion: enCincoMinutos }),
    ).rejects.toMatchObject({ codigo: 'ANTICIPACION_INSUFICIENTE', estadoHttp: 400 });
  });

  it('rechaza ANTICIPACION_INSUFICIENTE con un horario ya pasado', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);
    const pasada = formatearLocal(new Date(Date.now() - 60 * 60_000));

    await expect(
      crearPedido({ ...pedidoBase, fechaRecoleccion: pasada }),
    ).rejects.toMatchObject({ codigo: 'ANTICIPACION_INSUFICIENTE', estadoHttp: 400 });
  });

  it('rechaza PLATILLO_NO_DISPONIBLE si la entrada del menú no está disponible', async () => {
    ejecutar
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([
        [filasMenu[0], { ...filasMenu[1], disponible: 0 }],
        [],
      ]);

    await expect(crearPedido(pedidoBase)).rejects.toMatchObject({
      codigo: 'PLATILLO_NO_DISPONIBLE',
      estadoHttp: 409,
    });
  });

  it('rechaza PLATILLO_NO_DISPONIBLE si el platillo está inactivo', async () => {
    ejecutar
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([
        [filasMenu[0], { ...filasMenu[1], activo: 0 }],
        [],
      ]);

    await expect(crearPedido(pedidoBase)).rejects.toMatchObject({
      codigo: 'PLATILLO_NO_DISPONIBLE',
      estadoHttp: 409,
    });
  });

  it('rechaza MENU_DIA_NO_ENCONTRADO si un platillo no está en el menú de hoy', async () => {
    ejecutar
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([[filasMenu[0]], []]); // falta el id 14

    await expect(crearPedido(pedidoBase)).rejects.toMatchObject({
      codigo: 'MENU_DIA_NO_ENCONTRADO',
      estadoHttp: 404,
    });
  });

  it('devuelve el pedido existente con la misma clave de idempotencia', async () => {
    ejecutar
      .mockResolvedValueOnce([[{ id: 5 }], []]) // ya existe
      .mockResolvedValueOnce([
        [
          {
            id: 5,
            numero: 'PED-EXISTENTE',
            tipo: 'anticipado',
            usuario_id: 7,
            estado: 'Pendiente',
            fecha_recoleccion: new Date(2026, 10, 10, 13, 45),
            total: '95.00',
            creado_en: new Date(2026, 10, 10, 12, 30),
          },
          [],
        ],
      ])
      .mockResolvedValueOnce([
        [
          {
            menu_dia_id: 10,
            platillo: 'Gordita de chicharrón',
            cantidad: 2,
            precio_unitario: '35.00',
            subtotal: '70.00',
          },
        ],
        [],
      ])
      .mockResolvedValueOnce([[], []]); // sin pago

    const pedido = await crearPedido(pedidoBase);

    expect(pedido.id).toBe(5);
    expect(pedido.numero).toBe('PED-EXISTENTE');
    expect(ejecutar).toHaveBeenCalledTimes(4);
  });

  it('reintenta el folio si el INSERT falla por número duplicado', async () => {
    const errorDuplicado = Object.assign(new Error('Duplicate entry'), { code: 'ER_DUP_ENTRY' });

    ejecutar
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([filasMenu, []])
      .mockRejectedValueOnce(errorDuplicado) // primer INSERT: número duplicado
      .mockResolvedValueOnce([{ insertId: 4 }, []]) // segundo INSERT
      .mockResolvedValueOnce([{ insertId: 21 }, []])
      .mockResolvedValueOnce([{ insertId: 22 }, []])
      .mockResolvedValueOnce([{ insertId: 31 }, []]);

    const pedido = await crearPedido(pedidoBase);

    expect(pedido.id).toBe(4);
    expect(ejecutar).toHaveBeenCalledTimes(8);
  });
});

describe('pedidos.service.buscarPedidoPorClave', () => {
  it('devuelve el pedido cuando la clave existe', async () => {
    ejecutar
      .mockResolvedValueOnce([[{ id: 5 }], []])
      .mockResolvedValueOnce([
        [
          {
            id: 5,
            numero: 'PED-EXISTENTE',
            tipo: 'anticipado',
            usuario_id: 7,
            estado: 'Pendiente',
            fecha_recoleccion: new Date(2026, 10, 10, 13, 45),
            total: '95.00',
            creado_en: new Date(2026, 10, 10, 12, 30),
          },
        ],
        [],
      ])
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[], []]);

    const pedido = await buscarPedidoPorClave('clave-repetida', { id: 7, rol: 'usuario' });

    expect(pedido?.id).toBe(5);
  });

  it('devuelve null cuando la clave no existe', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(
      buscarPedidoPorClave('clave-nueva', { id: 7, rol: 'usuario' }),
    ).resolves.toBeNull();
  });
});

describe('pedidos.service.obtenerPedidoPorId', () => {
  it('devuelve el pedido con detalle y pago al dueño', async () => {
    ejecutar
      .mockResolvedValueOnce([
        [
          {
            id: 3,
            numero: 'PED-7K2M9QX4',
            tipo: 'anticipado',
            usuario_id: 7,
            estado: 'Pagado',
            fecha_recoleccion: new Date(2026, 10, 10, 13, 45),
            total: '95.00',
            creado_en: new Date(2026, 10, 10, 12, 30),
          },
          [],
        ],
      ])
      .mockResolvedValueOnce([
        [
          {
            menu_dia_id: 10,
            platillo: 'Gordita de chicharrón',
            cantidad: 2,
            precio_unitario: '35.00',
            subtotal: '70.00',
          },
        ],
        [],
      ])
      .mockResolvedValueOnce([
        [
          {
            metodo: 'online',
            monto: '95.00',
            referencia: 'sbx-000123',
            fecha: new Date(2026, 10, 10, 12, 31),
          },
        ],
        [],
      ]);

    const pedido = await obtenerPedidoPorId(3, { id: 7, rol: 'usuario' });

    expect(pedido).toMatchObject({
      id: 3,
      numero: 'PED-7K2M9QX4',
      estado: 'Pagado',
      total: '95.00',
      pago: { metodo: 'online', referencia: 'sbx-000123' },
    });
    expect(pedido.detalle).toHaveLength(1);
  });

  it('permite al administrador consultar cualquier pedido', async () => {
    ejecutar
      .mockResolvedValueOnce([
        [
          {
            id: 3,
            numero: 'PED-7K2M9QX4',
            tipo: 'anticipado',
            usuario_id: 7,
            estado: 'Pendiente',
            fecha_recoleccion: new Date(2026, 10, 10, 13, 45),
            total: '95.00',
            creado_en: new Date(2026, 10, 10, 12, 30),
          },
          [],
        ],
      ])
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[], []]);

    const pedido = await obtenerPedidoPorId(3, { id: 1, rol: 'administrador' });
    expect(pedido.estado).toBe('Pendiente');
    expect(pedido.pago).toBeNull();
  });

  it('rechaza con 403 a quien no es el dueño', async () => {
    ejecutar.mockResolvedValueOnce([
      [
        {
          id: 3,
          numero: 'PED-7K2M9QX4',
          tipo: 'anticipado',
          usuario_id: 7,
          estado: 'Pendiente',
          fecha_recoleccion: new Date(2026, 10, 10, 13, 45),
          total: '95.00',
          creado_en: new Date(2026, 10, 10, 12, 30),
        },
        [],
      ],
    ]);

    await expect(obtenerPedidoPorId(3, { id: 8, rol: 'usuario' })).rejects.toMatchObject({
      estadoHttp: 403,
    });
  });

  it('lanza PEDIDO_NO_ENCONTRADO con id inexistente', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(obtenerPedidoPorId(99, { id: 7, rol: 'usuario' })).rejects.toMatchObject({
      codigo: 'PEDIDO_NO_ENCONTRADO',
      estadoHttp: 404,
    });
  });
});
