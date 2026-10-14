import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app.js';
import { firmar } from '../src/utils/jwt.js';

let servidor: Server;
let base: string;

beforeAll(async () => {
  const app = crearApp();
  await new Promise<void>((resolver) => {
    servidor = app.listen(0, () => resolver());
  });
  const direccion = servidor.address();
  const puerto = typeof direccion === 'object' && direccion ? direccion.port : 0;
  base = `http://127.0.0.1:${puerto}`;
});

afterAll(() => {
  servidor.close();
});

function conToken(rol: string): Record<string, string> {
  return { Authorization: `Bearer ${firmar({ id: 1, rol })}` };
}

describe('protección de mostrador y caja', () => {
  it('POST /api/pedidos/mostrador responde 401 sin token', async () => {
    const respuesta = await fetch(`${base}/api/pedidos/mostrador`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(respuesta.status).toBe(401);
  });

  it('POST /api/pedidos/mostrador responde 403 con rol cliente y cocinero', async () => {
    for (const rol of ['usuario', 'cocinero']) {
      const respuesta = await fetch(`${base}/api/pedidos/mostrador`, {
        method: 'POST',
        headers: { ...conToken(rol), 'Content-Type': 'application/json' },
        body: '{}',
      });
      expect(respuesta.status).toBe(403);
    }
  });

  it('POST /api/pedidos/:id/cobro responde 401 sin token y 403 con cocinero', async () => {
    const sinToken = await fetch(`${base}/api/pedidos/1/cobro`, { method: 'POST' });
    expect(sinToken.status).toBe(401);

    const cocinero = await fetch(`${base}/api/pedidos/1/cobro`, {
      method: 'POST',
      headers: conToken('cocinero'),
    });
    expect(cocinero.status).toBe(403);
  });

  it('GET /api/caja/pendientes responde 401 sin token y 403 con cocinero', async () => {
    const sinToken = await fetch(`${base}/api/caja/pendientes`);
    expect(sinToken.status).toBe(401);

    const cocinero = await fetch(`${base}/api/caja/pendientes`, {
      headers: conToken('cocinero'),
    });
    expect(cocinero.status).toBe(403);
  });
});

describe('protección de cocina y transiciones', () => {
  it('GET /api/cocina/pedidos responde 401 sin token y 403 con cajero', async () => {
    const sinToken = await fetch(`${base}/api/cocina/pedidos`);
    expect(sinToken.status).toBe(401);

    const cajero = await fetch(`${base}/api/cocina/pedidos`, {
      headers: conToken('cajero'),
    });
    expect(cajero.status).toBe(403);
  });

  it('PATCH /api/pedidos/:id/estado responde 401 sin token', async () => {
    const respuesta = await fetch(`${base}/api/pedidos/1/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{"estado":"Listo"}',
    });
    expect(respuesta.status).toBe(401);
  });

  it('PATCH /api/pedidos/:id/estado responde 403 con rol cliente', async () => {
    const respuesta = await fetch(`${base}/api/pedidos/1/estado`, {
      method: 'PATCH',
      headers: { ...conToken('usuario'), 'Content-Type': 'application/json' },
      body: '{"estado":"Listo"}',
    });
    expect(respuesta.status).toBe(403);
  });
});
