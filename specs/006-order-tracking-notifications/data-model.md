# Phase 1 — Data Model: Sprint 5 — Seguimiento, notificaciones y pulido

Entidades sobre el esquema existente. Única migración aditiva (`004`).

## Aviso (`notificacion`, con migración 004)

| Campo | Uso |
|---|---|
| `pedido_id` | FK → `pedido(id)` ON DELETE CASCADE |
| `tipo` | `'pedido_listo'` (este sprint; columna libre para futuros tipos) |
| `canal` | `'app'` en-app; `correo`/`push`/`sms` si hay proveedor (CHECK ampliado) |
| `estado_envio` | `'enviada'` = pendiente de ver (visible); `'vista'` = consultado; `'fallida'` = externo fallido (CHECK ampliado) |
| `fecha` | Creación del aviso |
| `detalle_error` | Error del proveedor externo, si aplica |

**Migración `004_avisos_app.sql`** (aditiva, aplicar una sola vez después de
`001`–`003`):

```sql
USE cafeteria_itsh;
ALTER TABLE notificacion DROP CHECK chk_notificacion_canal;
ALTER TABLE notificacion ADD CONSTRAINT chk_notificacion_canal
  CHECK (canal IN ('correo', 'push', 'sms', 'app'));
ALTER TABLE notificacion DROP CHECK chk_notificacion_estado;
ALTER TABLE notificacion ADD CONSTRAINT chk_notificacion_estado
  CHECK (estado_envio IN ('pendiente', 'enviada', 'vista', 'fallida'));
```

**Reglas** (FR-005 a FR-009): un aviso por paso a "Listo" con dueño (uno por
pedido en la práctica: el paso ocurre una vez); sin dueño no hay fila; el
externo nunca bloquea lo en-app.

## Seguimiento (vistas, sin tablas)

- `GET /api/mis-pedidos` ← `pedido` + `estado_pedido` del dueño, orden
  descendente: `id`, `numero`, `estado`, `total`, `fecha_recoleccion`,
  `creado_en`, `lineas` (conteo).
- Detalle ← `GET /api/pedidos/{id}` existente.
- `GET /api/avisos` ← `notificacion` + `pedido.numero` del dueño: `id`,
  `pedido_id`, `numero`, `tipo`, `canal`, `estado_envio`, `fecha`; pendientes
  (`enviada`) primero.

## Entidades por historia

| Historia | Entidades que usa |
|---|---|
| US1 (Mis pedidos) | Pedido (lectura propia), Detalle (lectura) |
| US2 (Aviso de listo) | Aviso, Pedido (disparo en transición), Historial |

## Fuera de alcance

Paginación, tipos de aviso futuros, proveedor externo real (solo interfaz +
`Ninguno`), rediseño UI completo.
