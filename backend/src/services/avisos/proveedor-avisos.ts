import { env } from '../../config/env.js';

/** Resultado del intento de envío externo (oportunista, nunca bloquea). */
export interface ResultadoEnvio {
  enviado: boolean;
  detalle?: string;
}

export interface DatosEnvio {
  pedidoId: number;
  usuarioId: number;
  numero: string;
}

/** Contrato entre el módulo de avisos y el servicio externo de notificaciones. */
export interface ProveedorAvisos {
  enviarAviso(datos: DatosEnvio): Promise<ResultadoEnvio>;
}

/** Sin proveedor externo: solo existe el aviso en-app. */
export class ProveedorNinguno implements ProveedorAvisos {
  async enviarAviso(): Promise<ResultadoEnvio> {
    return { enviado: false, detalle: 'sin proveedor externo configurado' };
  }
}

/** Devuelve el proveedor activo según la configuración del entorno. */
export function obtenerProveedorAvisos(): ProveedorAvisos {
  if (env.notificationProvider === 'ninguno' || !env.notificationApiKey) {
    return new ProveedorNinguno();
  }
  // Futuro proveedor real: implementarlo aquí sin tocar la lógica de avisos.
  return new ProveedorNinguno();
}
