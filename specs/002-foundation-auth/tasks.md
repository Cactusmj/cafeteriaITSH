---

description: "Task list for Sprint 1 — Fundamentos y autenticación"
---

# Tasks: Sprint 1 — Fundamentos y autenticación

**Input**: Design documents from `/specs/002-foundation-auth/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidos y **requeridos** por el Principio V de la constitución
(deben cubrir autenticación, autorización y gestión de usuarios).

**Organization**: Tareas agrupadas por historia de usuario para permitir
implementación y prueba independientes.

> **Mapeo de historias**: `[US1]` = "Autenticación y acceso por rol" (US1 de la
> spec maestra 001). `[US2]` = "Gestión de usuarios operativos" (**US8** de la
> spec maestra 001; `docs/sprints.md` la llama "US6").

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: Historia a la que pertenece (US1, US2)
- Rutas de archivo exactas en cada tarea

## Path Conventions

- Backend: `backend/src/`, `backend/tests/`
- Frontend: `frontend/src/`
- Base de datos existente: `migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización de la estructura y herramientas del proyecto

- [x] T001 Crear estructura de carpetas del backend en `backend/src/{config,routes,controllers,services,middlewares,schemas,utils}` y `backend/tests`
- [x] T002 [P] Configurar `backend/package.json` con scripts `dev`, `build`, `start`, `test`, `typecheck`, `seed:usuarios` (`node scripts/sembrar-usuarios.mjs`) y dependencias (`express`, `jsonwebtoken`, `bcrypt`, `mysql2`, `dotenv`, `zod`) más dev (`typescript`, `vitest`, `tsx`, `@types/express`, `@types/node`, `@types/jsonwebtoken`, `@types/bcrypt`)
- [x] T003 [P] Configurar TypeScript estricto en `backend/tsconfig.json` (`strict: true`, `noUncheckedIndexedAccess`)
- [x] T004 [P] Configurar Vitest en `backend/vitest.config.ts`
- [x] T005 [P] Añadir al frontend Tailwind CSS y dependencias (`react-router-dom`, `tailwindcss`, `vitest`, `@testing-library/react`, `jsdom`) en `frontend/package.json`, y crear `frontend/.env.example` con `VITE_API_URL`
- [x] T006 [P] Configurar Vitest + Testing Library y el script `typecheck` en `frontend/vite.config.ts` y `frontend/package.json`
- [x] T007 [P] Crear estructura de carpetas del frontend: `frontend/src/{pages/{admin,caja,cocina,clientes},components/{ui,layout},routes,lib}`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura núcleo que debe estar lista antes de cualquier historia

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta terminar esta fase

- [x] T008 Cargar variables de entorno en `backend/src/config/env.ts` y crear `backend/.env.example` con `DATABASE_URL` (o `DB_HOST/DB_USER/DB_PASSWORD/DB_NAME`), `JWT_SECRET`, `SEED_PASSWORD`, `NODE_ENV`, `PORT`
- [x] T009 Crear el pool de conexión MySQL en `backend/src/config/db.ts` usando `mysql2/promise`
- [x] T010 [P] Crear utilerías de errores en `backend/src/utils/errores.ts` (clase `ErrorAplicacion` con código HTTP y `codigo`, más manejador de errores)
- [x] T011 [P] Crear utilería de hash en `backend/src/utils/hash.ts` (bcrypt: `hashear`, `verificar`)
- [x] T012 [P] Crear utilería JWT en `backend/src/utils/jwt.ts` (`firmar`, `verificar` con HS256)
- [x] T013 Crear middleware `autenticar` en `backend/src/middlewares/autenticar.ts` (valida `Authorization: Bearer`, adjunta `req.usuario`)
- [x] T014 Crear middleware `autorizarRol` en `backend/src/middlewares/autorizarRol.ts` (recibe roles permitidos; responde 403)
- [x] T015 Crear la app Express en `backend/src/app.ts` y el arranque en `backend/src/server.ts` (montaje de rutas base, manejador de errores, 404)
- [x] T016 [P] Crear el cliente HTTP en `frontend/src/lib/api.ts` (usa `VITE_API_URL`, adjunta el token y centraliza errores)
- [x] T017 [P] Crear la gestión de sesión en `frontend/src/lib/sesion.ts` (guardar/leer/limpiar token y usuario en `localStorage`)
- [x] T018 Crear `frontend/src/lib/ContextoSesion.tsx` (proveedor y hook de sesión)
- [x] T019 Crear `RutaProtegida` y `RutaPorRol` en `frontend/src/routes/RutaProtegida.tsx` y `frontend/src/routes/RutaPorRol.tsx`
- [x] T020 Crear el router base en `frontend/src/routes/AppRouter.tsx` con las rutas `/login`, `/admin`, `/caja`, `/cocina`, `/menu`, `/mis-pedidos` y `frontend/src/components/layout/LayoutPorRol.tsx`
- [x] T021 [P] Crear `backend/scripts/sembrar-usuarios.mjs` (lee `SEED_PASSWORD` del entorno, hashea con bcrypt, idempotente por correo) y `docs/seeds.md`; ejecutar `npm run seed:usuarios` y verificar que el administrador puede iniciar sesión
- [x] T022 [P] Crear utilería de logging en `backend/src/utils/logger.ts` (registra errores sin datos sensibles: nunca contraseñas ni tokens)

