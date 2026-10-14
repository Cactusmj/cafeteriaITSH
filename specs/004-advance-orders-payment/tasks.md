---

description: "Task list for Sprint 3 â€” Pedido anticipado y pago"
---

# Tasks: Sprint 3 â€” Pedido anticipado y pago

**Input**: Design documents from `/specs/004-advance-orders-payment/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidos y **requeridos** por el Principio V de la constituciÃ³n y
por SC-008 de la spec (creaciÃ³n de pedidos, cÃ¡lculo de totales, regla de los
10 minutos, idempotencia, transiciÃ³n a `Pagado`, pago rechazado y permisos).

**Organization**: Tareas agrupadas por historia de usuario para permitir
implementaciÃ³n y prueba independientes.

> **Mapeo de historias**: `[US1]` = "Crear el pedido anticipado con sus
> validaciones" (US4, primera mitad). `[US2]` = "Pagar el pedido y dejarlo en
> Pagado" (US4, segunda mitad). Ambas componen la US4 de la spec maestra 001.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: Historia a la que pertenece (US1, US2)
- Rutas de archivo exactas en cada tarea

## Path Conventions

- Backend: `backend/src/`, `backend/tests/`
- Frontend: `frontend/src/`
- Esquema existente: `migrations/` (este sprint aÃ±ade **solo** `003`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: ConfiguraciÃ³n del proveedor de pago que usa US2. La
infraestructura general (Express, middlewares, cliente HTTP, sesiÃ³n) ya existe
de los sprints 1â€“2.

- [x] T001 [P] Agregar `PAYMENT_PROVIDER` (default `sandbox`) y `PAYMENT_API_KEY` (vacÃ­o en desarrollo) a `backend/src/config/env.ts` y documentarlos en `backend/.env.example` (nunca valores reales; constituciÃ³n Principio III, research R13)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: MigraciÃ³n aditiva y utilerÃ­a de fecha que comparten creaciÃ³n y
pago

**âš ï¸ CRITICAL**: Ninguna historia puede empezar hasta terminar esta fase

- [x] T002 Crear `migrations/003_clave_idempotencia_pedido.sql` (`ALTER TABLE pedido ADD COLUMN clave_idempotencia VARCHAR(36) NULL, ADD UNIQUE KEY uq_pedido_clave_idempotencia (clave_idempotencia)`; `USE cafeteria_itsh;` al inicio) y actualizar `docs/ejecutar-migraciones.md` con el paso de `003` (data-model, research R1)
- [x] T003 [P] Ampliar `backend/src/utils/fecha.ts` con `esFechaHoraISO(valor)` (formato `YYYY-MM-DDTHH:mm`, fecha y hora reales) y `minimoRecoleccion(ahora)` que devuelve la hora mÃ­nima `ahora + 10 minutos` (research R3, FR-003)

**Checkpoint**: FundaciÃ³n lista â€” las historias pueden comenzar

---

## Phase 3: User Story 1 - Crear el pedido anticipado con sus validaciones (Priority: P1) ðŸŽ¯ MVP

**Goal**: El cliente arma el carrito desde `/menu`, elige horario (â‰¥ 10
minutos) y el servidor crea el pedido `Pendiente` con folio, detalle y total
recalculado.

**Independent Test**: Con el backend y el menÃº de hoy sembrado, crear un
pedido vÃ¡lido por API (`201` con folio y total correcto) y verificar los
rechazos: menos de 10 minutos, platillo no disponible, cantidad invÃ¡lida y
clave de idempotencia repetida (mismo pedido, `200`).

### Tests for User Story 1 âš ï¸

> Escribir primero y confirmar que fallan antes de implementar

- [x] T004 [P] [US1] Test unitario de creaciÃ³n en `backend/tests/pedidos.service.test.ts` sobre `pedidos.service.ts` con `pool` simulado (patrÃ³n de los sprints 1â€“2): creaciÃ³n OK con `estado` `Pendiente`, folio `PED-â€¦` y total recalculado con precios del menÃº; `ANTICIPACION_INSUFICIENTE` con menos de 10 minutos o horario pasado; `PLATILLO_NO_DISPONIBLE` cuando `menu_dia.disponible` o `platillo.activo` es falso; `MENU_DIA_NO_ENCONTRADO` con `menu_dia_id` inexistente; `VALIDACION` con carrito vacÃ­o, cantidad 0 o > 20, lÃ­nea repetida; idempotencia: misma `clave_idempotencia` devuelve el mismo `id` sin segundo `INSERT` del pedido; historial `NULL â†’ Pendiente` registrado)

### Implementation for User Story 1

- [x] T005 [US1] Definir esquemas zod en `backend/src/schemas/pedidos.schemas.ts` (`fecha_recoleccion` `YYYY-MM-DDTHH:mm` vÃ­a `esFechaHoraISO`; `clave_idempotencia` UUID v4; `items` de 1 a 20 lÃ­neas con `menu_dia_id` entero positivo y `cantidad` entero de 1 a 20; sin `menu_dia_id` repetidos; FR-001, FR-003, FR-013)
- [x] T006 [US1] Implementar `crearPedido` y `obtenerPedidoPorId` en `backend/src/services/pedidos.service.ts` (INSERT del pedido tipo `anticipado` con `estado_id` de `Pendiente`, folio `PED-` + 8 caracteres con reintento ante colisiÃ³n, recÃ¡lculo de total leyendo `menu_dia`+`platillo` del dÃ­a, INSERT de `pedido_detalle` con `precio_unitario` vigente, historial `NULL â†’ Pendiente`, deduplicaciÃ³n por `clave_idempotencia` devolviendo el existente; FR-002, FR-004, FR-008, FR-009, FR-010, FR-011, FR-014; research R2, R4, R5, R8)
- [x] T007 [US1] Implementar `backend/src/controllers/pedidos.controller.ts` (`crear`, `obtener`; lee `req.usuario` para el dueÃ±o)
- [x] T008 [US1] Implementar `backend/src/routes/pedidos.routes.ts` (`POST /` y `GET /:id` con `autenticar` + `autorizarRol(ROL.CLIENTE)` en la creaciÃ³n; `GET /:id` admite dueÃ±o o administrador) y montar `app.use('/api/pedidos', pedidosRoutes)` en `backend/src/app.ts` (edita `app.ts`; contrato `contracts/pedidos-api.md`)
- [x] T009 [US1] Implementar el carrito en `frontend/src/pages/clientes/Menu.tsx` (agregar/quitar cantidades de platillos disponibles, resumen con total, botÃ³n fijo hacia `/confirmar-pedido`; Ã¡reas tÃ¡ctiles â‰¥ 44 px)
- [x] T010 [US1] Crear `frontend/src/pages/clientes/ConfirmarPedido.tsx` (lee el carrito, muestra resumen y total, selector de horarios cada 15 minutos desde `ahora + 15` hasta el cierre 17:00, valida en cliente el mÃ­nimo de 10 minutos, llama `POST /api/pedidos` con `clave_idempotencia` UUID persistida mientras haya reintento, muestra folio/estado `Pendiente` tras crear; botÃ³n "Pagar" como punto de conexiÃ³n de US2)
- [x] T011 [US1] Registrar `/confirmar-pedido` tras `RutaPorRol roles={['usuario']}` en `frontend/src/routes/AppRouter.tsx` y ampliar `frontend/src/routes/rutas.test.tsx` con la nueva ruta (ambos archivos compartidos: secuencial)

**Checkpoint**: US1 funcional y probable de forma independiente (pedido creado
en `Pendiente` sin aÃºn poder pagar)

---

## Phase 4: User Story 2 - Pagar el pedido y dejarlo en "Pagado" (Priority: P1)

**Goal**: El cliente paga el pedido con el proveedor (sandbox); con aprobaciÃ³n
pasa a `Pagado` con registro mÃ­nimo de la transacciÃ³n; con rechazo permanece
`Pendiente` y puede reintentar.

**Independent Test**: Pagar un pedido `Pendiente` (sandbox aprueba) â†’ `200`
con estado `Pagado` y `referencia` `sbx-â€¦`, fila en `pago` e historial
`Pendiente â†’ Pagado`; con el modo de prueba de fallo â†’ `402 PAGO_RECHAZADO`
y el pedido sigue `Pendiente`; repetir el pago de uno ya `Pagado` â†’ `200`
idempotente sin cobro duplicado.

### Tests for User Story 2 âš ï¸

> Escribir primero y confirmar que fallan antes de implementar

- [x] T012 [P] [US2] Test unitario de pago en `backend/tests/pedidos.pago.test.ts` sobre `pedidos.service.ts` con proveedor simulado: pago aprobado â†’ estado `Pagado`, `INSERT` en `pago` (`metodo` `online`, `monto` = total, `referencia`), historial `Pendiente â†’ Pagado`; proveedor rechaza â†’ `PAGO_RECHAZADO` sin `pago` ni cambio de estado; pedido ya `Pagado` â†’ devuelve la misma confirmaciÃ³n sin segunda fila; `ESTADO_INVALIDO` si el pedido no estÃ¡ `Pendiente` ni `Pagado`; `PEDIDO_NO_ENCONTRADO` con id inexistente
- [x] T013 [P] [US2] Pruebas de permisos en `backend/tests/permisos.pedidos.test.ts` (patrÃ³n de `permisos.menu.test.ts`, servidor efÃ­mero con `crearApp()` y tokens `firmar()`, sin tocar la base): `POST /api/pedidos` y `POST /api/pedidos/{id}/pago` responden `401` sin token y `403` con rol `administrador`, `cajero` o `cocinero`; `GET /api/pedidos/{id}` responde `200` con token de administrador

### Implementation for User Story 2

- [x] T014 [US2] Crear `backend/src/services/pagos/proveedor-pago.ts` (interfaz `ProveedorPago` con `procesarPago({ numero, monto, idempotencia })` â†’ `{ aprobado, referencia, mensaje? }`; `ProveedorPagoSandbox` aprueba siempre con `referencia` = `sbx-` + correlativo y expone un modo de prueba de fallo; `obtenerProveedorPago()` segÃºn `env.paymentProvider`; research R6, contrato `contracts/proveedor-pago.md`)
- [x] T015 [US2] Implementar `pagarPedido` en `backend/src/services/pedidos.service.ts` (dueÃ±o y estado `Pendiente`; ya `Pagado` â†’ confirmaciÃ³n idempotente; llama al proveedor; si aprueba: `INSERT` en `pago`, transiciÃ³n `Pendiente â†’ Pagado` validada contra `transicion_estado` e historial con `cambiado_por`; si rechaza: `PAGO_RECHAZADO` y el pedido sigue `Pendiente`; FR-005, FR-006, FR-007, FR-008, FR-014; research R5, R7, R8), el endpoint `POST /:id/pago` en `pedidos.controller.ts` y `pedidos.routes.ts` (edita archivos de T007/T008; secuencial; contrato `contracts/pedidos-api.md`)
- [x] T016 [US2] Completar `frontend/src/pages/clientes/ConfirmarPedido.tsx` (botÃ³n "Pagar" que llama `POST /api/pedidos/{id}/pago` con el mismo `clave_idempotencia`; vista de confirmaciÃ³n con folio, total, horario, estado `Pagado` y referencia; manejo de `402 PAGO_RECHAZADO` con mensaje claro y botÃ³n de reintento que no duplica el pedido; carga deshabilitada durante el pago)

**Checkpoint**: US1 y US2 funcionan de forma independiente â€” flujo completo
menÃº â†’ pedido â†’ pago â†’ `Pagado`

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a ambas historias

- [x] T017 [P] Verificar que `npm test` y `npm run typecheck` pasan en `backend/` y `frontend/`, y comprobar la responsividad en mÃ³vil y escritorio con Ã¡reas tÃ¡ctiles â‰¥ 44 px en `/menu` y `/confirmar-pedido`
- [x] T018 Ejecutar la validaciÃ³n de `specs/004-advance-orders-payment/quickstart.md` (7 escenarios, incluida la migraciÃ³n `003`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias â€” iniciar de inmediato
- **Foundational (Phase 2)**: depende de Setup (la config de entorno documenta las variables) â€” BLOQUEA ambas historias
- **User Story 1 (Phase 3)**: tras Foundational
- **User Story 2 (Phase 4)**: tras Foundational; usa `pedidos.service.ts` de US1 (pagar un pedido creado) â€” la lÃ³gica de pago es independiente salvo ese punto de integraciÃ³n
- **Polish (Phase 5)**: tras completar las historias deseadas

### User Story Dependencies

- **US1 (P1)**: sin dependencia de otras historias (crea el dominio de pedidos)
- **US2 (P1)**: necesita un pedido `Pendiente` (creado por US1) para probar el pago de punta a punta; su lÃ³gica (proveedor, transiciÃ³n, idempotencia) es independiente y testeable con mocks

### Within Each User Story

- Tests primero y en rojo antes de implementar
- Esquemas â†’ servicios â†’ controladores â†’ rutas â†’ UI
- Completar una historia antes de pasar a la siguiente

### Parallel Opportunities

- Setup: T001
- Foundational: T003
- US1: T004
- US2: T012, T013 en paralelo (archivos de test distintos)
- Polish: T017
- **Archivos compartidos (secuenciales)**: `backend/src/app.ts` (T008),
  `backend/src/services/pedidos.service.ts` (T006 â†’ T015),
  `backend/src/controllers/pedidos.controller.ts` (T007 â†’ T015),
  `backend/src/routes/pedidos.routes.ts` (T008 â†’ T015),
  `frontend/src/pages/clientes/ConfirmarPedido.tsx` (T010 â†’ T016),
  `frontend/src/routes/AppRouter.tsx` (T011)

---

## Parallel Example: User Story 2

```text
# Lanzar los tests de US2 juntos (deben fallar primero):
T012 pedidos.pago.test.ts
T013 permisos.pedidos.test.ts

