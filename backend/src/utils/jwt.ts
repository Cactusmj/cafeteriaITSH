import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** Contenido del token de sesión. */
export interface PayloadSesion {
  id: number;
  rol: string;
}

/** Firma un token de sesión con el rol e identidad del usuario. */
export function firmar(payload: PayloadSesion): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.expiracionToken as jwt.SignOptions['expiresIn'] });
}

/** Verifica un token y devuelve su contenido; lanza si es inválido o expiró. */
export function verificar(token: string): PayloadSesion {
  const decodificado = jwt.verify(token, env.jwtSecret);
  if (typeof decodificado === 'string') {
    throw new jwt.JsonWebTokenError('Token inválido');
  }
  return { id: Number(decodificado.id), rol: String(decodificado.rol) };
}
