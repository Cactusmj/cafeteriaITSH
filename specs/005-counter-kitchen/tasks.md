---

description: "Task list for Sprint 4 â€” Mostrador (cajero) y cocina"
---

# Tasks: Sprint 4 â€” Mostrador (cajero) y cocina

**Input**: Design documents from `/specs/005-counter-kitchen/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidos y **requeridos** por el Principio V de la constituciÃ³n y
por SC-007 de la spec (mostrador, cobro, transiciones, tablero y permisos).

**Organization**: Tareas agrupadas por historia de usuario para permitir
implementaciÃ³n y prueba independientes.

> **Mapeo de historias**: `[US1]` = "Captura de pedido de mostrador y cobro"
> (US6, primera mitad). `[US2]` = "Cocina procesa los pedidos" (US5).
> `[US3]` = "Entrega y cancelaciÃ³n" (US6, cierre). US1+US3 componen la US6 de
> la spec maestra 001; US2 es la US5.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: Historia a la que pertenece (US1, US2, US3)
- Rutas de archivo exactas en cada tarea

## Path Conventions

- Backend: `backend/src/`, `backend/tests/`
- Frontend: `frontend/src/`
- Esquema existente: `migrations/` (este sprint **no** aÃ±ade migraciones)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: ValidaciÃ³n de entrada del dominio operativo. La infraestructura
general ya existe de los sprints 1â€“3.

- [x] T001 [P] Definir esquemas zod de mostrador en `backend/src/schemas/mostrador.schemas.ts` (items 1â€“20 lÃ­neas sin `menu_dia_id` repetidos, `cantidad` entero 1â€“20, `cliente_nombre` opcional de hasta 100, `clave_idempotencia` UUID; esquema de cobro con `monto_recibido` numÃ©rico â‰¥ 0 con â‰¤ 2 decimales; FR-001, FR-003, FR-005)
- [x] T002 [P] Definir esquema zod de transiciÃ³n en `backend/src/schemas/estado.schemas.ts` (`estado` destino en: "En preparaciÃ³n", "Listo", "Entregado", "Cancelado"; FR-008)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Matriz de roles compartida por el avance de estados y el cobro

**âš ï¸ CRITICAL**: Ninguna historia puede empezar hasta terminar esta fase

- [x] T003 Crear la matriz de destinos por rol en `backend/src/config/estados.ts` (cocinero: "En preparaciÃ³n", "Listo"; cajero: "Entregado", "Cancelado"; el cobro a "Pagado" vive en el servicio de mostrador; research R4, FR-013)

**Checkpoint**: FundaciÃ³n lista â€” las historias pueden comenzar

---

## Phase 3: User Story 1 - Captura de pedido de mostrador y cobro (Priority: P1) ðŸŽ¯ MVP

**Goal**: El cajero captura pedidos presenciales, cobra en efectivo y los deja
"Pagados" para cocina, sin interrumpir la fila.

**Independent Test**: Capturar un mostrador por API (`201` tipo mostrador sin
horario), cobrarlo con monto suficiente (`200` con cambio), e intentar cobrar
con monto insuficiente (`402`) y dos veces seguidas (un solo cobro).

### Tests for User Story 1 âš ï¸

> Escribir primero y confirmar que fallan antes de implementar

- [x] T004 [P] [US1] Test unitario en `backend/tests/mostrador.service.test.ts` con `pool` simulado: captura OK (tipo mostrador, estado "Pendiente", sin `fecha_recoleccion`, folio, total recalculado, historial); `PLATILLO_NO_DISPONIBLE`; idempotencia por clave (mismo pedido, sin duplicar); cobro OK (estado "Pagado", `cambio` calculado, fila `pago` en efectivo, historial); `COBRO_INSUFICIENTE` (sigue "Pendiente", sin fila de pago); segundo cobro idempotente (una sola fila); cobrar anticipado â†’ `ESTADO_INVALIDO`

### Implementation for User Story 1

- [x] T005 [US1] Implementar `crearMostrador` y `cobrarMostrador` en `backend/src/services/mostrador.service.ts` (reutiliza reglas del sprint 3: disponibilidad efectiva, total recalculado, folio, idempotencia, historial; cobro valida monto, calcula cambio, inserta `pago` con `referencia` = `efectivo-{folio}` y transiciona a "Pagado" validando la tabla; FR-001 a FR-005, FR-015, FR-016; research R2, R3, R8, R9)
- [x] T006 [US1] Implementar `backend/src/controllers/mostrador.controller.ts` (`crear`, `cobrar`; el cajero es `req.usuario.id` como `creado_por`/`registrado_por`)
- [x] T007 [US1] Implementar `backend/src/routes/mostrador.routes.ts` (`POST /api/pedidos/mostrador` y `POST /api/pedidos/:id/cobro` con `autenticar` + `autorizarRol('cajero')`) y montarlo en `backend/src/app.ts` (contrato `contracts/mostrador-api.md`)
- [x] T008 [US1] Reimplementar `frontend/src/pages/caja/Caja.tsx` (catÃ¡logo del menÃº de hoy con cantidades, nombre de cliente opcional, total visible, cobro con monto recibido que muestra el cambio y el folio; botÃ³n "Cobrar" encadena crear+cobrar; Ã¡reas â‰¥ 44 px; FR-017)

**Checkpoint**: US1 funcional y probable de forma independiente (mostrador
capturado y cobrado sin cocina)

---

## Phase 4: User Story 2 - Cocina procesa los pedidos (Priority: P1)

**Goal**: El cocinero ve anticipados y mostrador en un tablero Ãºnico ordenado
por llegada y los avanza a "En preparaciÃ³n" y "Listo", con actualizaciÃ³n sin
recarga manual.

**Independent Test**: Con "Pagados" de ambos orÃ­genes, abrir el tablero y
verificar el orden por llegada; avanzar a "En preparaciÃ³n" y a "Listo";
intentar el salto directo (rechazo) y avanzar con rol cajero (403).

### Tests for User Story 2 âš ï¸

> Escribir primero y confirmar que fallan antes de implementar

- [x] T009 [P] [US2] Test unitario del tablero en `backend/tests/cocina.service.test.ts` sobre `obtenerTablero` (solo "Pagado"/"En preparaciÃ³n"/"Listo", ambos orÃ­genes, orden por `creado_en`, detalle con platillo y cantidad, `minutos_en_espera`, lista vacÃ­a sin pedidos)
- [x] T010 [P] [US2] Test unitario de transiciones en `backend/tests/estados.service.test.ts` sobre `avanzarEstado` (cocinero: "Pagado"â†’"En preparaciÃ³n"â†’"Listo" OK con historial y `cambiado_por`; salto "Pagado"â†’"Listo" â†’ `ESTADO_INVALIDO`; "Entregado"/"Cancelado" inmutables; cajeroâ†’"En preparaciÃ³n" â†’ `403`; destino desconocido â†’ validaciÃ³n)

### Implementation for User Story 2

- [x] T011 [US2] Implementar `avanzarEstado` en `backend/src/services/pedidos.service.ts` (valida destino contra la matriz de T003 segÃºn el rol, valida la transiciÃ³n contra `transicion_estado`, rechaza "Entregado"/"Cancelado" como origen, registra historial; FR-007, FR-008, FR-013, FR-016; research R4), `PATCH /api/pedidos/:id/estado` en `backend/src/controllers/pedidos.controller.ts` y `backend/src/routes/pedidos.routes.ts` (solo `autenticar`; el servicio decide el 403 por rol; edita archivos del sprint 3; secuencial respecto a T016)
- [x] T012 [US2] Implementar `obtenerTablero` en `backend/src/services/cocina.service.ts`, `backend/src/controllers/cocina.controller.ts` y `GET /api/cocina/pedidos` en `backend/src/routes/cocina.routes.ts` (solo cocinero) + montar en `backend/src/app.ts` (contrato `contracts/cocina-api.md`; FR-006)
- [x] T013 [US2] Reimplementar `frontend/src/pages/cocina/Cocina.tsx` (tarjetas con folio grande, espera, detalle y total; botones "Iniciar preparaciÃ³n" y "Marcar listo"; sondeo cada 4 s con indicador de actualizaciÃ³n y refresco tras cada acciÃ³n; mensaje claro sin pedidos; patrÃ³n `void Promise.resolve().then(cargar)`; FR-011, FR-017)

**Checkpoint**: US1 y US2 funcionan de forma independiente (mostrador cobrado
aparece en cocina y avanza)

---

## Phase 5: User Story 3 - Entrega y cancelaciÃ³n (Priority: P2)

**Goal**: El cajero cierra el ciclo marcando "Entregado" y cancela pedidos no
entregados, con pendientes visibles en caja.

**Independent Test**: Marcar "Entregado" un "Listo" (desaparece de pendientes
e inmutable despuÃ©s); cancelar un mostrador "Pendiente" y un anticipado
"Pagado"; intentar cancelar como cocinero (403).

### Tests for User Story 3 âš ï¸

> Escribir primero y confirmar que fallan antes de implementar

- [x] T014 [P] [US3] Extender `backend/tests/estados.service.test.ts` (cajero: "Listo"â†’"Entregado" OK; cancelar desde "Pendiente"/"Pagado"/"En preparaciÃ³n"/"Listo" OK con historial; cocineroâ†’"Entregado" y cocineroâ†’"Cancelado" â†’ `403`)
- [x] T015 [P] [US3] Test unitario de pendientes en `backend/tests/caja.service.test.ts` sobre `obtenerPendientes` ("Listo" de ambos orÃ­genes + mostrador "Pendiente"/"Pagado", orden por llegada, folio/total/cliente/conteo, excluye anticipados "Pendiente" y "Entregado"/"Cancelado")

### Implementation for User Story 3

- [x] T016 [US3] Extender la matriz de T003 y `avanzarEstado` de T011 con los destinos del cajero ("Entregado" desde "Listo"; "Cancelado" desde "Pendiente"/"Pagado"/"En preparaciÃ³n"/"Listo") (edita `estados.ts` y `pedidos.service.ts` de T003/T011; secuencial; FR-009, FR-010; research R7)
- [x] T017 [US3] Implementar `obtenerPendientes` en `backend/src/services/caja.service.ts`, `backend/src/controllers/caja.controller.ts` y `GET /api/caja/pendientes` en `backend/src/routes/caja.routes.ts` (solo cajero) + montar en `backend/src/app.ts` (contrato `contracts/mostrador-api.md`; FR-009, FR-010)
- [x] T018 [US3] Ampliar `frontend/src/pages/caja/Caja.tsx` de T008 (secciÃ³n de pendientes con botones "Entregar" y "Cancelar", cobro de mostrador "Pendiente"; tras cada acciÃ³n refresca pendientes) (edita archivo de T008; secuencial)

**Checkpoint**: Ciclo completo mostradorâ†’cocinaâ†’entrega y cancelaciÃ³n
funcionando de forma independiente

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Permisos, verificaciÃ³n verde y validaciÃ³n del quickstart

- [x] T019 [P] Pruebas de permisos en `backend/tests/permisos.mostrador-cocina.test.ts` (servidor efÃ­mero, sin base): 4 endpoints nuevos responden `401` sin token; `403` con rol indebido (cliente en todo; cajero en cocina y en "En preparaciÃ³n"/"Listo"; cocinero en mostrador/cobro/entrega/cancelaciÃ³n y en pendientes de caja)
- [x] T020 [P] Ampliar `frontend/src/routes/rutas.test.tsx` (cajero ve `/caja`, cocinero ve `/cocina`, cliente es redirigido fuera de ambas)
- [x] T021 Verificar que `npm test` y `npm run typecheck` pasan en `backend/` y `frontend/`, `npm run lint` en `frontend/`, y comprobar responsividad y contraste con Ã¡reas â‰¥ 44 px en `/caja` y `/cocina`
- [ ] T022 Ejecutar la validaciÃ³n de `specs/005-counter-kitchen/quickstart.md` (6 escenarios)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias â€” iniciar de inmediato
- **Foundational (Phase 2)**: depende de Setup â€” BLOQUEA las historias
- **User Story 1 (Phase 3)**: tras Foundational
- **User Story 2 (Phase 4)**: tras Foundational; usa `avanzarEstado` nuevo (no depende de US1, se prueba con anticipados del sprint 3)
- **User Story 3 (Phase 5)**: extiende US2 (matriz y `avanzarEstado`) y US1 (`Caja.tsx`)
- **Polish (Phase 6)**: tras completar las historias deseadas

### User Story Dependencies

- **US1 (P1)**: sin dependencia de otras historias
- **US2 (P1)**: independiente de US1 (opera sobre pedidos existentes de cualquier origen)
- **US3 (P2)**: depende de US1 (pendientes de caja) y US2 (matriz y `avanzarEstado`)

### Within Each User Story

- Tests primero y en rojo antes de implementar
- Esquemas â†’ servicios â†’ controladores â†’ rutas â†’ UI
- Completar una historia antes de pasar a la siguiente

### Parallel Opportunities

- Setup: T001, T002 en paralelo
- US1: T004
- US2: T009, T010 en paralelo
- US3: T014, T015 en paralelo
- Polish: T019, T020 en paralelo
- **Archivos compartidos (secuenciales)**: `backend/src/app.ts` (T007, T012, T017),
  `backend/src/services/pedidos.service.ts` (T011 â†’ T016),
  `backend/src/config/estados.ts` (T003 â†’ T016),
  `backend/tests/estados.service.test.ts` (T010 â†’ T014),
  `frontend/src/pages/caja/Caja.tsx` (T008 â†’ T018)

---

## Parallel Example: User Story 2

```text
# Lanzar los tests de US2 juntos (deben fallar primero):
T009 cocina.service.test.ts
T010 estados.service.test.ts

