import type { PayloadSesion } from './utils/jwt.js';

declare global {
  namespace Express {
    interface Request {
      /** Identidad adjuntada por el middleware `autenticar`. */
      usuario?: PayloadSesion;
    }
  }
}

export {};
