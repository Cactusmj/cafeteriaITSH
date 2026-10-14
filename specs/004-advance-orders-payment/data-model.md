# Phase 1 — Data Model: Sprint 3 — Pedido anticipado y pago

Entidades del sprint, mapeadas a las tablas creadas por
`migrations/001_crear_esquema_mysql.sql` y sembradas por
`migrations/002_seed_inicial_mysql.sql`. Este sprint añade una única migración
adicional (`003_clave_idempotencia_pedido.sql`); no se crean tablas nuevas.

## Entidad: Pedido (`pedido`)

Solicitud anticipada de un cliente (en este sprint solo tipo `anticipado`; el
tipo `mostrador` es del sprint 4).

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `numero` | VARCHAR(20) | NOT NULL, UNIQUE; folio `PED-` + 8 caracteres (R2 de research) |
| `tipo` | VARCHAR(20) | NOT NULL; CHECK `('anticipado', 'mostrador')`; este sprint solo escribe `'anticipado'` |
| `estado_id` | INT | NOT NULL, FOREIGN KEY → `estado_pedido(id)`; nace en `Pendiente` |
| `usuario_id` | INT | NOT NULL para anticipado (CHECK `chk_pedido_anticipado`), FOREIGN KEY → `usuario(id)`; el dueño del pedido |
| `cliente_nombre` | VARCHAR(100) | NULL; no se usa en anticipado (el dueño es `usuario_id`) |
| `fecha_recoleccion` | DATETIME | NOT NULL para anticipado; ≥ `NOW() + 10 minutos` (R3) |
| `total` | DECIMAL(10,2) | NOT NULL, DEFAULT 0; recalculado por el servidor (R4) |
| `creado_por` | INT | NULL, FOREIGN KEY → `usuario(id)`; en anticipado coincide con `usuario_id` |
| `creado_en` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `actualizado_en` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP (trigger existente) |
| `clave_idempotencia` | VARCHAR(36) | **Nuevo (migración 003)**: NULL, UNIQUE; UUID generado por el cliente (R8) |

**Reglas de negocio** (spec FR-003, FR-008, FR-009, FR-010, FR-011):
- Solo el rol cliente puede crear anticipados; el servidor exige dueño.
- `fecha_recoleccion` debe ser al menos 10 minutos posterior a la confirmación
  (reloj del servidor) y no puede estar en el pasado; error
  `ANTICIPACION_INSUFICIENTE`.
- El `total` se recalcula en el servidor con los precios vigentes del menú de
  hoy; el total enviado por el cliente se ignora.
- Folio único; ante colisión se reintenta el alta hasta 3 veces.
- `clave_idempotencia` repetida devuelve el pedido existente (`200`) sin crear
  otro.

## Entidad: Detalle de pedido (`pedido_detalle`)

Líneas del pedido; cada una fija el precio al momento de confirmar.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `pedido_id` | INT | NOT NULL, FOREIGN KEY → `pedido(id)` ON DELETE CASCADE |
| `menu_dia_id` | INT | NOT NULL, FOREIGN KEY → `menu_dia(id)`; referencia la entrada del menú de hoy |
| `cantidad` | INT | NOT NULL, CHECK `> 0`; el servidor valida un máximo razonable (≤ 20 por línea) |
| `precio_unitario` | DECIMAL(10,2) | NOT NULL; copia del `menu_dia.precio` vigente al confirmar (FR-011) |
| `subtotal` | DECIMAL(10,2) | NOT NULL; `precio_unitario × cantidad` calculado por el servidor |

**Reglas** (spec FR-001, FR-002, FR-004):
- Cada `menu_dia_id` debe existir, pertenecer al menú de hoy y estar
  disponible (`menu_dia.disponible AND platillo.activo`); si no,
  `409 PLATILLO_NO_DISPONIBLE`.
- No se admiten líneas repetidas del mismo `menu_dia_id` (el cliente debe
  sumar cantidades) ni cantidades fuera del rango.
- El detalle nunca se edita tras la creación (los cambios de precio del menú
  no alteran pedidos existentes).

## Entidad: Pago (`pago`)

