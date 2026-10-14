# Contrato de API — Pedidos anticipados (US1 creación, US2 pago)

Grupo único bajo `/api/pedidos`. La creación y el pago exigen sesión de
cliente; el detalle admite al dueño o al administrador. Formato de error común
idéntico a los sprints anteriores:

```json
{ "error": { "codigo": "string", "mensaje": "texto claro sin detalles internos" } }
```

## Autenticación

- `POST /api/pedidos` y `POST /api/pedidos/{id}/pago`: `autenticar` +
  `autorizarRol('usuario')`. `401` sin token; `403` con rol administrador,
  cajero o cocinero.
- `GET /api/pedidos/{id}`: `autenticar`; permitido al dueño del pedido o a un
  administrador; cualquier otro usuario `403`.

## POST `/api/pedidos`

Crea un pedido anticipado en estado `Pendiente` con su detalle y folio.

**Cuerpo**:

```json
{
  "fecha_recoleccion": "2026-11-10T13:45",
  "clave_idempotencia": "8f14e45f-ea8f-4a1b-9c2d-3e4f5a6b7c8d",
  "items": [
    { "menu_dia_id": 10, "cantidad": 2 },
    { "menu_dia_id": 14, "cantidad": 1 }
  ]
}
```

| Campo | Reglas |
|---|---|
| `fecha_recoleccion` | Obligatorio; ISO local sin zona (`YYYY-MM-DDTHH:mm`); ≥ `ahora + 10 minutos` (reloj del servidor); mismo día |
| `clave_idempotencia` | Obligatorio; UUID v4; al reenviar la misma clave se devuelve el pedido existente |
| `items` | Obligatorio; 1 a 20 líneas; sin `menu_dia_id` repetidos |
| `items[].menu_dia_id` | Obligatorio; debe existir en el menú de hoy y estar disponible |
| `items[].cantidad` | Obligatorio; entero de 1 a 20 |

El total NO se envía: el servidor lo recalcula con los precios vigentes.

**Respuesta 201** (pedido creado):

```json
{
  "id": 3,
  "numero": "PED-7K2M9QX4",
  "tipo": "anticipado",
  "estado": "Pendiente",
  "fecha_recoleccion": "2026-11-10T13:45:00",
  "total": "95.00",
  "creado_en": "2026-11-10T12:30:11",
  "detalle": [
    {
      "menu_dia_id": 10,
      "platillo": "Enchiladas verdes",
      "cantidad": 2,
      "precio_unitario": "35.00",
      "subtotal": "70.00"
    },
    {
      "menu_dia_id": 14,
      "platillo": "Agua de horchata",
      "cantidad": 1,
      "precio_unitario": "25.00",
      "subtotal": "25.00"
    }
  ],
  "pago": null
}
```

**Respuesta 200**: reintento con la misma `clave_idempotencia`; devuelve el
pedido ya existente con el mismo cuerpo (idempotencia, FR-010).

**Otras respuestas**:

| Código | Descripción |
|---|---|
| 400 | `VALIDACION`: datos mal formados, carrito vacío, cantidad fuera de rango, horario mal formado o pasado |
| 400 | `ANTICIPACION_INSUFICIENTE`: menos de 10 minutos entre ahora y `fecha_recoleccion` |
| 401 | Sin sesión |
| 403 | Rol distinto de cliente |
| 404 | `MENU_DIA_NO_ENCONTRADO`: un `menu_dia_id` no existe en el menú de hoy |
| 409 | `PLATILLO_NO_DISPONIBLE`: alguna entrada está no disponible o su platillo está inactivo |

## GET `/api/pedidos/{id}`

Detalle del pedido (confirmación y seguimiento básico).

**Respuesta 200**: mismo cuerpo de la respuesta de creación; `pago` es `null`
si aún no hay pago aprobado.

| Código | Descripción |
|---|---|
| 401 | Sin sesión |
| 403 | Usuario que no es el dueño ni administrador |
| 404 | `PEDIDO_NO_ENCONTRADO` |

## POST `/api/pedidos/{id}/pago`

Confirma el pago en línea del pedido. El cuerpo puede ser `{}` (sin campos).

**Comportamiento**:
1. El pedido debe existir y pertenecer al dueño (token).
2. Si el pedido ya está `Pagado`, responde `200` con la misma confirmación
   (idempotente; no duplica el cobro).
3. Si el pedido no está `Pendiente` (por ejemplo `Cancelado`), responde `409
   ESTADO_INVALIDO`.
4. El servidor llama al proveedor de pago (ver `proveedor-pago.md`):
   - **Aprobado**: se inserta `pago` (`metodo: "online"`, `monto` = total,
     `referencia` del proveedor), el pedido pasa a `Pagado` (transición
     validada) y se registra el historial.
   - **Rechazado**: responde `402 PAGO_RECHAZADO`; el pedido permanece
     `Pendiente`; el cliente puede reintentar.

**Respuesta 200** (pago confirmado o ya confirmado):

```json
{
  "id": 3,
  "numero": "PED-7K2M9QX4",
  "estado": "Pagado",
  "total": "95.00",
  "fecha_recoleccion": "2026-11-10T13:45:00",
  "pago": {
    "metodo": "online",
    "monto": "95.00",
    "referencia": "sbx-000123",
    "fecha": "2026-11-10T12:31:02"
  }
}
```

**Otras respuestas**:

| Código | Descripción |
|---|---|
| 401 | Sin sesión |
| 403 | No es el dueño |
| 404 | `PEDIDO_NO_ENCONTRADO` |
| 402 | `PAGO_RECHAZADO`: el proveedor no aprobó la transacción; el pedido sigue `Pendiente` |
| 409 | `ESTADO_INVALIDO`: el pedido no está en `Pendiente` (y no está ya `Pagado`) |
| 500 | `ERROR_INTERNO`: fallo del proveedor no manejado (reintentable) |

## Códigos HTTP usados

`200` consulta/pago confirmado, `201` creación, `402` pago rechazado,
`400` validación, `401` sin autenticar, `403` sin permiso, `404` no
encontrado, `409` conflicto (no disponible, estado inválido), `500` error
interno.
