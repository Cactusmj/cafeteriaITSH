---

description: "Task list for Sprint 2 — Gestión de menú y consulta de menú"
---

# Tasks: Sprint 2 — Gestión de menú y consulta de menú

**Input**: Design documents from `/specs/003-menu-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidos y **requeridos** por el Principio V de la constitución
(deben cubrir la gestión del menú: platillos, precios, disponibilidad,
especiales y consulta pública).

**Organization**: Tareas agrupadas por historia de usuario para permitir
implementación y prueba independientes.

> **Mapeo de historias**: `[US1]` = "Gestión de platillos y menú del día" (US2
> de la spec maestra 001). `[US2]` = "Consulta del menú del día" (US3 de la
> spec maestra 001).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: Historia a la que pertenece (US1, US2)
- Rutas de archivo exactas en cada tarea

## Path Conventions

- Backend: `backend/src/`, `backend/tests/`
- Frontend: `frontend/src/`
- Esquema existente: `migrations/` (este sprint **no** añade migraciones)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Constantes compartidas del dominio del menú. La infraestructura
general (Express, middlewares, cliente HTTP, sesión) ya existe del sprint 1.

- [ ] T001 [P] Crear la lista fija de categorías en `backend/src/config/categorias.ts` (`comidas`, `bebidas`, `postres`, `complementos` como array de lectura y tipo `Categoria`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Utilería que comparten la gestión y la consulta del menú

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta terminar esta fase

- [ ] T002 [P] Crear utilería de fecha en `backend/src/utils/fecha.ts` (`hoyISO()` devuelve `YYYY-MM-DD` con la fecha del servidor; `esFechaISO()` valida el formato; FR-008)

**Checkpoint**: Fundación lista — las historias pueden comenzar

---

## Phase 3: User Story 1 - Gestión de platillos y menú del día (Priority: P1) 🎯 MVP

**Goal**: El administrador gestiona el catálogo de platillos y publica el menú
de cada día con precio, disponibilidad y especiales.

**Independent Test**: Crear un platillo, agregarlo al menú de hoy con precio,
cambiar disponibilidad y especial, y verificar los cambios; probar duplicados,
precios inválidos y permisos.

### Tests for User Story 1 ⚠️

> Escribir primero y confirmar que fallan antes de implementar

- [ ] T003 [P] [US1] Test unitario de `backend/src/services/platillos.service.ts` en `backend/tests/platillos.service.test.ts` (crear OK; `NOMBRE_EN_USO` con nombre activo duplicado; nombre vacío/ > 100 rechazado; categoría fuera de la lista fija rechazada; descripción > 500 rechazada; editar; `NO_ENCONTRADO` al editar inexistente; desactivar y activar)
- [ ] T004 [P] [US1] Test unitario de `backend/src/services/menu.service.ts` en `backend/tests/menu.service.test.ts` (agregar platillo al menú OK; precio ≤ 0 o no numérico rechazado; `DUPLICADO` el mismo día; `PLATILLO_INACTIVO`; `NO_ENCONTRADO` con platillo o entrada inexistente; editar precio/disponible/especial; eliminar OK; eliminar con pedidos referenciados → `REFERENCIADO`)

### Implementation for User Story 1

- [ ] T005 [US1] Definir esquemas zod de platillos en `backend/src/schemas/platillos.schemas.ts` (nombre de 1 a 100 caracteres no vacío; `categoria` en la lista fija de T001; `descripcion` opcional de hasta 500)
- [ ] T006 [US1] Definir esquemas zod del menú en `backend/src/schemas/menu.schemas.ts` (fecha opcional `YYYY-MM-DD` vía `esFechaISO`; `platillo_id` entero positivo; precio numérico > 0 con hasta 2 decimales; `disponible` y `especial` booleanos; FR-008, FR-010)
- [ ] T007 [US1] Implementar `backend/src/services/platillos.service.ts` (listar activos con `?incluirInactivos`, crear con rechazo de nombre duplicado activo, editar, cambiar `activo`; baja lógica sin borrado físico; FR-001, FR-008, FR-012)
- [ ] T008 [US1] Implementar `backend/src/services/menu.service.ts` (listar por fecha; agregar platillo al menú validando existencia, `activo` y no duplicado en la fecha; editar `precio`/`disponible`/`especial`; eliminar entrada; si `pedido_detalle` la referencia, `REFERENCIADO`; FR-002, FR-003, FR-009, FR-010; research R7)
- [ ] T009 [US1] Implementar `backend/src/controllers/platillos.controller.ts`
- [ ] T010 [US1] Implementar `backend/src/controllers/menu.controller.ts` (gestión)
- [ ] T011 [US1] Implementar `backend/src/routes/platillos.routes.ts` con `autenticar` + `autorizarRol('administrador')` (contrato `contracts/platillos-api.md`)
- [ ] T012 [US1] Implementar `backend/src/routes/menu.routes.ts` (prefijo `/api/admin/menu`, solo gestión) y montar `platillos.routes` y `menu.routes` en `backend/src/app.ts` (edita `app.ts`; secuencial respecto a T017)
- [ ] T013 [US1] Implementar la página de catálogo en `frontend/src/pages/admin/Platillos.tsx` (listar, alta, edición, activar/desactivar, selector de categorías, mensajes de conflicto)
- [ ] T014 [US1] Implementar la página del menú del día en `frontend/src/pages/admin/MenuDelDia.tsx` (lista de entradas con precio editable, botones de disponible/especial, agregar platillo del catálogo, eliminar entrada)
- [ ] T015 [US1] Registrar las rutas `/admin/platillos` y `/admin/menu` en `frontend/src/routes/AppRouter.tsx` y añadir sus enlaces en `frontend/src/components/layout/LayoutPorRol.tsx` (ambos archivos compartidos: editar de forma secuencial)

**Checkpoint**: US1 funcional y probable de forma independiente

---

## Phase 4: User Story 2 - Consulta del menú del día (Priority: P1)

**Goal**: Cualquier visitante o cliente consulta el menú de hoy con precios,
disponibilidad efectiva y especiales, en una pantalla responsiva.

**Independent Test**: Con un menú publicado, abrir `/menu` sin sesión y
verificar la lista, las marcas de especial/no disponible y el mensaje de día
sin menú.

### Tests for User Story 2 ⚠️

- [ ] T016 [P] [US2] Test unitario de la consulta pública en `backend/tests/menu.consulta.test.ts` sobre `obtenerMenuPublico` de `menu.service` (disponibilidad efectiva = `menu_dia.disponible AND platillo.activo`; orden por categoría, especial primero, nombre; fecha sin menú → lista vacía; el platillo inactivo aparece con `disponible: false`)

### Implementation for User Story 2

- [ ] T017 [US2] Implementar `obtenerMenuPublico(fecha)` en `backend/src/services/menu.service.ts` y `GET /api/menu` público (sin middlewares de sesión) en `backend/src/routes/menu.routes.ts` + `backend/src/controllers/menu.controller.ts` (edita archivos de T008/T010/T012; secuencial; contrato `contracts/menu-api.md`; FR-004, FR-005, FR-006, FR-011)
- [ ] T018 [US2] Crear `frontend/src/components/menu/TarjetaPlatillo.tsx` (nombre, categoría, descripción, precio y etiquetas de especial y no disponible)
- [ ] T019 [US2] Reimplementar `frontend/src/pages/clientes/Menu.tsx` (consulta `/api/menu` al montar, agrupa por categoría, muestra especial/no disponible, mensaje claro sin menú, botón de refresco; responsivo móvil; FR-013)

**Checkpoint**: US1 y US2 funcionan de forma independiente

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a ambas historias

- [ ] T020 [P] Pruebas de permisos del menú en `backend/tests/permisos.menu.test.ts` (patrón de `permisos.test.ts`, sin tocar la base): `GET /api/admin/platillos` y `GET /api/admin/menu` responden `401` sin token y `403` con rol `usuario` o `cajero`
- [ ] T021 Verificar que `npm test` y `npm run typecheck` pasan en `backend/` y `frontend/`, y comprobar la responsividad en móvil y escritorio con áreas táctiles ≥ 44 px en `/admin/platillos`, `/admin/menu` y `/menu`
- [ ] T022 Ejecutar la validación de `specs/003-menu-management/quickstart.md` (5 escenarios)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — iniciar de inmediato
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA ambas historias
- **User Story 1 (Phase 3)**: tras Foundational
- **User Story 2 (Phase 4)**: usa `menu.service` de US1; la ruta pública y la UI son independientes
- **Polish (Phase 5)**: tras completar las historias deseadas

### User Story Dependencies

- **US1 (P1)**: sin dependencia de otras historias (gestión del dominio)
- **US2 (P1)**: lee el mismo servicio de menú de US1; su valor (consulta pública) es independiente y se prueba con datos sembrados por la gestión

### Within Each User Story

- Tests primero y en rojo antes de implementar
- Esquemas → servicios → controladores → rutas → UI
- Completar una historia antes de pasar a la siguiente

### Parallel Opportunities

- Setup: T001
- Foundational: T002
- US1: T003, T004 en paralelo (tests); T005 y T006 en paralelo (esquemas)
- US2: T016
- Polish: T020
- **Archivos compartidos (secuenciales)**: `backend/src/app.ts` (T012 ↔ T017),
  `backend/src/routes/menu.routes.ts` (T012 → T017),
  `backend/src/services/menu.service.ts` (T008 → T017),
  `frontend/src/routes/AppRouter.tsx` y `LayoutPorRol.tsx` (T015)

---

## Parallel Example: User Story 1

```text
# Lanzar los tests de US1 juntos (deben fallar primero):
T003 platillos.service.test.ts
T004 menu.service.test.ts

# Lanzar los esquemas en paralelo:
T005 platillos.schemas.ts
T006 menu.schemas.ts
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (BLOQUEANTE)
3. Completar Phase 3: US1
4. **STOP y VALIDAR**: probar la gestión de platillos y menú de forma independiente
5. Demo si está listo

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → probar → demo (admin publica el menú)
3. US2 → probar → demo (cliente consulta el menú en el móvil)
4. Polish → permisos, typecheck y validación de quickstart

---

## Notes

- `[P]` = archivos distintos, sin dependencias
- `[Story]` mapea la tarea a su historia (US1 = US2 maestra, US2 = US3 maestra)
- Cada historia debe ser completable y probable de forma independiente
- Verificar que los tests fallan antes de implementar
- Commit tras cada tarea o grupo lógico
- Este sprint no modifica `migrations/` (el esquema ya tiene `platillo` y `menu_dia`)
- Evitar: tareas vagas, conflictos sobre el mismo archivo, dependencias entre historias