# Tras los tests rojos, implementar en orden:
T011 avanzarEstado + PATCH estado
T012 tablero (servicio, controlador, ruta)
T013 Cocina.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (BLOQUEANTE)
3. Completar Phase 3: US1
4. **STOP y VALIDAR**: mostrador capturado y cobrado sin cocina
5. Demo si estÃ¡ listo

### Incremental Delivery

1. Setup + Foundational â†’ base lista
2. US1 â†’ probar â†’ demo (cajero cobra en mostrador)
3. US2 â†’ probar â†’ demo (cocina procesa en una pantalla)
4. US3 â†’ probar â†’ demo (entrega y cancelaciÃ³n)
5. Polish â†’ permisos, verde y quickstart

---

## Notes

- `[P]` = archivos distintos, sin dependencias
- `[Story]` mapea la tarea a su historia (US1+US3 = US6 maestra, US2 = US5 maestra)
- Cada historia debe ser completable y probable de forma independiente
- Verificar que los tests fallan antes de implementar
- Commit tras cada tarea o grupo lÃ³gico, en espaÃ±ol
- Este sprint no modifica `migrations/`; todo el esquema existe desde el `001`
- La devoluciÃ³n de dinero queda fuera del MVP (ajuste manual de caja)
- Evitar: tareas vagas, conflictos sobre el mismo archivo, dependencias entre
  historias

