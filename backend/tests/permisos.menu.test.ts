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

describe('protección de /api/admin/platillos', () => {
  it('responde 401 sin token', async () => {
    const respuesta = await fetch(`${base}/api/admin/platillos`);
    expect(respuesta.status).toBe(401);
    const cuerpo = (await respuesta.json()) as { error: { codigo: string } };
    expect(cuerpo.error.codigo).toBe('NO_AUTORIZADO');
  });

  it('responde 403 con rol cliente', async () => {
    const token = firmar({ id: 1, rol: 'usuario' });
    const respuesta = await fetch(`${base}/api/admin/platillos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(respuesta.status).toBe(403);
  });

  it('responde 403 con rol cajero', async () => {
    const token = firmar({ id: 2, rol: 'cajero' });
    const respuesta = await fetch(`${base}/api/admin/platillos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(respuesta.status).toBe(403);
  });
});

describe('protección de /api/admin/menu', () => {
  it('responde 401 sin token', async () => {
    const respuesta = await fetch(`${base}/api/admin/menu`);
    expect(respuesta.status).toBe(401);
  });

  it('responde 403 con rol cliente', async () => {
    const token = firmar({ id: 1, rol: 'usuario' });
    const respuesta = await fetch(`${base}/api/admin/menu`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(respuesta.status).toBe(403);
  });

  it('responde 403 con rol cocinero', async () => {
    const token = firmar({ id: 3, rol: 'cocinero' });
    const respuesta = await fetch(`${base}/api/admin/menu`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(respuesta.status).toBe(403);
  });
});