# Tras los tests rojos, implementar en orden:
T014 proveedor-pago.ts
T015 pagarPedido + endpoint
T016 frontend de pago
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (BLOQUEANTE)
3. Completar Phase 3: US1
4. **STOP y VALIDAR**: probar la creaciÃ³n del pedido de forma independiente
   (quickstart escenarios 1, 2, 5-parcial y 6)
5. Demo si estÃ¡ listo

### Incremental Delivery

1. Setup + Foundational â†’ base lista (migraciÃ³n y config)
2. US1 â†’ probar â†’ demo (cliente arma el carrito y confirma el pedido)
3. US2 â†’ probar â†’ demo (cliente paga y ve la confirmaciÃ³n `Pagado`)
4. Polish â†’ typecheck, responsividad y validaciÃ³n de quickstart

---

## Notes

- `[P]` = archivos distintos, sin dependencias
- `[Story]` mapea la tarea a su historia (US1 y US2 componen la US4 maestra)
- Cada historia debe ser completable y probable de forma independiente
- Verificar que los tests fallan antes de implementar
- Commit tras cada tarea o grupo lÃ³gico, en espaÃ±ol
- Este sprint aÃ±ade **solo** `migrations/003_clave_idempotencia_pedido.sql`;
  `pedido`, `pedido_detalle`, `pago` y los estados ya existen desde el `001`
- Nunca recibir ni registrar datos de tarjeta; `PAYMENT_API_KEY` solo en `.env`
- Evitar: tareas vagas, conflictos sobre el mismo archivo, dependencias entre
  historias

