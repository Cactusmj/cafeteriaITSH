---

description: "Task list for Sprint 5 — Seguimiento, notificaciones y pulido"
---

# Tasks: Sprint 5 — Seguimiento, notificaciones y pulido

**Input**: Design documents from `/specs/006-order-tracking-notifications/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidos y **requeridos** por el Principio V de la constitución y
por FR-013/SC-005 de la spec (avisos, seguimiento, permisos y regresión).

**Organization**: Tareas agrupadas por historia de usuario para permitir
implementación y prueba independientes.

> **Mapeo de historias**: `[US1]` = "Mis pedidos con estado y detalle".
> `[US2]` = "Aviso de pedido listo". Ambas componen la US7 de la spec maestra
> 001. El pulido es transversal (Phase 5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: Historia a la que pertenece (US1, US2)
- Rutas de archivo exactas en cada tarea

## Path Conventions

- Backend: `backend/src/`, `backend/tests/`
- Frontend: `frontend/src/`
- Esquema: `migrations/` (solo `004`, aditiva)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Migración de avisos. El resto de la infraestructura existe.

- [x] T001 Crear `migrations/004_avisos_app.sql` (`USE cafeteria_itsh;` + `ALTER TABLE notificacion DROP CHECK`/`ADD CONSTRAINT` para admitir canal `'app'` y estado `'vista'`; aplicar una sola vez) y documentar el paso en `docs/ejecutar-migraciones.md` (data-model, research R1)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Módulo de avisos separado, usado por el cambio a "Listo"

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta terminar esta fase

- [x] T002 [P] Crear el módulo `backend/src/services/avisos/avisos.service.ts` (`emitirAvisoListo({ pedidoId, usuarioId })` inserta siempre la fila en-app `tipo='pedido_listo'`, `canal='app'`, `estado_envio='enviada'`; interfaz `ProveedorAvisos` con implementación `Ninguno` por defecto; si hay proveedor configurado intenta el envío sin bloquear ni revertir lo en-app; research R3, FR-008, FR-009)
- [x] T003 [P] Test unitario en `backend/tests/avisos.service.test.ts` con `pool` simulado (emite en-app al pasar a "Listo" con dueño; no emite en otros destinos; sin dueño no emite; proveedor ausente o fallido no bloquea lo en-app; listar pendientes primero y marcar vistas)

**Checkpoint**: Fundación lista — las historias pueden comenzar

---

## Phase 3: User Story 1 - Mis pedidos con estado y detalle (Priority: P1) 🎯 MVP

**Goal**: El cliente ve sus pedidos con estado vigente y el detalle de cada
uno en `/mis-pedidos`.

**Independent Test**: Con pedidos en varios estados, abrir `/mis-pedidos` y
verificar lista descendente con estados y el detalle completo; cuenta nueva
ve mensaje claro; otro cliente no ve lo ajeno.

### Tests for User Story 1 ⚠️

> Escribir primero y confirmar que fallan antes de implementar

- [x] T004 [P] [US1] Test unitario en `backend/tests/mis-pedidos.test.ts` sobre `obtenerMisPedidos` (solo propios, orden descendente, folio/estado/total/horario/conteo, lista vacía sin pedidos)

### Implementation for User Story 1

- [x] T005 [US1] Implementar `obtenerMisPedidos` en `backend/src/services/avisos/avisos.service.ts` o servicio propio de lectura (dueño, orden descendente; FR-001, FR-004)
- [x] T006 [US1] Implementar `backend/src/controllers/avisos.controller.ts` (`misPedidos`) y `GET /api/mis-pedidos` en `backend/src/routes/avisos.routes.ts` (`autenticar` + `autorizarRol('usuario')`) + montar en `backend/src/app.ts` (contrato `contracts/avisos-api.md`)
- [x] T007 [US1] Reimplementar `frontend/src/pages/clientes/MisPedidos.tsx` (lista descendente con folio/estado/total, detalle expandible vía `GET /api/pedidos/{id}` existente, mensaje claro sin pedidos, refresco; FR-011)

**Checkpoint**: US1 funcional y probable de forma independiente

---

## Phase 4: User Story 2 - Aviso de pedido listo (Priority: P1)

**Goal**: Al pasar a "Listo" se genera el aviso al dueño; el cliente lo ve
destacado y lo marca como visto.

**Independent Test**: Llevar un pedido a "Listo" y verificar el aviso en
`GET /api/avisos`; llevar otro a "En preparación" (sin aviso); pasar un
mostrador sin dueño a "Listo" (sin aviso); marcar vistos y verificar que
desaparecen de pendientes.

### Tests for User Story 2 ⚠️

> Escribir primero y confirmar que fallan antes de implementar

- [x] T008 [P] [US2] Test de disparo en `backend/tests/avisos.service.test.ts` (al confirmar "Listo" con dueño se llama a `emitirAvisoListo` una vez; en otros destinos no se llama; sin dueño no se llama) — puede integrarse con `avanzarEstado` simulando el módulo de avisos

### Implementation for User Story 2

- [x] T009 [US2] Disparar `emitirAvisoListo` desde `avanzarEstado` en `backend/src/services/pedidos.service.ts` al confirmar destino `"Listo"` con `usuario_id` presente (edita archivo del sprint 4; secuencial; research R2, FR-005, FR-006)
- [x] T010 [US2] Implementar `obtenerAvisos` y `marcarVistos` en el módulo de avisos, `GET /api/avisos` y `PATCH /api/avisos/vistos` en `backend/src/controllers/avisos.controller.ts` y `backend/src/routes/avisos.routes.ts` (dueño o admin; edita archivos de T006; secuencial; contrato `contracts/avisos-api.md`; FR-007)
- [x] T011 [US2] Ampliar `frontend/src/pages/clientes/MisPedidos.tsx` de T007 (banner destacado con avisos pendientes y botón "Marcar como vistos"; tras marcar refresca) (edita archivo de T007; secuencial)

**Checkpoint**: US1 y US2 funcionan de forma independiente — seguimiento con
avisos de punta a punta

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Pulido acotado, permisos, verde total y validación del quickstart

- [x] T012 [P] Crear `frontend/src/components/pedidos/BadgeEstado.tsx` (pill con los 6 colores de `design/DESIGN.md`: Pendiente #9A3412, Pagado #1E7A46, En preparación #B45309, Listo #0369A1, Entregado #166534, Cancelado #B91C1C, texto blanco) y usarlo en `MisPedidos.tsx` (FR-012; sin cambiar navegación ni layouts)
- [x] T013 [P] Pruebas de permisos en `backend/tests/permisos.avisos.test.ts` (servidor efímero, sin base): 3 endpoints responden `401` sin token; `403` con cajero/cocinero en los tres; cliente ajeno ve `403` en detalle ajeno y solo lo propio en listas
- [x] T014 [P] Ampliar `frontend/src/routes/rutas.test.tsx` (cliente ve `/mis-pedidos`; cajero es redirigido fuera)
- [x] T015 Verificar que `npm test` y `npm run typecheck` pasan en `backend/` y `frontend/`, `npm run lint` en `frontend/`, y comprobar áreas ≥ 44 px y contraste en `/mis-pedidos`
- [ ] T016 Ejecutar la validación de `specs/006-order-tracking-notifications/quickstart.md` (5 escenarios, incluido el flujo completo del MVP)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — iniciar de inmediato
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA las historias
- **User Story 1 (Phase 3)**: tras Foundational
- **User Story 2 (Phase 4)**: tras Foundational; dispara desde `avanzarEstado` (sprint 4, sin modificar su lógica salvo el llamado)
- **Polish (Phase 5)**: tras completar las historias deseadas

### User Story Dependencies

- **US1 (P1)**: sin dependencia de otras historias
- **US2 (P1)**: necesita pedidos en "Listo" (los produce US2 de sprint 4 o datos existentes); su lógica es independiente

### Within Each User Story

- Tests primero y en rojo antes de implementar
- Servicios → controladores → rutas → UI
- Completar una historia antes de pasar a la siguiente

### Parallel Opportunities

- Foundational: T002, T003 en paralelo (mismo módulo; test primero)
- US1: T004
- US2: T008
- Polish: T012, T013, T014 en paralelo
- **Archivos compartidos (secuenciales)**: `backend/src/services/pedidos.service.ts` (T009),
  `backend/src/controllers/avisos.controller.ts` y `routes/avisos.routes.ts` (T006 → T010),
  `frontend/src/pages/clientes/MisPedidos.tsx` (T007 → T011 → T012)

---

## Parallel Example: User Story 1

```text
# Test de US1 (debe fallar primero):
T004 mis-pedidos.test.ts

# Tras el rojo, implementar en orden:
T005 obtenerMisPedidos
T006 endpoint + montaje
T007 MisPedidos.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (BLOQUEANTE)
3. Completar Phase 3: US1
4. **STOP y VALIDAR**: seguimiento con estados vigentes
5. Demo si está listo

### Incremental Delivery

1. Setup + Foundational → base lista (migración y módulo)
2. US1 → probar → demo (cliente ve sus pedidos)
3. US2 → probar → demo (aviso de listo de punta a punta)
4. Polish → permisos, verde, quickstart y flujo completo del MVP

---

## Notes

- `[P]` = archivos distintos, sin dependencias
- `[Story]` mapea la tarea a su historia (US1+US2 = US7 maestra)
- Cada historia debe ser completable y probable de forma independiente
- Verificar que los tests fallan antes de implementar
- Commit tras cada tarea o grupo lógico, en español
- Este sprint añade **solo** `migrations/004_avisos_app.sql`
- El pulido no cambia navegación ni layouts (el rediseño va en spec propia)
- Evitar: tareas vagas, conflictos sobre el mismo archivo, dependencias entre
  historias
