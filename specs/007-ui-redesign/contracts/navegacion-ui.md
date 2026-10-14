# Contrato UI — Navegación y rutas (US2 + historias por rol)

Sin cambios de API. Este contrato fija las rutas y reglas de navegación que
las tareas y los tests de rutas deben cumplir.

## Rutas

| Ruta | Rol | Contenido |
|---|---|---|
| `/login`, `/registro` | público | Sin cambios, migradas a tokens |
| `/menu` | usuario | Catálogo rediseñado (US3) |
| `/mis-pedidos` | usuario | Seguimiento rediseñado (US3) |
| `/confirmar-pedido` | usuario | Sin cambios de flujo, migrada a tokens |
| `/admin` | administrador | **NUEVA**: landing con conteos + resumen del menú (US6) |
| `/admin/usuarios`, `/admin/platillos`, `/admin/menu` | administrador | Mismo CRUD, filas altas (US6) |
| `/caja` | cajero | Inicio + captura + cobro en un paso (US4) |
| `/caja/entregas` | cajero | **NUEVA**: listos por llegada (US4) |
| `/cocina` | cocinero | KDS 2 columnas escritorio (US5) |
| `/` | sesión | Redirige a `INICIO_POR_ROL` (actualizar: admin → `/admin`, cajero → `/caja`) |
| `*` | — | Redirige a `/` (sin cambios) |

## Reglas

- Toda ruta protegida cuelga de `RutaProtegida` + `LayoutPorRol` + su grupo
  `RutaPorRol`; las guardas no cambian.
- Drawer: overlay con fondo oscurecido en móvil; panel fijo 16rem en
  escritorio; hamburguesa en header sticky; perfil con nombre y rol; Cerrar
  sesión al final.
- Bottom bar solo en móvil: cliente (Menú, Mis pedidos + aviso) y caja
  (Caja, Entregas + contador), altura ≥ 56 px, pestañas ≥ 44 px.
- Contadores: cliente desde `GET /api/avisos` (pendientes `enviada`, con
  sondeo); caja desde pendientes `Listo`; cocina desde su sondeo existente.
- Flujo de pedido del cliente keeps botones de regresar; no aparece en la
  bottom bar.

## Códigos

Sin cambios: `401` sin sesión (→ `/login`), redirección fuera de rol ajeno
(vía `RutaPorRol`), mismos códigos de API.
