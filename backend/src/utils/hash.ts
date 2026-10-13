import bcrypt from 'bcrypt';

/** Número de rondas de bcrypt. */
export const RONDAS = 10;

/** Genera el hash de una contraseña (nunca se guarda en texto plano). */
export function hashear(password: string): Promise<string> {
  return bcrypt.hash(password, RONDAS);
}

/** Compara una contraseña con su hash almacenado. */
export function verificar(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
