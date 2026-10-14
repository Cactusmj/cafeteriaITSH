# Contrato de API — Mostrador y caja (US1 captura/cobro, US3 entrega/cancelación)

Formato de error común: `{ "error": { "codigo": "string", "mensaje": "..." } }`.
Todos los endpoints exigen sesión; la creación, el cobro, la entrega y la
cancelación son solo rol cajero (`401` sin token, `403` otro rol).

## POST `/api/pedidos/mostrador`

Crea un pedido de mostrador en "Pendiente".

**Cuerpo**:

```json
{
  "cliente_nombre": "Marta (opcional)",
  "clave_idempotencia": "uuid-v4",
  "items": [{ "menu_dia_id": 12, "cantidad": 2 }]
}
```

Reglas: `items` 1–20 líneas sin repetidos, `cantidad` 1–20,
`cliente_nombre` opcional ≤ 100. El total lo recalcula el servidor; sin
horario (recogida inmediata).

**Respuestas**: `201` pedido creado (mismo cuerpo que sprint 3, `tipo`:
`"mostrador"`, `estado`: `"Pendiente"`); `200` con la misma `clave_idempotencia`
(mismo pedido); `400 VALIDACION`; `404 MENU_DIA_NO_ENCONTRADO`; `409
PLATILLO_NO_DISPONIBLE`.

## POST `/api/pedidos/{id}/cobro`

Registra el cobro en efectivo. Solo pedidos de mostrador en "Pendiente" del
mismo turno (cualquier cajero).

**Cuerpo**: `{ "monto_recibido": "100.00" }` (numérico ≥ 0, ≤ 2 decimales).

**Respuesta 200**:

```json
{
  "id": 9,
  "numero": "PED-3F8K2QZA",
  "estado": "Pagado",
  "total": "70.00",
  "monto_recibido": "100.00",
  "cambio": "30.00",
  "pago": { "metodo": "efectivo", "monto": "70.00", "referencia": "efectivo-PED-3F8K2QZA" }
}
```

**Otras**: `402 COBRO_INSUFICIENTE` (monto menor que el total; sigue
"Pendiente"); `404 PEDIDO_NO_ENCONTRADO`; `409 ESTADO_INVALIDO` (no es
mostrador "Pendiente"; ya "Pagado" → `200` idempotente con el cobro
registrado); `403` no cajero o no dueño (anticipados los cobra su flujo).

## PATCH `/api/pedidos/{id}/estado`

Avanza o cierra el pedido según la matriz de roles.

**Cuerpo**: `{ "estado": "En preparación" | "Listo" | "Entregado" | "Cancelado" }`

| Destino | Quién | Origen válido |
|---|---|---|
| `En preparación` | cocinero | `Pagado` |
| `Listo` | cocinero | `En preparación` |
| `Entregado` | cajero | `Listo` |
| `Cancelado` | cajero | `Pendiente`, `Pagado`, `En preparación`, `Listo` |

**Respuestas**: `200` pedido actualizado (id, numero, estado anterior y nuevo);
`400 VALIDACION` (destino desconocido); `403` rol sin permiso para ese
destino; `404 PEDIDO_NO_ENCONTRADO`; `409 ESTADO_INVALIDO` (transición no
permitida por la tabla o pedido "Entregado"/"Cancelado").

## GET `/api/caja/pendientes`

Solo cajero. Lista "Listo" (ambos orígenes) + mostrador
"Pendiente"/"Pagado", ordenados por `creado_en`: `id`, `numero`, `tipo`,
`estado`, `total`, `cliente_nombre`, `lineas` (conteo). `200` siempre (lista
vacía si no hay).
