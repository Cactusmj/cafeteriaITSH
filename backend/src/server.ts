import { crearApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { logger } from './utils/logger.js';

async function iniciar(): Promise<void> {
  const app = crearApp();

  try {
    const conexion = await pool.getConnection();
    conexion.release();
    logger.info('Conexión a MySQL establecida');
  } catch (error) {
    logger.error(
      `No se pudo conectar a MySQL: ${error instanceof Error ? error.message : 'desconocido'}`,
    );
  }

  app.listen(env.port, () => {
    logger.info(`Servidor escuchando en http://localhost:${env.port}`);
  });
}

iniciar().catch((error: unknown) => {
  logger.error(`Fallo al iniciar el servidor: ${error instanceof Error ? error.message : 'desconocido'}`);
  process.exit(1);
});
