import 'dotenv/config';

/**
 * Carga y expone la configuración del entorno.
 * Los valores reales viven en backend/.env (nunca en el repositorio).
 */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? 'secreto-de-desarrollo-cambiar',
  expiracionToken: process.env.JWT_EXPIRATION ?? '8h',
  paymentProvider: process.env.PAYMENT_PROVIDER ?? 'sandbox',
  paymentApiKey: process.env.PAYMENT_API_KEY ?? '',
  paymentSandboxModo: process.env.PAYMENT_SANDBOX_MODO ?? 'exito',
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? '',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'cafeteria_itsh',
  },
};

export const esProduccion = env.nodeEnv === 'production';
