# Contrato — Proveedor de pago externo (integración del sprint 3)

Define la abstracción interna del backend entre la lógica de pedidos y el
servicio de pago externo, y el comportamiento del proveedor por defecto.

## Principios

- El sistema **nunca** recibe, transmite ni almacena datos de tarjeta; el
  cliente solo interactúa con el proveedor (constitución, Principio III).
- La lógica de pedidos depende de la interfaz `ProveedorPago`, no de un
  proveedor concreto; cambiar de proveedor no toca `pedidos.service`.
- La configuración vive en variables de entorno (nunca en el repositorio):

| Variable | Uso | Default en desarrollo |
|---|---|---|
| `PAYMENT_PROVIDER` | Proveedor activo: `sandbox` (único implementado) | `sandbox` |
| `PAYMENT_API_KEY` | Llave del proveedor real (futura) | vacío |

## Interfaz interna (backend)

```ts
interface ResultadoPago {
  aprobado: boolean;
  referencia: string | null;   // id de la transacción en el proveedor
  mensaje?: string;            // claro, para el usuario (solo si no aprueba)
}

interface ProveedorPago {
  procesarPago(datos: {
    numero: string;            // folio del pedido
    monto: string;             // total con 2 decimales
    idempotencia: string;      // clave del pedido, evita cobro doble
  }): Promise<ResultadoPago>;
}
```

## Proveedor `sandbox` (implementado en este sprint)

Simula un proveedor externo para desarrollo y demo:

| Situación | Comportamiento |
|---|---|
| Uso normal | Aprueba siempre; `referencia` = `sbx-` + correlativo (`sbx-000001`, …) |
| Modo de prueba de fallo (para escenarios de QA: por ejemplo monto con centavos `13` o una constante de prueba en el servicio) | Devuelve `aprobado: false` con mensaje "Pago rechazado por el proveedor de prueba" |
| Fallo inesperado de la abstracción | El servicio responde `500 ERROR_INTERNO`; el pedido sigue `Pendiente` |

## Flujo en `POST /api/pedidos/{id}/pago`

```text
cliente → backend: POST /pago
backend → pedidos.service:
  1. valida dueño y estado Pendiente (o ya Pagado → 200 idempotente)
  2. proveedor.procesarPago({ numero, monto, idempotencia })
     ├─ aprobado → INSERT pago + transición Pendiente→Pagado + historial → 200
     └─ rechazado → 402 PAGO_RECHAZADO (pedido sigue Pendiente)
```

## Futuro proveedor real

Para integrar un proveedor real bastará:

1. Implementar otra clase `ProveedorPago` que llame a su API usando
   `PAYMENT_API_KEY` (sin exponerla en respuestas ni logs).
2. Agregar `PAYMENT_PROVIDER=<nombre>` en `.env` de producción.
3. Ampliar las pruebas con su modo sandbox/documentación oficial.

La tabla `pago` y los endpoints no cambian: solo se sustituye la implementación
de la interfaz.

## Seguridad

- `PAYMENT_API_KEY` y `PAYMENT_PROVIDER` solo viven en `.env` (gitignored) y
  en `.env.example` como plantilla sin valores reales.
- Las respuestas de error al cliente usan el formato común
  `{ "error": { "codigo", "mensaje" } }`; el detalle del proveedor se registra
  en el log del servidor, nunca se expone.
