# Quickstart — Validación del rediseño UI

Guía para validar tokens, navegación y pantallas por rol. Ver `spec.md`,
`data-model.md` y `contracts/navegacion-ui.md`.

## Prerrequisitos

- Sprints 1–5 completados; MySQL con `cafeteria_itsh` y cuentas seed.
- Dependencias instaladas (`npm install` en `frontend/` tras agregar
  `@fontsource/*`).

## Ejecutar en local

```powershell
npm run dev   # en backend/  (http://localhost:3000)
npm run dev   # en frontend/ (http://localhost:5173)
```

## Escenario 1 — Identidad visual (US1, por interfaz)

1. Abrir cada ruta con su rol → fondo crema, tarjetas blancas, acción
   principal verde, títulos Jakarta y cuerpo Inter.
2. Revisar insignias de cada estado → colores `status-*` con texto blanco.
3. Medir controles ( DevTools o inspección) → todos ≥ 44 px.

## Escenario 2 — Navegación por rol (US2, por interfaz + tests)

1. Entrar con cada rol → drawer con sus secciones y Cerrar sesión; en
   móvil, bottom bar donde corresponde (cliente y caja).
2. Con un pedido listo (cliente) → aviso en Mis pedidos de la navegación;
   con listos pendientes (cajero) → contador en Entregas.
3. Intentar ruta de otro rol → denegada como hoy.
4. `npx vitest run src/routes/rutas.test.tsx` en `frontend/` en verde.

## Escenario 3 — Cliente (US3, por interfaz)

1. `/menu`: buscar, filtrar por categoría, usar stepper, ver barra flotante
   con total; sin resultados → mensaje claro.
2. Confirmar con hora a <10 min → mensaje con hora mínima; pagar →
   leyenda de no captura de tarjeta visible.
3. `/mis-pedidos`: lista descendente, detalle expandible, pedido Listo
   destacado para recoger.

## Escenario 4 — Caja y cocina (US4–US5, por interfaz)

1. `/caja`: Capturar pedido → cobrar en un paso → folio; fallo → reintentar
   y cancelar con folio visible.
2. `/caja/entregas`: orden por llegada, folio grande, Entregar/Cancelar;
   al entregar, la fila desaparece y el contador se actualiza.
3. `/cocina`: tarjeta con folio, origen, recoge HH:MM, transcurrido y
   alerta de retraso; un toque por avance; Listo sin botón; 2 columnas en
   escritorio, lista única en móvil.

## Escenario 5 — Admin (US6, por interfaz)

1. `/admin`: conteos y resumen del menú de hoy con accesos a las secciones.
2. Usuarios/Platillos/Menú: filas altas, mismos flujos de crear/editar,
   error con reintento.

## Puertas de calidad

```powershell
npm run lint        # en frontend/
npm run typecheck   # en frontend/ (backend intacto, se revalida al cierre)
npm test            # en frontend/ y en backend/
```

Resultado esperado: todo en verde, incluidas las pruebas de rutas por rol y
componentes `ui/`, sin ningún elemento [Fuera de alcance] (FR-016).
