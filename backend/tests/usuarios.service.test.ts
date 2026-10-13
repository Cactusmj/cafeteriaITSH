import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/db.js', () => ({
  pool: { execute: vi.fn() },
}));

import { pool } from '../src/config/db.js';
import {
  cambiarEstado,
  crearUsuario,
  editarUsuario,
  listarUsuarios,
} from '../src/services/usuarios.service.js';

const ejecutar = pool.execute as unknown as import('vitest').Mock;

beforeEach(() => {
  ejecutar.mockReset();
});

describe('usuarios.service.listarUsuarios', () => {
  it('rechaza un filtro de rol no operativo', async () => {
    await expect(listarUsuarios('administrador')).rejects.toMatchObject({
      codigo: 'VALIDACION',
      estadoHttp: 400,
    });
    expect(ejecutar).not.toHaveBeenCalled();
  });

  it('lista solo cuentas operativas', async () => {
    ejecutar.mockResolvedValueOnce([
      [
        { id: 1, nombre: 'Caja', correo: 'caja@itssh.edu.mx', activo: 1, rol: 'cajero' },
        { id: 2, nombre: 'Cocina', correo: 'cocina@itssh.edu.mx', activo: 1, rol: 'cocinero' },
      ],
      [],
    ]);

    const usuarios = await listarUsuarios();
    expect(usuarios).toHaveLength(2);
    expect(usuarios[0]).toMatchObject({ rol: 'cajero', activo: true });
  });
});

describe('usuarios.service.crearUsuario', () => {
  it('rechaza con CORREO_EN_USO si el correo existe', async () => {
    ejecutar.mockResolvedValueOnce([
      [
        {
          id: 9,
          nombre: 'Existe',
          correo: 'caja@itssh.edu.mx',
          password_hash: 'x',
          activo: 1,
          rol: 'cajero',
        },
      ],
      [],
    ]);

    await expect(
      crearUsuario({ nombre: 'Nueva', correo: 'caja@itssh.edu.mx', password: 'secreto123', rol: 'cajero' }),
    ).rejects.toMatchObject({ codigo: 'CORREO_EN_USO' });
  });

  it('crea una cuenta operativa', async () => {
    ejecutar
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 11 }, []]);

    const usuario = await crearUsuario({
      nombre: 'Nueva',
      correo: 'nueva@itssh.edu.mx',
      password: 'secreto123',
      rol: 'cocinero',
    });

    expect(usuario).toEqual({
      id: 11,
      nombre: 'Nueva',
      correo: 'nueva@itssh.edu.mx',
      rol: 'cocinero',
      activo: true,
    });
  });
});

describe('usuarios.service.editarUsuario', () => {
  it('lanza 404 si la cuenta no existe', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(editarUsuario(99, { nombre: 'X' })).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
      estadoHttp: 404,
    });
  });
});

describe('usuarios.service.cambiarEstado', () => {
  it('no permite deshabilitar la propia cuenta', async () => {
    ejecutar.mockResolvedValueOnce([
      [{ id: 1, nombre: 'Admin op', correo: 'op@itssh.edu.mx', activo: 1, rol: 'cajero' }],
      [],
    ]);

    await expect(cambiarEstado(1, false, 1)).rejects.toMatchObject({ codigo: 'CONFLICTO' });
  });

  it('responde CONFLICTO al deshabilitar la propia cuenta aunque no sea operativa', async () => {
    await expect(cambiarEstado(1, false, 1)).rejects.toMatchObject({
      codigo: 'CONFLICTO',
      estadoHttp: 409,
    });
    expect(ejecutar).not.toHaveBeenCalled();
  });

  it('deshabilita una cuenta distinta', async () => {
    ejecutar
      .mockResolvedValueOnce([
        [{ id: 2, nombre: 'Op', correo: 'op2@itssh.edu.mx', activo: 1, rol: 'cajero' }],
        [],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([
        [{ id: 2, nombre: 'Op', correo: 'op2@itssh.edu.mx', activo: 0, rol: 'cajero' }],
        [],
      ]);

    const usuario = await cambiarEstado(2, false, 1);
    expect(usuario.activo).toBe(false);
  });
});
