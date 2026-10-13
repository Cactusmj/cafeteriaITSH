import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/db.js', () => ({
  pool: { execute: vi.fn() },
}));

import { pool } from '../src/config/db.js';
import { iniciarSesion, registrarCliente } from '../src/services/auth.service.js';
import { ErrorAplicacion } from '../src/utils/errores.js';
import { hashear } from '../src/utils/hash.js';

const ejecutar = pool.execute as unknown as import('vitest').Mock;

beforeEach(() => {
  ejecutar.mockReset();
});

describe('auth.service.registrarCliente', () => {
  it('registra un cliente cuando el correo no existe', async () => {
    ejecutar
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 7 }, []]);

    const sesion = await registrarCliente({
      nombre: 'Ana',
      correo: 'ana@itssh.edu.mx',
      password: 'contrasena1',
    });

    expect(sesion.usuario).toEqual({
      id: 7,
      nombre: 'Ana',
      correo: 'ana@itssh.edu.mx',
      rol: 'usuario',
    });
    expect(typeof sesion.token).toBe('string');
  });

  it('rechaza con CORREO_EN_USO si el correo ya existe', async () => {
    ejecutar.mockResolvedValueOnce([
      [
        {
          id: 1,
          nombre: 'Ana',
          correo: 'ana@itssh.edu.mx',
          password_hash: 'x',
          activo: 1,
          rol: 'usuario',
        },
      ],
      [],
    ]);

    await expect(
      registrarCliente({ nombre: 'Ana', correo: 'ana@itssh.edu.mx', password: 'contrasena1' }),
    ).rejects.toMatchObject({ codigo: 'CORREO_EN_USO', estadoHttp: 409 });
  });
});

describe('auth.service.iniciarSesion', () => {
  it('rechaza con CREDENCIALES_INVALIDAS si el usuario no existe', async () => {
    ejecutar.mockResolvedValueOnce([[], []]);

    await expect(
      iniciarSesion({ correo: 'nadie@itssh.edu.mx', password: 'algo1234' }),
    ).rejects.toBeInstanceOf(ErrorAplicacion);
  });

  it('rechaza si la contraseña no coincide', async () => {
    const hash = await hashear('correcta123');
    ejecutar.mockResolvedValueOnce([
      [
        {
          id: 2,
          nombre: 'Luis',
          correo: 'luis@itssh.edu.mx',
          password_hash: hash,
          activo: 1,
          rol: 'usuario',
        },
      ],
      [],
    ]);

    await expect(
      iniciarSesion({ correo: 'luis@itssh.edu.mx', password: 'incorrecta123' }),
    ).rejects.toMatchObject({ codigo: 'NO_AUTORIZADO', estadoHttp: 401 });
  });

  it('rechaza si la cuenta está inactiva', async () => {
    const hash = await hashear('correcta123');
    ejecutar.mockResolvedValueOnce([
      [
        {
          id: 3,
          nombre: 'Inactiva',
          correo: 'inactiva@itssh.edu.mx',
          password_hash: hash,
          activo: 0,
          rol: 'usuario',
        },
      ],
      [],
    ]);

    await expect(
      iniciarSesion({ correo: 'inactiva@itssh.edu.mx', password: 'correcta123' }),
    ).rejects.toMatchObject({ codigo: 'NO_AUTORIZADO' });
  });

  it('inicia sesión con credenciales válidas', async () => {
    const hash = await hashear('correcta123');
    ejecutar.mockResolvedValueOnce([
      [
        {
          id: 4,
          nombre: 'Marta',
          correo: 'marta@itssh.edu.mx',
          password_hash: hash,
          activo: 1,
          rol: 'cajero',
        },
      ],
      [],
    ]);

    const sesion = await iniciarSesion({ correo: 'marta@itssh.edu.mx', password: 'correcta123' });
    expect(sesion.usuario).toMatchObject({ id: 4, rol: 'cajero' });
    expect(typeof sesion.token).toBe('string');
  });
});
