import cors from 'cors';
import express, { type Express } from 'express';
import { authRoutes } from './routes/auth.routes.js';
import { usuariosRoutes } from './routes/usuarios.routes.js';
import { manejadorErrores } from './utils/errores.js';

/** Construye la aplicación Express (sin levantar el servidor). */
export function crearApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/salud', (_req, res) => {
    res.status(200).json({ estado: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/admin/usuarios', usuariosRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: { codigo: 'NO_ENCONTRADO', mensaje: 'Ruta no encontrada' } });
  });

  app.use(manejadorErrores);

  return app;
}
