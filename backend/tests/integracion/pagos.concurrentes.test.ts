import { randomUUID } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pool } from '../../src/config/db.js';
import { pagarPedido } from '../../src/services/pedidos.service.js';
import type { ProveedorPago } from '../../src/services/pagos/proveedor-pago.js';

const describirIntegracion = process.env.DB_PRUEBAS ? describe : describe.skip;

const proveedor: ProveedorPago = {
  procesarPago: async ({ numero }) => ({ aprobado: true, referencia: `conc-${numero}` }),
};

let usuarioId = 0;
let pedidoId = 0;
let numeroPedido = '';

async function contarPagos(id: number): Promise<number> {
  const [filas] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM pago WHERE pedido_id = ?',
    [id],
  );
  return Number(filas[0]?.total ?? 0);
}

describirIntegracion('pagos concurrentes con MySQL real', () => {
  beforeAll(async () => {
    const [roles] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM rol WHERE nombre = ? LIMIT 1',
      ['usuario'],
    );
    const rolId = roles[0]?.id;
    if (!rolId) {
      throw new Error('Falta el rol usuario; ejecuta las migraciones y el seed inicial');
    }

    const [estados] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM estado_pedido WHERE nombre = ? LIMIT 1',
      ['Pendiente'],
    );
    const estadoId = estados[0]?.id;
    if (!estadoId) {
      throw new Error('Falta el estado Pendiente; ejecuta las migraciones y el seed inicial');
    }

    const [usuario] = await pool.execute<ResultSetHeader>(
      `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
       VALUES (?, ?, ?, TRUE, ?)`,
      [
        'Prueba concurrencia',
        `concurrencia-${randomUUID()}@pruebas.local`,
        'sin-uso',
        rolId,
      ],
    );
    usuarioId = usuario.insertId;

    numeroPedido = `PED-CONC${Date.now().toString(36).toUpperCase()}`;
    const fechaRecoleccion = new Date(Date.now() + 60 * 60_000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    const [pedido] = await pool.execute<ResultSetHeader>(
      `INSERT INTO pedido
         (numero, tipo, estado_id, usuario_id, fecha_recoleccion, total, creado_por, clave_idempotencia)
       VALUES (?, 'anticipado', ?, ?, ?, '95.00', ?, ?)`,
      [numeroPedido, estadoId, usuarioId, fechaRecoleccion, usuarioId, randomUUID()],
    );
    pedidoId = pedido.insertId;
  });

  afterAll(async () => {
    if (pedidoId) {
      await pool.execute('DELETE FROM notificacion WHERE pedido_id = ?', [pedidoId]);
      await pool.execute('DELETE FROM pago WHERE pedido_id = ?', [pedidoId]);
      await pool.execute('DELETE FROM pedido_estado_historial WHERE pedido_id = ?', [pedidoId]);
      await pool.execute('DELETE FROM pedido_detalle WHERE pedido_id = ?', [pedidoId]);
      await pool.execute('DELETE FROM pedido WHERE id = ?', [pedidoId]);
    }
    if (usuarioId) {
      await pool.execute('DELETE FROM usuario WHERE id = ?', [usuarioId]);
    }
    await pool.end();
  });

  it('resuelve 5 pagos simultáneos sin error 500 ni pagos duplicados', async () => {
    const resultados = await Promise.all(
      Array.from({ length: 5 }, () => pagarPedido(pedidoId, usuarioId, proveedor)),
    );

    for (const resultado of resultados) {
      expect(resultado.estado).toBe('Pagado');
      expect(resultado.pago.metodo).toBe('online');
      expect(resultado.pago.referencia).toBe(`conc-${numeroPedido}`);
    }

    expect(await contarPagos(pedidoId)).toBe(1);

    const [filas] = await pool.execute<RowDataPacket[]>(
      `SELECT ep.nombre AS estado
       FROM pedido p
       INNER JOIN estado_pedido ep ON ep.id = p.estado_id
       WHERE p.id = ?`,
      [pedidoId],
    );
    expect(filas[0]?.estado).toBe('Pagado');
  });
});
