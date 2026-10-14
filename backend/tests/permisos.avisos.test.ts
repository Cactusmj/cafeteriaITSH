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

describe('protección de GET /api/mis-pedidos', () => {
  it('responde 401 sin token', async () => {
    const respuesta = await fetch(`${base}/api/mis-pedidos`);
    expect(respuesta.status).toBe(401);
  });

  it('responde 403 con cajero y cocinero', async () => {
    for (const rol of ['cajero', 'cocinero']) {
      const respuesta = await fetch(`${base}/api/mis-pedidos`, {
        headers: conToken(rol),
      });
      expect(respuesta.status).toBe(403);
    }
  });
});

describe('protección de GET /api/avisos', () => {
  it('responde 401 sin token', async () => {
    const respuesta = await fetch(`${base}/api/avisos`);
    expect(respuesta.status).toBe(401);
  });

  it('responde 403 con cajero y cocinero', async () => {
    for (const rol of ['cajero', 'cocinero']) {
      const respuesta = await fetch(`${base}/api/avisos`, {
        headers: conToken(rol),
      });
      expect(respuesta.status).toBe(403);
    }
  });
});

describe('protección de PATCH /api/avisos/vistos', () => {
  it('responde 401 sin token', async () => {
    const respuesta = await fetch(`${base}/api/avisos/vistos`, { method: 'PATCH' });
    expect(respuesta.status).toBe(401);
  });

  it('responde 403 con cajero y cocinero', async () => {
    for (const rol of ['cajero', 'cocinero']) {
      const respuesta = await fetch(`${base}/api/avisos/vistos`, {
        method: 'PATCH',
        headers: conToken(rol),
      });
      expect(respuesta.status).toBe(403);
    }
  });
});
