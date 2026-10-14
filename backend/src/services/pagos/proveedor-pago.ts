import { env } from '../../config/env.js';

/** Resultado del proveedor externo; `referencia` identifica la transacción. */
export interface ResultadoPago {
  aprobado: boolean;
  referencia: string | null;
  mensaje?: string;
}

export interface DatosPago {
  numero: string;
  monto: string;
  idempotencia: string;
}

/** Contrato entre la lógica de pedidos y el servicio de pago externo. */
export interface ProveedorPago {
  procesarPago(datos: DatosPago): Promise<ResultadoPago>;
}

let correlativo = 0;

/**
 * Proveedor simulado para desarrollo y demo: aprueba siempre, salvo el modo
 * de prueba de fallo (`PAYMENT_SANDBOX_MODO=fallo`). Nunca ve datos de tarjeta.
 */
export class ProveedorPagoSandbox implements ProveedorPago {
  private readonly modoFallo: boolean;

  constructor(modoFallo = false) {
    this.modoFallo = modoFallo;
  }

  async procesarPago(): Promise<ResultadoPago> {
    if (this.modoFallo) {
      return {
        aprobado: false,
        referencia: null,
        mensaje: 'Pago rechazado por el proveedor de prueba',
      };
    }
    correlativo += 1;
    const referencia = `sbx-${String(correlativo).padStart(6, '0')}`;
    return { aprobado: true, referencia };
  }
}

/** Devuelve el proveedor activo según la configuración del entorno. */
export function obtenerProveedorPago(): ProveedorPago {
  // Mientras no exista un proveedor real configurado, se opera con sandbox.
  return new ProveedorPagoSandbox(env.paymentSandboxModo === 'fallo');
}
