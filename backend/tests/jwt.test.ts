import { describe, expect, it } from 'vitest';
import { firmar, verificar } from '../src/utils/jwt.js';

describe('utilidades JWT', () => {
  it('firma y verifica un payload', () => {
    const token = firmar({ id: 5, rol: 'administrador' });
    expect(typeof token).toBe('string');
    expect(verificar(token)).toEqual({ id: 5, rol: 'administrador' });
  });

  it('rechaza un token inválido', () => {
    expect(() => verificar('token-invalido')).toThrow();
  });
});