Transacción del pedido; como máximo una fila aprobada por pedido.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `pedido_id` | INT | NOT NULL, UNIQUE, FOREIGN KEY → `pedido(id)`; garantiza un solo pago por pedido |
| `metodo` | VARCHAR(20) | CHECK `('online', 'efectivo')`; este sprint solo `'online'` |
| `monto` | DECIMAL(10,2) | NOT NULL, CHECK `> 0`; igual al `total` del pedido |
| `referencia` | VARCHAR(100) | Identificador de la transacción en el proveedor (R6 de research) |
| `registrado_por` | INT | NULL, FOREIGN KEY → `usuario(id)`; el dueño que pagó |
| `fecha` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

**Reglas** (spec FR-005, FR-006, FR-007):
- Solo se inserta cuando el proveedor aprueba; si el proveedor rechaza, no
  hay fila ni cambio de estado (`402 PAGO_RECHAZADO`).
- Nunca se almacenan datos de tarjeta; `referencia` es el único vínculo con el
  proveedor.
- Pagos fallidos/reintentos no crean filas adicionales (la fila nace solo con
  aprobación).

## Entidad: Estado del pedido (`estado_pedido`) y transiciones (`transicion_estado`)

Ya sembradas en `002_seed_inicial_mysql.sql`; este sprint solo las consulta.

| Estado | Orden |
|---|---|
| `Pendiente` | 1 |
| `Pagado` | 2 |
| `En preparación` | 3 |
| `Listo` | 4 |
| `Entregado` | 5 |
| `Cancelado` | 0 |

Transiciones usadas en este sprint: `Pendiente → Pagado` (pago confirmado). El
resto (`En preparación`, `Listo`, `Entregado`, `Cancelado`) es del sprint 4.

```text
Pendiente --(pago aprobado)--> Pagado --(cocina, sprint 4)--> ...
```

## Entidad: Historial de estados (`pedido_estado_historial`)

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `pedido_id` | INT | NOT NULL, FOREIGN KEY → `pedido(id)` ON DELETE CASCADE |
| `estado_anterior_id` | INT | NULL (nulo en el nacimiento del pedido), FK → `estado_pedido(id)` |
| `estado_nuevo_id` | INT | NOT NULL, FK → `estado_pedido(id)` |
| `cambiado_por` | INT | NULL, FK → `usuario(id)` |
| `fecha` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

**Regla** (spec FR-014): cada alta de pedido registra `NULL → Pendiente` y
cada pago confirmado registra `Pendiente → Pagado`, con `cambiado_por` =
dueño.

## Relaciones

- `pedido.usuario_id` → `usuario.id` (muchos a uno): el dueño (cliente).
- `pedido.estado_id` → `estado_pedido.id` (muchos a uno).
- `pedido_detalle.pedido_id` → `pedido.id` (uno a muchos).
- `pedido_detalle.menu_dia_id` → `menu_dia.id` (muchos a uno): congela la
  entrada del menú usada.
- `pago.pedido_id` → `pedido.id` (uno a uno, por la restricción UNIQUE).
- `pedido_estado_historial.pedido_id` → `pedido.id` (uno a muchos).

## Consulta de confirmación (vista, no tabla)

La respuesta de `GET /api/pedidos/{id}` combina pedido + detalle + pago:

| Campo expuesto | Origen |
|---|---|
| `id`, `numero`, `tipo` | `pedido` |
| `estado` | `estado_pedido.nombre` |
| `fecha_recoleccion`, `total`, `creado_en` | `pedido` |
| `detalle[]` (`menu_dia_id`, `platillo`, `cantidad`, `precio_unitario`, `subtotal`) | `pedido_detalle` + `platillo` |
| `pago` (`metodo`, `monto`, `referencia`, `fecha`) o `null` | `pago` |

## Entidades por historia

| Historia | Entidades que usa |
|---|---|
| US1 (Crear el pedido anticipado) | Pedido, Detalle de pedido, Menú del día (lectura), Historial |
| US2 (Pagar el pedido) | Pedido, Pago, Estado, Transición, Historial |

## Fuera de alcance del modelo (otros sprints)

- `pedido.tipo = 'mostrador'` y cobros en efectivo del cajero (sprint 4).
- Transiciones `En preparación` → `Listo` → `Entregado` y `Cancelado`
  (sprint 4).
- La entidad `notificacion` existe en el esquema pero se implementa en el
  sprint 5.
