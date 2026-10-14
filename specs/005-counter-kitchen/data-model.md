# Phase 1 — Data Model: Sprint 4 — Mostrador (cajero) y cocina

Entidades del sprint sobre las tablas creadas en `migrations/001` y sembradas
en `002`. **Sin cambios de esquema.**

## Pedido de mostrador (`pedido`, tipo = 'mostrador')

| Campo | Uso en mostrador |
|---|---|
| `numero` | Folio `PED-…` (igual que anticipados) |
| `tipo` | `'mostrador'` |
| `estado_id` | Nace `Pendiente`; `Pagado` al cobrarse |
| `usuario_id` | NULL (el cliente es presencial) |
| `cliente_nombre` | VARCHAR(100), opcional; identifica la entrega |
| `fecha_recoleccion` | NULL (recogida inmediata) |
| `total` | Recalculado por el servidor con precios vigentes |
| `creado_por` | Id del cajero que captura |
| `clave_idempotencia` | UUID del punto de venta (igual que sprint 3) |

**Reglas** (FR-001, FR-002, FR-004, FR-005, FR-015): disponibilidad efectiva y
total recalculado como en anticipados; sin regla de 10 minutos; sin cobro no
avanza.

## Cobro en efectivo (`pago`, método = 'efectivo')

| Campo | Uso |
|---|---|
| `pedido_id` | UNIQUE: un solo cobro confirmado por pedido |
| `metodo` | `'efectivo'` |
| `monto` | Igual al total |
| `referencia` | `efectivo-{folio}` (trazabilidad sin columnas nuevas) |
| `registrado_por` | Id del cajero |

El `monto_recibido` viaja solo en la petición; el `cambio` se calcula y
devuelve (`recibido − total`, 2 decimales). Monto insuficiente → `402`
(`COBRO_INSUFICIENTE`) sin cambios.

## Transiciones usadas (`transicion_estado`, sembrada)

```text
Pendiente --(cobro cajero)--> Pagado --(cocinero)--> En preparación --(cocinero)--> Listo --(cajero)--> Entregado
   │                              │                        │                              │
   └──────── (cajero) Cancelado ◄──┴────────────────────────┴──────────────────────────────┘
```

Matriz de roles (además de la tabla):

| Destino | Roles permitidos |
|---|---|
| `Pagado` (vía cobro) | cajero |
| `En preparación`, `Listo` | cocinero |
| `Entregado`, `Cancelado` | cajero |

Todo cambio registra `pedido_estado_historial` con `cambiado_por`.

## Tablero de cocina (vista: `GET /api/cocina/pedidos`)

Pedidos en "Pagado", "En preparación" y "Listo", ordenados por `creado_en`:

| Campo expuesto | Origen |
|---|---|
| `id`, `numero`, `tipo`, `estado` | `pedido` + `estado_pedido` |
| `cliente_nombre` (o "Mostrador") | `pedido` / dueño (anticipado) |
| `minutos_en_espera` | calculado (`ahora − creado_en`) |
| `detalle[]` (`platillo`, `cantidad`) | `pedido_detalle` + `platillo` |
| `total`, `creado_en` | `pedido` |

## Pendientes de caja (vista: `GET /api/caja/pendientes`)

Pedidos "Listo" (ambos orígenes) + mostrador "Pendiente"/"Pagado": `id`,
`numero`, `tipo`, `estado`, `total`, `cliente_nombre`, conteo de líneas.

## Entidades por historia

| Historia | Entidades que usa |
|---|---|
| US1 (Mostrador y cobro) | Pedido (mostrador), Detalle, Pago (efectivo), Historial |
| US2 (Cocina) | Pedido (lectura ambos orígenes), Transición, Historial, Tablero |
| US3 (Entrega y cancelación) | Transición (Entregado/Cancelado), Historial |

## Fuera de alcance del modelo

`notificacion` (sprint 5). Sin columnas ni tablas nuevas.
