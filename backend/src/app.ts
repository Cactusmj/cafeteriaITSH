import cors from 'cors';
import express, { type Express } from 'express';
import { authRoutes } from './routes/auth.routes.js';
import { cajaRoutes } from './routes/caja.routes.js';
import { cocinaRoutes } from './routes/cocina.routes.js';
import { menuAdminRoutes, menuPublicoRoutes } from './routes/menu.routes.js';
import { mostradorRoutes } from './routes/mostrador.routes.js';
import { pedidosRoutes } from './routes/pedidos.routes.js';
import { platillosRoutes } from './routes/platillos.routes.js';
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
  app.use('/api/admin/platillos', platillosRoutes);
  app.use('/api/admin/menu', menuAdminRoutes);
  app.use('/api/menu', menuPublicoRoutes);
  app.use('/api/pedidos', pedidosRoutes);
  app.use('/api/pedidos', mostradorRoutes);
  app.use('/api/cocina', cocinaRoutes);
  app.use('/api/caja', cajaRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: { codigo: 'NO_ENCONTRADO', mensaje: 'Ruta no encontrada' } });
  });

  app.use(manejadorErrores);

  return app;
}