**Checkpoint**: Fundación lista — las historias pueden comenzar

---

## Phase 3: User Story 1 - Autenticación y acceso por rol (Priority: P1) 🎯 MVP

**Goal**: Registro de clientes e inicio de sesión con JWT; rutas protegidas por sesión y rol.

**Independent Test**: Registrar un usuario, iniciar sesión y verificar que llega a su módulo y que el acceso a rutas de otros roles se deniega.

### Tests for User Story 1 ⚠️

> Escribir primero y confirmar que fallan antes de implementar

- [x] T023 [P] [US1] Test unitario de `backend/src/utils/jwt.ts` en `backend/tests/jwt.test.ts` (firmar/verificar, token expirado, firma inválida)
- [x] T024 [P] [US1] Test unitario de autenticación en `backend/tests/auth.service.test.ts` (registro, login correcto, credenciales inválidas, cuenta inactiva, contraseña < 8 rechazada)
- [x] T025 [P] [US1] Test de guardas de ruta en `frontend/src/routes/rutas.test.tsx` (sin sesión → `/login`; rol cruzado → denegado)

### Implementation for User Story 1

- [x] T026 [US1] Definir esquemas zod de `registro` y `login` en `backend/src/schemas/auth.schemas.ts` (contraseña mínima de 8 caracteres)
- [x] T027 [US1] Implementar `backend/src/services/auth.service.ts` (registrar cliente con rol `usuario`, iniciar sesión verificando bcrypt y `activo`, obtener usuario por id)
- [x] T028 [US1] Implementar `backend/src/controllers/auth.controller.ts`
- [x] T029 [US1] Implementar `backend/src/routes/auth.routes.ts` (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`) y montarlas en `backend/src/app.ts` (edita `app.ts`; debe ir antes/después de T038, nunca en paralelo)
- [x] T030 [US1] Implementar la página de login en `frontend/src/pages/clientes/Login.tsx`
- [x] T031 [US1] Implementar la página de registro en `frontend/src/pages/clientes/Registro.tsx`
- [x] T032 [US1] Conectar login/registro con `frontend/src/lib/api.ts` y `ContextoSesion`, y redirigir por rol en `frontend/src/routes/AppRouter.tsx`

**Checkpoint**: US1 funcional y probable de forma independiente

---

## Phase 4: User Story 2 - Gestión de usuarios operativos (Priority: P2)

**Goal**: El administrador crea, edita y deshabilita cuentas de cajeros y cocineros.

**Independent Test**: Crear un cajero desde `/admin`, verificar que inicia sesión; editarlo y deshabilitarlo y verificar que el acceso cambia.

### Tests for User Story 2 ⚠️

- [x] T033 [P] [US2] Test unitario del servicio de usuarios en `backend/tests/usuarios.service.test.ts` (crear solo `cajero`/`cocinero`, correo duplicado, editar, cambiar estado, no deshabilitar la propia cuenta)
- [x] T034 [P] [US2] Test del middleware de autorización en `backend/tests/autorizarRol.test.ts` (permite rol correcto, responde 403 con otro rol, 401 sin sesión)

### Implementation for User Story 2

- [x] T035 [US2] Definir esquemas zod de usuarios en `backend/src/schemas/usuarios.schemas.ts` (rol restringido a `cajero|cocinero`; contraseña mínima de 8 caracteres)
- [x] T036 [US2] Implementar `backend/src/services/usuarios.service.ts` (listar con filtro por rol, crear, editar, cambiar `activo`)
- [x] T037 [US2] Implementar `backend/src/controllers/usuarios.controller.ts`
- [x] T038 [US2] Implementar `backend/src/routes/usuarios.routes.ts` con `autenticar` + `autorizarRol('administrador')` y montarlas en `backend/src/app.ts` (edita `app.ts`; secuencial respecto a T029)
- [x] T039 [US2] Implementar la página de gestión de usuarios en `frontend/src/pages/admin/Usuarios.tsx` (listar, alta, edición, habilitar/deshabilitar, mensajes de conflicto)

**Checkpoint**: US1 y US2 funcionan de forma independiente

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a ambas historias

- [x] T040 [P] Crear `.gitignore` raíz (`node_modules/`, `dist/`, `.env*`, `coverage/`) y confirmar que `backend/.env` no se versiona
- [x] T041 [P] Pruebas de permisos por rol (401 sin token, 403 con rol incorrecto) en `backend/tests/permisos.test.ts`
- [ ] T042 Verificar que `npm test` y `npm run typecheck` pasan en `backend/` y `frontend/`, y comprobar la responsividad en móvil y escritorio con áreas táctiles ≥ 44 px en `/caja` y `/cocina`
- [ ] T043 Ejecutar la validación de `specs/002-foundation-auth/quickstart.md` (incluye la comprobación de responsividad)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — iniciar de inmediato
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA ambas historias
- **User Story 1 (Phase 3)**: tras Foundational
- **User Story 2 (Phase 4)**: tras Foundational (puede ir en paralelo con US1 si hay equipo)
- **Polish (Phase 5)**: tras completar las historias deseadas

### User Story Dependencies

- **US1 (P1)**: sin dependencia de otras historias (es la base de seguridad)
- **US2 (P2)**: usa la infraestructura de autenticación/autorización de US1; probarse de forma independiente

### Within Each User Story

- Tests primero y en rojo antes de implementar
- Schemas → servicios → controladores → rutas → UI
- Completar una historia antes de pasar a la siguiente

### Parallel Opportunities

- Setup: T002–T007 en paralelo (archivos distintos)
- Foundational: T010, T011, T012, T016, T017, T021, T022 en paralelo
- US1: T023, T024, T025 en paralelo (tests); luego implementación en orden
- US2: T033, T034 en paralelo; luego implementación en orden
- US1 y US2 pueden trabajarse en paralelo por distintos desarrolladores tras la Fase 2, **excepto** T029 y T038, que editan el mismo `backend/src/app.ts` y deben ejecutarse de forma secuencial

---

## Parallel Example: User Story 1

```text
# Lanzar los tests de US1 juntos (deben fallar primero):
T023 jwt.test.ts
T024 auth.service.test.ts
T025 rutas.test.tsx

# Lanzar utilerías base juntas (Fase 2):
T010 errores.ts
T011 hash.ts
T012 jwt.ts
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (BLOQUEANTE)
3. Completar Fase 3: US1
4. **STOP y VALIDAR**: probar US1 de forma independiente (login por rol, ruta protegida)
5. Demo si está listo

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → probar → demo (login por rol y rutas protegidas)
3. US2 → probar → demo (administrador gestiona cajeros y cocineros)
4. Polish → pruebas de permisos, typecheck y validación de quickstart

---

## Notes

- `[P]` = archivos distintos, sin dependencias
- `[Story]` mapea la tarea a su historia (US1, US2=US8 maestra)
- Cada historia debe ser completable y probable de forma independiente
- Verificar que los tests fallan antes de implementar
- Commit tras cada tarea o grupo lógico (cuando el repositorio Git esté inicializado)
- Evitar: tareas vagas, conflictos sobre el mismo archivo, dependencias entre historias
