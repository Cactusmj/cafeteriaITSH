---

description: "Task list for 007-ui-redesign — Rediseño UI del sistema"
---

# Tasks: Rediseño UI del sistema

**Input**: Design documents from `/specs/007-ui-redesign/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/navegacion-ui.md

**Tests**: Incluidos y **requeridos** por el Principio V de la constitución y
por FR-017 de la spec (navegación por rol, componentes `ui/`, regresión de
seguimiento/avisos/permisos).

**Organization**: Tareas agrupadas por historia de usuario para permitir
implementación y prueba independientes.

> **Mapeo de historias**: `[US1]` = identidad visual institucional (Fase A).
> `[US2]` = navegación por rol con drawer y barra inferior (Fase B base).
> `[US3]` = app del cliente · `[US4]` = caja · `[US5]` = cocina ·
> `[US6]` = administración.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: Historia a la que pertenece (US1–US6)
- Rutas de archivo exactas en cada tarea

## Path Conventions

- Frontend: `frontend/src/`, pruebas `frontend/src/**/*.test.{ts,tsx}`
- Solo se toca `frontend/` (sin API ni migraciones)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencias de fuentes y tokens del sistema de diseño.

- [x]  Instalar en `frontend/` las dependencias `@fontsource/plus-jakarta-sans` y `@fontsource/inter` (únicas dependencias nuevas; research R2) y registrarlas en `frontend/src/main.tsx` con subconjunto latin
- [x]  Crear el bloque `@theme` en `frontend/src/index.css` con los tokens de `design/DESIGN.md` (superficies, `primary`, `secondary`, `tertiary`, `error`, `status-*`, `on-*`, radios, espaciado) y aplicar fondo crema + texto principal al `body` (research R1, FR-001, FR-003)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Componentes `ui/` reutilizables que todas las historias usan.

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta terminar esta fase

- [x]  [P] Crear `frontend/src/components/ui/Boton.tsx` (variantes primario/secundario, 44–48 px, deshabilitado legible) + test en `frontend/src/components/ui/Boton.test.tsx` (variantes y deshabilitado)
- [x]  [P] Crear `frontend/src/components/ui/Tarjeta.tsx` (fondo blanco, borde `outline-variant`, sombra sutil, radios 12–16 px) + test en `frontend/src/components/ui/Tarjeta.test.tsx`
- [x]  [P] Crear `frontend/src/components/ui/Campo.tsx` (etiqueta visible arriba, foco verde 2 px, error inline en color error) + test en `frontend/src/components/ui/Campo.test.tsx` (etiqueta y mensaje de error)
- [x]  [P] Crear `frontend/src/components/ui/InsigniaEspecial.tsx` (pill espresso para Especial) y `frontend/src/components/ui/EstadoVacio.tsx` (carga/vacío/error con `Reintentar`) + tests en `frontend/src/components/ui/EstadoVacio.test.tsx`

**Checkpoint**: Fundación lista — las historias pueden comenzar

---

## Phase 3: User Story 1 - Identidad visual institucional (Priority: P1) 🎯 MVP

**Goal**: Tokens aplicados en el cromo compartido y las pantallas de acceso;
base visual verificable sin cambiar navegación.

**Independent Test**: Abrir `/login` y `/registro` y verificar fondo crema,
acción principal verde, Jakarta/Inter e insignias con colores definidos.

### Tests for User Story 1 ⚠️

> Escribir primero y confirmar que fallan antes de implementar

- [x]  [P] [US1] Tests de identidad en `frontend/src/pages/clientes/Login.test.tsx` (fondo crema, botón primario verde, tipografías aplicadas)

### Implementation for User Story 1

- [x]  [US1] Migrar `frontend/src/pages/clientes/Login.tsx` y `frontend/src/pages/clientes/Registro.tsx` de `slate-*` a tokens + componentes `ui/` (misma estructura; FR-001 a FR-005)
- [x]  [US1] Migrar el encabezado y contenido de `frontend/src/components/layout/LayoutPorRol.tsx` a tokens manteniendo los tabs actuales (la navegación nueva es US2; FR-001, FR-003)

**Checkpoint**: US1 funcional y probable de forma independiente

---

## Phase 4: User Story 2 - Navegación por rol (Priority: P1)

**Goal**: Drawer lateral + bottom bar por rol con contadores; 2 rutas nuevas;
guardas intactas.

**Independent Test**: Entrar con cada rol, recorrer drawer/bottom bar,
verificar contadores y confirmar que las rutas ajenas siguen denegadas.

### Tests for User Story 2 ⚠️

> Escribir primero y confirmar que fallan antes de implementar

- [x]  [P] [US2] Ampliar `frontend/src/routes/rutas.test.tsx` (drawer por rol, rutas nuevas `/admin` y `/caja/entregas`, guardas intactas, aviso de listo en navegación del cliente)

### Implementation for User Story 2

- [x]  [US2] Reescribir `frontend/src/components/layout/LayoutPorRol.tsx` con drawer (overlay móvil, fijo 16rem en escritorio, perfil, Cerrar sesión) + bottom bar móvil por rol (cliente: Menú/Mis pedidos; caja: Caja/Entregas ≥ 56 px) + sondeo de `GET /api/avisos` para el aviso de listo del cliente (contrato `contracts/navegacion-ui.md`; FR-006)
- [x]  [US2] Agregar rutas `/admin` (`frontend/src/pages/admin/InicioAdmin.tsx`, placeholder que US6 completa) y `/caja/entregas` (`frontend/src/pages/caja/Entregas.tsx`, placeholder que US4 completa) en `frontend/src/routes/AppRouter.tsx` dentro de sus grupos `RutaPorRol`, y actualizar `INICIO_POR_ROL` en `frontend/src/lib/sesion.ts` (admin → `/admin`) (FR-011, FR-013)

**Checkpoint**: US1 y US2 funcionan de forma independiente — base navegable con identidad

---

## Phase 5: User Story 3 - App del cliente (Priority: P2)

**Goal**: Menú, confirmación, pago y mis pedidos con el diseño de `diseño-cliente.md`.

**Independent Test**: Completar menú → pedido → pago → seguimiento solo con lo visible en pantalla.

### Tests for User Story 3 ⚠️

- [x]  [P] [US3] Tests de `frontend/src/components/menu/TarjetaPlatillo.tsx` en `frontend/src/components/menu/TarjetaPlatillo.test.tsx` (stepper 44 px, Especial espresso, no disponible atenuado)

### Implementation for User Story 3

- [x]  [US3] Rediseñar `frontend/src/pages/clientes/Menu.tsx` (buscador en vivo, chips por categorías del catálogo, barra flotante con total) + migrar `frontend/src/components/menu/TarjetaPlatillo.tsx` a tokens (FR-004, FR-007)
- [x]  [US3] Rediseñar `frontend/src/pages/clientes/ConfirmarPedido.tsx` (desglose, total grande, regla de 10 min inline con hora mínima, leyenda de no captura de tarjeta) con componentes `ui/` (FR-008, FR-009)
- [x]  [US3] Rediseñar `frontend/src/pages/clientes/MisPedidos.tsx` (encabezado con conteo de activos, tarjeta con borde `status-ready` para Listo, CTA Nuevo pedido, estados vacío/error con `Reintentar`) reutilizando `BadgeEstado` (FR-010, FR-014)

**Checkpoint**: US3 funcional de forma independiente

---

## Phase 6: User Story 4 - Caja (Priority: P2)

**Goal**: Panel de caja con captura, cobro en un paso y ruta de entregas según `diseño-operativo.md`.

**Independent Test**: Capturar y cobrar en un paso y entregar un listo midiendo pasos y áreas táctiles.

### Implementation for User Story 4

- [ ] T017 [US4] Rediseñar `frontend/src/pages/caja/Caja.tsx` (acciones rápidas, catálogo con búsqueda/categorías/stepper, barra flotante de cobro, resumen con CTA único Registrar y cobrar, resultado con folio) con tokens y componentes `ui/` (FR-005, FR-011)
- [ ] T018 [US4] Implementar `frontend/src/pages/caja/Entregas.tsx` (ruta `/caja/entregas`: lista por llegada, folio mono 20px+, Entregar/Cancelar 44px, vacío "¡Todo está al día!", refresco de contador) (edita archivo de T012; secuencial; FR-011, FR-014)

**Checkpoint**: US4 funcional de forma independiente

---

## Phase 7: User Story 5 - Cocina KDS (Priority: P2)

**Goal**: Tablero de cocina de alto contraste con 2 columnas en escritorio según `diseño-cocina.md`.

**Independent Test**: Con pedidos de ambos orígenes, verificar vista única ordenada, legibilidad y avance de un toque.

### Implementation for User Story 5

- [ ] T019 [US5] Rediseñar `frontend/src/pages/cocina/Cocina.tsx` (tarjeta KDS: folio heading 800, chip de origen, "recoge HH:MM", transcurrido con "¡Retrasado!", CTA único 48px, Listo sin CTA; grid 2 columnas por estado en escritorio, lista única en móvil; conserva sondeo 4 s con "act. hace X s" y "Sin conexión") con tokens (FR-004, FR-005, FR-012, FR-014)

**Checkpoint**: US5 funcional de forma independiente

---

## Phase 8: User Story 6 - Administración (Priority: P3)

**Goal**: Landing de admin y CRUD con filas altas según `diseño-operativo.md`, sin cambiar funcionalidad.

**Independent Test**: Recorrer inicio, usuarios, platillos y menú verificando conteos y mismos flujos.

### Implementation for User Story 6

- [ ] T020 [US6] Implementar `frontend/src/pages/admin/InicioAdmin.tsx` (ruta `/admin`: saludo, 3 accesos rápidos con conteos de endpoints existentes, resumen del menú de hoy con Especial/disponibilidad) (edita archivo de T012; secuencial; FR-013)
- [ ] T021 [P] [US6] Migrar `frontend/src/pages/admin/Usuarios.tsx`, `frontend/src/pages/admin/Platillos.tsx` y `frontend/src/pages/admin/MenuDelDia.tsx` a tokens (filas ≥ 56 px, CTA fijos, buscadores/chips existentes, mismos formularios) (FR-013, FR-014)

**Checkpoint**: Todas las historias funcionalmente independientes

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Verde total, validación del quickstart y revisión de alcance.

- [ ] T022 Verificar que `npm run lint`, `npm run typecheck` y `npm test` pasan en `frontend/` (y `npm test` + `npm run typecheck` en `backend/` como regresión), con áreas ≥ 44 px y contraste en las 4 áreas de rol
- [ ] T023 Ejecutar la validación de `specs/007-ui-redesign/quickstart.md` (5 escenarios, demo por rol ante la patrocinadora)
- [ ] T024 Revisar contra FR-016 que ningún elemento [Fuera de alcance] (fotos, push/SMS, historial de ventas, métricas, métodos de pago, descuentos, favoritos/reseñas, configuración) quedó implementado

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — iniciar de inmediato
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA las historias
- **User Stories 1–2 (P1)**: tras Foundational; US2 antes que US3–US6 para demo navegable (pueden avanzar en paralelo una vez definido el contrato de navegación)
- **User Stories 3–5 (P2)**: tras Foundational; independientes entre sí (archivos distintos)
- **User Story 6 (P3)**: tras Foundational; T020 edita el placeholder de T012
- **Polish (Phase 9)**: tras completar las historias deseadas

### Within Each User Story

- Tests primero y en rojo antes de implementar
- Componentes → páginas → rutas → verificación
- Completar una historia antes de pasar a la siguiente

### Parallel Opportunities

- Setup: T001, T002 en paralelo (archivos distintos; T002 no depende del registro de fuentes)
- Foundational: T003, T004, T005, T006 en paralelo
- US1: T007 + T008/T009 (test primero, luego implementación)
- US2: T010, luego T011/T012 (T012 edita AppRouter; T011 LayoutPorRol; paralelizables tras el rojo)
- US3: T013, luego T014/T015/T016 en paralelo (archivos distintos)
- US6: T021 en paralelo con US3–US5 (archivos distintos)
- **Archivos compartidos (secuenciales)**: `AppRouter.tsx` (T012), `LayoutPorRol.tsx` (T009 → T011), `Entregas.tsx` (T012 → T018), `InicioAdmin.tsx` (T012 → T020), `MisPedidos.tsx` (T016)

---

## Implementation Strategy

### MVP First (User Stories 1–2)

1. Completar Phase 1: Setup (fuentes + tokens)
2. Completar Phase 2: Foundational (componentes `ui/`, BLOQUEANTE)
3. Completar US1 (identidad en acceso y cromo) + US2 (navegación)
4. **STOP y VALIDAR**: base navegable con identidad y guardas verdes
5. Demo si está listo

### Incremental Delivery

1. Setup + Foundational → base lista (tokens + componentes)
2. US1 + US2 → probar → demo (navegación con identidad)
3. US3 → probar → demo (cliente)
4. US4 + US5 → probar → demo (operación caja/cocina)
5. US6 → probar → demo (admin)
6. Polish → verde total, quickstart y revisión FR-016

---

## Notes

- `[P]` = archivos distintos, sin dependencias
- `[Story]` mapea la tarea a su historia (US1–US6 de `spec.md`)
- Cada historia debe ser completable y probable de forma independiente
- Verificar que los tests fallan antes de implementar
- Commit tras cada tarea o grupo lógico, en español
- Esta feature **no** añade endpoints, tablas ni migraciones (solo `frontend/`)
- Evitar: tareas vagas, conflictos sobre el mismo archivo, dependencias entre historias que rompan independencia
