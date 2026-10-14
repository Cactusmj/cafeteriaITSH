import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/db.js', () => ({
  pool: { execute: vi.fn() },
}));

import { pool } from '../src/config/db.js';
import { pagarPedido } from '../src/services/pedidos.service.js';
import type { ProveedorPago } from '../src/services/pagos/proveedor-pago.js';

const ejecutar = pool.execute as unknown as import('vitest').Mock;

const proveedorAprueba: ProveedorPago = {
  procesarPago: vi.fn().mockResolvedValue({ aprobado: true, referencia: 'sbx-000123' }),
};

const proveedorRechaza: ProveedorPago = {
  procesarPago: vi
    .fn()
    .mockResolvedValue({ aprobado: false, referencia: null, mensaje: 'Pago rechazado por el proveedor de prueba' }),
};

const filaPendiente = {
  id: 3,
  numero: 'PED-7K2M9QX4',
  tipo: 'anticipado',
  usuario_id: 7,
  estado: 'Pendiente',
  fecha_recoleccion: new Date(2026, 10, 10, 13, 45),
  total: '95.00',
  creado_en: new Date(2026, 10, 10, 12, 30),
};

beforeEach(() => {
  ejecutar.mockReset();
  vi.mocked(proveedorAprueba.procesarPago).mockClear();
  vi.mocked(proveedorRechaza.procesarPago).mockClear();
});

describe('pedidos.service.pagarPedido', () => {
  it('pasa el pedido a Pagado con pago e historial cuando el proveedor aprueba', async () => {
    ejecutar
      .mockResolvedValueOnce([[filaPendiente], []]) // pedido
      .mockResolvedValueOnce([[{ valida: 1 }], []]) // transición Pendiente → Pagado
      .mockResolvedValueOnce([[{ id: 2 }], []]) // estado Pagado
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // UPDATE pedido
      .mockResolvedValueOnce([{ insertId: 1 }, []]) // INSERT pago
      .mockResolvedValueOnce([{ insertId: 2 }, []]); // historial

    const resultado = await pagarPedido(3, 7, proveedorAprueba);

    expect(resultado).toMatchObject({
      id: 3,
      estado: 'Pagado',
      total: '95.00',
      pago: { metodo: 'online', monto: '95.00', referencia: 'sbx-000123' },
    });
    expect(proveedorAprueba.procesarPago).toHaveBeenCalledWith({
      numero: 'PED-7K2M9QX4',
      monto: '95.00',
      idempotencia: expect.any(String) as string,
    });
    expect(ejecutar).toHaveBeenCalledTimes(6);
  });

  it('rechaza PAGO_RECHAZADO dejando el pedido Pendiente', async () => {
    ejecutar
      .mockResolvedValueOnce([[filaPendiente], []])
      .mockResolvedValueOnce([[{ valida: 1 }], []])
      .mockResolvedValueOnce([[{ id: 2 }], []]);

    await expect(pagarPedido(3, 7, proveedorRechaza)).rejects.toMatchObject({
      codigo: 'PAGO_RECHAZADO',
      estadoHttp: 402,
    });
    expect(ejecutar).toHaveBeenCalledTimes(3);
  });

  it('devuelve la misma confirmación si el pedido ya está Pagado (idempotente)', async () => {
    ejecutar
      .mockResolvedValueOnce([[{ ...filaPendiente, estado: 'Pagado' }], []])
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

    const resultado = await pagarPedido(3, 7, proveedorAprueba);

    expect(resultado.estado).toBe('Pagado');
    expect(resultado.pago?.referencia).toBe('sbx-000123');
    expect(proveedorAprueba.procesarPago).not.toHaveBeenCalled();
    expect(ejecutar).toHaveBeenCalledTimes(2);
  });

  it('rechaza ESTADO_INVALIDO si el pedido no está Pendiente', async () => {
    ejecutar.mockResolvedValueOnce([[{ ...filaPendiente, estado: 'Cancelado' }], []]);

    await expect(pagarPedido(3, 7, proveedorAprueba)).rejects.toMatchObject({
      codigo: 'ESTADO_INVALIDO',
      estadoHttp: 409,
    });
  });

  it('rechaza con 403 a quien no es el dueño', async () => {
    ejecutar.mockResolvedValueOnce([[filaPendiente], []]);

    await expect(pagarPedido(3, 8, proveedorAprueba)).rejects.toMatchObject({
      estadoHttp: 403,
    });
    expect(proveedorAprueba.procesarPago).not.toHaveBeenCalled();
  });

  it('lanza PEDIDO_NO_ENCONTRADO con id inexistente', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(pagarPedido(99, 7, proveedorAprueba)).rejects.toMatchObject({
      codigo: 'PEDIDO_NO_ENCONTRADO',
      estadoHttp: 404,
    });
  });
});
