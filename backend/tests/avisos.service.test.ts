import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/db.js', () => ({
  pool: { execute: vi.fn() },
}));

import { pool } from '../src/config/db.js';
import {
  emitirAvisoListo,
  listarAvisos,
  marcarVistos,
  obtenerMisPedidos,
} from '../src/services/avisos/avisos.service.js';
import { ProveedorNinguno, type ProveedorAvisos } from '../src/services/avisos/proveedor-avisos.js';

const ejecutar = pool.execute as unknown as import('vitest').Mock;

const proveedorOk: ProveedorAvisos = {
  enviarAviso: vi.fn().mockResolvedValue({ enviado: true }),
};

const proveedorRoto: ProveedorAvisos = {
  enviarAviso: vi.fn().mockRejectedValue(new Error('sin red')),
};

beforeEach(() => {
  ejecutar.mockReset();
  vi.mocked(proveedorOk.enviarAviso).mockClear();
  vi.mocked(proveedorRoto.enviarAviso).mockClear();
});

describe('avisos.service.emitirAvisoListo', () => {
  it('registra el aviso en-app y llama al proveedor', async () => {
    ejecutar.mockResolvedValueOnce([{ insertId: 5 }, []]);

    const aviso = await emitirAvisoListo(
      { pedidoId: 4, usuarioId: 7, numero: 'PED-ANTICIPADO' },
      proveedorOk,
    );

    expect(aviso).toMatchObject({
      id: 5,
      pedido_id: 4,
      tipo: 'pedido_listo',
      canal: 'app',
      estado_envio: 'enviada',
    });
    expect(proveedorOk.enviarAviso).toHaveBeenCalledWith({
      pedidoId: 4,
      usuarioId: 7,
      numero: 'PED-ANTICIPADO',
    });
    const sql = String(ejecutar.mock.calls[0]?.[0] ?? '');
    expect(sql).toContain('INSERT INTO notificacion');
  });

  it('registra lo en-app aunque el proveedor falle', async () => {
    ejecutar.mockResolvedValueOnce([{ insertId: 6 }, []]);

    const aviso = await emitirAvisoListo(
      { pedidoId: 4, usuarioId: 7, numero: 'PED-ANTICIPADO' },
      proveedorRoto,
    );

    expect(aviso.estado_envio).toBe('enviada');
  });

  it('omite el envío externo con el proveedor por defecto', async () => {
    ejecutar.mockResolvedValueOnce([{ insertId: 7 }, []]);

    const aviso = await emitirAvisoListo(
      { pedidoId: 4, usuarioId: 7, numero: 'PED-ANTICIPADO' },
      new ProveedorNinguno(),
    );

    expect(aviso.canal).toBe('app');
  });
});

describe('avisos.service.listarAvisos', () => {
  it('devuelve pendientes primero', async () => {
    ejecutar.mockResolvedValueOnce([
      [
        {
          id: 5,
          pedido_id: 4,
          numero: 'PED-ANTICIPADO',
          tipo: 'pedido_listo',
          canal: 'app',
          estado_envio: 'enviada',
          fecha: new Date(2026, 11, 10, 13, 2),
        },
        {
          id: 3,
          pedido_id: 2,
          numero: 'PED-OTRO',
          tipo: 'pedido_listo',
          canal: 'app',
          estado_envio: 'vista',
          fecha: new Date(2026, 11, 9, 12, 0),
        },
      ],
      [],
    ]);

    const avisos = await listarAvisos({ id: 7, rol: 'usuario' });

    expect(avisos).toHaveLength(2);
    expect(avisos[0]?.estado_envio).toBe('enviada');
    expect(ejecutar.mock.calls[0]?.[1]).toEqual([7]);
  });
});

describe('avisos.service.marcarVistos', () => {
  it('marca como vistas los avisos pendientes del dueño', async () => {
    ejecutar.mockResolvedValueOnce([{ affectedRows: 2 }, []]);

    await expect(marcarVistos(7)).resolves.toEqual({ actualizados: 2 });
  });
});

describe('avisos.service.obtenerMisPedidos', () => {
  it('lista solo los pedidos propios en orden descendente', async () => {
    ejecutar.mockResolvedValueOnce([
      [
        {
          id: 4,
          numero: 'PED-ANTICIPADO',
          tipo: 'anticipado',
          estado: 'Listo',
          total: '95.00',
          fecha_recoleccion: new Date(2026, 11, 10, 13, 45),
          creado_en: new Date(2026, 11, 10, 12, 30),
          lineas: 2,
        },
      ],
      [],
    ]);

    const pedidos = await obtenerMisPedidos(7);

    expect(pedidos).toHaveLength(1);
    expect(pedidos[0]).toMatchObject({ numero: 'PED-ANTICIPADO', estado: 'Listo' });
    expect(ejecutar.mock.calls[0]?.[1]).toEqual([7]);
  });

  it('devuelve lista vacía sin pedidos', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(obtenerMisPedidos(7)).resolves.toEqual([]);
  });
});
