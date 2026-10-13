/**
 * Utilidades de logging. Registra mensajes sin exponer datos sensibles
 * (nunca contraseñas, hashes ni tokens).
 */
export const logger = {
  info(mensaje: string): void {
    console.log(`[info] ${mensaje}`);
  },
  warn(mensaje: string): void {
    console.warn(`[warn] ${mensaje}`);
  },
  error(mensaje: string): void {
    console.error(`[error] ${mensaje}`);
  },
};
