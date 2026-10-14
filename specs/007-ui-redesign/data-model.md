# Phase 1 — Data Model: Rediseño UI del sistema

Sin cambios de datos. No hay migraciones ni endpoints nuevos. Entidades de
presentación sobre el esquema existente (sprints 1–5).

## Sistema de diseño (tokens, sin tabla)

| Grupo | Tokens (de `design/DESIGN.md`) |
|---|---|
| Superficies | `surface #F6F1E9`, contenedores `surface-container*`, `surface-bright`, blanco tarjetas |
| Texto | `on-surface #1C1917`, `on-surface-variant #44403C`, `outline #78716C` |
| Acciones | `primary #1E7A46` / `on-primary #FFFFFF`, `secondary #8A6A4F`, `tertiary #6B3F23`, `error #B91C1C` |
| Estados de pedido | `status-pending #9A3412`, `status-paid #1E7A46`, `status-preparing #B45309`, `status-ready #0369A1`, `status-delivered #166534`, `status-cancelled #B91C1C` (texto blanco) |
| Tipografía | Títulos/cifras/totales Plus Jakarta Sans 700/800; cuerpo Inter 400/500/600 |
| Forma/espaciado | Ritmo 8px; radios 8px (12–16px tarjetas/modales, pill badges); botones 44–48px; filas operativas ≥56px; táctil mínimo 44px |

## Navegación por rol (vistas, sin tablas)

| Rol | Drawer | Bottom bar (móvil) | Contador |
|---|---|---|---|
| Cliente | Menú, Mis pedidos, Cerrar sesión | Menú, Mis pedidos | Avisos `enviada` (sondeo `GET /api/avisos`) |
| Cajero | Inicio(caja), Capturar pedido, Pedidos listos, Cerrar sesión | Caja, Entregas | Pendientes `Listo` |
| Cocinero | Pedidos, Cerrar sesión | — (vista única) | N pedidos + "act. hace X s" del sondeo |
| Administrador | Inicio, Usuarios, Platillos, Menú del día, Cerrar sesión | — | Conteos de endpoints existentes |

Rutas nuevas: `/admin` (landing) y `/caja/entregas`. Resto de rutas intacto.

## Tarjeta de pedido operativa (presentación, sin tabla)

- Cocina: folio heading 800 + número mono 20px+, chip de origen
  (anticipado/mostrador), hora + "recoge HH:MM", tiempo transcurrido con
  alerta de retraso, partidas `N×` 800 ≥20px, CTA único 48px (Listo sin CTA).
- Caja/Entregas: folio mono 20px+, cliente o "Sin nombre", partidas, badge
  Listo, Entregar/Cancelar 44px.
- Fuente de datos: `GET /api/cocina/pedidos`, `GET /api/caja/pendientes`,
  `GET /api/mis-pedidos` + `GET /api/pedidos/{id}` (existentes).

## Entidades por historia

| Historia | Entidades que usa |
|---|---|
| US1 (identidad visual) | Sistema de diseño |
| US2 (navegación) | Navegación por rol |
| US3 (cliente) | Navegación (cliente), Pedido (lectura), Aviso (lectura) |
| US4 (caja) | Navegación (cajero), Tarjeta de pedido operativa |
| US5 (cocina) | Navegación (cocinero), Tarjeta de pedido operativa |
| US6 (admin) | Navegación (administrador), usuarios/platillos/menú (lectura) |

## Fuera de alcance

Fotos de platillo, push/SMS, historial de ventas, métricas, métodos de pago,
descuentos, favoritos/reseñas, configuración (FR-016). Sin paginación nueva
ni cambios de contratos de API.
