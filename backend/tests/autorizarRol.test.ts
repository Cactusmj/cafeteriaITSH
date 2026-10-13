import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { autenticar } from '../src/middlewares/autenticar.js';
import { autorizarRol } from '../src/middlewares/autorizarRol.js';
import { firmar } from '../src/utils/jwt.js';

function falsaPeticion(usuario?: { id: number; rol: string }): Request {
  return { headers: {}, usuario } as unknown as Request;
}

function capturarError(): { next: NextFunction; error: () => unknown } {
  let capturado: unknown;
  const next = ((err?: unknown) => {
    capturado = err;
  }) as NextFunction;
  return { next, error: () => capturado };
}

describe('middleware autenticar', () => {
  it('responde 401 sin encabezado Authorization', () => {
    const { next, error } = capturarError();
    autenticar(falsaPeticion(), {} as Response, next);
    expect(error()).toMatchObject({ codigo: 'NO_AUTORIZADO', estadoHttp: 401 });
  });

  it('adjunta el usuario con un token válido', () => {
    const token = firmar({ id: 3, rol: 'administrador' });
    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
    const next = vi.fn();

    autenticar(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.usuario).toEqual({ id: 3, rol: 'administrador' });
  });

  it('responde 401 con un token inválido', () => {
    const req = { headers: { authorization: 'Bearer roto' } } as unknown as Request;
    const { next, error } = capturarError();
    autenticar(req, {} as Response, next);
    expect(error()).toMatchObject({ codigo: 'NO_AUTORIZADO' });
  });
});

describe('middleware autorizarRol', () => {
  it('responde 401 sin sesión', () => {
    const { next, error } = capturarError();
    autorizarRol('administrador')(falsaPeticion(), {} as Response, next);
    expect(error()).toMatchObject({ codigo: 'NO_AUTORIZADO', estadoHttp: 401 });
  });

  it('responde 403 si el rol no está permitido', () => {
    const { next, error } = capturarError();
    autorizarRol('administrador')(falsaPeticion({ id: 1, rol: 'cajero' }), {} as Response, next);
    expect(error()).toMatchObject({ codigo: 'PROHIBIDO', estadoHttp: 403 });
  });

  it('deja pasar si el rol está permitido', () => {
    const next = vi.fn();
    autorizarRol('administrador')(falsaPeticion({ id: 1, rol: 'administrador' }), {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});
