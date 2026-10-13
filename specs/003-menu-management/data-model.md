# Phase 1 — Data Model: Sprint 2 — Gestión de menú y consulta de menú

Entidades del sprint, mapeadas a las tablas ya creadas por
`migrations/001_crear_esquema_mysql.sql`. Este sprint **no** modifica el
esquema; documenta las entidades que implementa y sus reglas.

## Entidad: Platillo (`platillo`)

Producto del catálogo de la cafetería.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `nombre` | VARCHAR(100) | NOT NULL |
| `categoria` | VARCHAR(50) | NULL; una de la lista fija (R5 de research: `comidas`, `bebidas`, `postres`, `complementos`) |
| `descripcion` | TEXT | NULL |
| `activo` | BOOLEAN | NOT NULL, DEFAULT TRUE (baja lógica; nunca se borra físicamente) |
| `creado_en` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `actualizado_en` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP (trigger `trg_platillo_actualizado`) |

**Reglas de validación** (spec FR-001, FR-008, FR-012):
- `nombre`: obligatorio, 1–100 caracteres, no vacío tras recortar espacios.
- `categoria`: obligatoria, una de la lista fija.
- `descripcion`: opcional, ≤ 500 caracteres.
- `activo`: por defecto `true`; al desactivar, el platillo sale del catálogo
  activo y no puede agregarse al menú.
- No se valida unicidad de nombre a nivel de base; el servicio rechaza nombres
  duplicados activos con `409 NOMBRE_EN_USO` para evitar ambigüedad (edge
  case de la spec).

## Entidad: Menú del día (`menu_dia`)

Registro de un platillo ofrecido en una fecha concreta.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `fecha` | DATE | NOT NULL |
| `platillo_id` | INT | NOT NULL, FOREIGN KEY → `platillo(id)` |
| `precio` | DECIMAL(10,2) | NOT NULL; la app exige `> 0` (el CHECK de BD admite `>= 0`, R2 de research) |
| `disponible` | BOOLEAN | NOT NULL, DEFAULT TRUE |
| `especial` | BOOLEAN | NOT NULL, DEFAULT FALSE |
| restricción | — | `uq_menu_fecha_platillo UNIQUE (fecha, platillo_id)` impide duplicados |

**Reglas de negocio** (spec FR-002, FR-003, FR-005, FR-009, FR-010, FR-011):
- El mismo platillo puede existir en menús de distintas fechas con precio,
  disponibilidad y especial propios (FR-009).
- El mismo platillo no puede repetirse en la misma fecha (restricción única +
  validación de servicio con mensaje claro, FR-010).
- `precio`: obligatorio, numérico, > 0, ≤ 2 decimales.
- **Disponibilidad efectiva** (FR-005): para el cliente, un platillo del menú
  está disponible solo si `menu_dia.disponible = TRUE` **y**
  `platillo.activo = TRUE`; la consulta pública calcula y expone este valor.
- El mismo platillo no puede agregarse al menú si está inactivo (FR-012).

## Relaciones

- `menu_dia.platillo_id` → `platillo.id` (muchos a uno). Un platillo puede
  estar en muchos menús de días distintos.
- `pedido_detalle.menu_dia_id` → `menu_dia.id` (tabla del sprint 3). Mientras
  no existan pedidos, la entrada del menú puede eliminarse; si está
  referenciada, `DELETE` responde `409` (R7 de research).

## Consulta pública del menú (vista, no tabla)

La respuesta de `GET /api/menu` combina ambas tablas:

| Campo expuesto | Origen |
|---|---|
| `id` (entrada del menú) | `menu_dia.id` |
| `platillo` (nombre) | `platillo.nombre` |
| `categoria` | `platillo.categoria` |
| `descripcion` | `platillo.descripcion` |
| `precio` | `menu_dia.precio` |
| `disponible` | `menu_dia.disponible AND platillo.activo` |
| `especial` | `menu_dia.especial` |

Orden de presentación: categoría, luego especial primero, luego nombre.

## Estados y transiciones

No aplica en este sprint (los estados de pedido son del sprint 3). Las
banderas `activo`, `disponible` y `especial` son binarias y se editan con
`PUT`/`PATCH` sin máquina de estados.

## Entidades por historia

| Historia | Entidades que usa |
|---|---|
| US2 (Gestión de platillos y menú del día) | Platillo, Menú del día |
| US3 (Consulta del menú del día) | Menú del día, Platillo (lectura) |

## Fuera de alcance del modelo (otros sprints)

`pedido`, `pedido_detalle`, `estado_pedido`, `transicion_estado`,
`pedido_estado_historial`, `pago` y `notificacion` existen en el esquema pero
se implementan en los sprints 3–5.
