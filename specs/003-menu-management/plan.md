# Implementation Plan: Sprint 2 — Gestión de menú y consulta de menú

**Branch**: `003-menu-management` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-menu-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Agregar el dominio del menú sobre la base ya construida en el sprint 1: el
administrador gestiona el catálogo de platillos y publica el menú de cada día
con precio, disponibilidad y especiales; los clientes consultan el menú del día
de forma rápida y responsiva. El esquema MySQL ya contiene las tablas
`platillo` y `menu_dia` (creadas en `migrations/001_crear_esquema_mysql.sql`),
por lo que este sprint no añade migraciones: solo API REST, validación con zod,
pruebas con Vitest y pantallas en `/admin` y `/menu`. Se reutilizan
autenticación, autorización por rol y el cliente HTTP del frontend del
sprint 1.

## Technical Context

**Language/Version**: TypeScript en backend y frontend (`frontend/package.json` fija `typescript ~6.0.2`); Node.js LTS para el backend.

**Primary Dependencies**: Backend: Express, `mysql2`, `zod` (ya instalados). Frontend: React 19, `react-router-dom`, Tailwind CSS, Vitest + Testing Library (ya instalados). Sin dependencias nuevas.

**Storage**: MySQL 8.0.16+ (probado en 9.6), base `cafeteria_itsh`; tablas `platillo` y `menu_dia` ya creadas en `migrations/001_crear_esquema_mysql.sql` (no se modifica el esquema).

**Testing**: Vitest (backend y frontend). Backend con pruebas unitarias de los servicios de platillos y menú (pool simulado, patrón del sprint 1); frontend con pruebas de guardas existentes.

**Target Platform**: Aplicación web; navegadores modernos en móvil y computadora; servidor Node.js local.

**Project Type**: Aplicación web (backend + frontend en el mismo repositorio).

**Performance Goals**: La consulta del menú del día debe responder en pocos segundos incluso en horario de receso; se resuelve con una sola consulta por fecha (índice `idx_menu_dia_fecha`).

**Constraints**: Solo el rol administrador gestiona platillos y menú (autorización en el servidor); validación de toda entrada con zod (nombre 1–100, descripción ≤ 500, categoría en lista fija, precio > 0); sin secretos en el repositorio; mensajes de error claros sin detalles internos; áreas táctiles ≥ 44 px en operaciones frecuentes de `/admin` y `/menu`.

**Scale/Scope**: MVP de una sola cafetería; decenas de usuarios concurrentes. Este sprint: 2 historias (US2 gestión de menú, US3 consulta del menú), 13 requisitos funcionales, 2 pantallas nuevas en `/admin` y la consulta pública en `/menu`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Evidencia |
|---|---|---|
| I. Aplicación única con rutas protegidas por rol | ✅ | `/admin` exige rol administrador (guarda existente); `/menu` es la ruta pública de clientes prevista por la constitución. |
| II. TypeScript estricto y arquitectura simple | ✅ | Servicios y controladores TS en la estructura existente; consultas con `mysql2`; sin dependencias nuevas. |
| III. Seguridad y manejo de credenciales (NO NEGOCIABLE) | ✅ | `autenticar` + `autorizarRol('administrador')` en toda la API de gestión; zod valida y sanitiza entrada; errores sin detalles internos. |
| IV. Flujo de pedidos con estados y anticipación | N/A en este sprint | No se implementan pedidos; el menú publicado es el insumo del sprint 3. |
| V. Calidad verificable con pruebas | ✅ | Vitest para la lógica de platillos y menú (alta, edición, disponibilidad, especiales, validación de precios y duplicados). |

**Resultado**: PASA sin violaciones. No se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-menu-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── platillos-api.md
│   └── menu-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/            # env, db, roles (existente) + categorias.ts (lista fija)
│   ├── routes/            # + platillos.routes.ts, menu.routes.ts
│   ├── controllers/       # + platillos.controller.ts, menu.controller.ts
│   ├── services/          # + platillos.service.ts, menu.service.ts
│   ├── middlewares/       # autenticar, autorizarRol (existente)
│   ├── schemas/           # + platillos.schemas.ts, menu.schemas.ts (zod)
│   └── app.ts             # monta las rutas nuevas
├── tests/                 # + platillos.service.test.ts, menu.service.test.ts
└── package.json

frontend/
├── src/
│   ├── pages/
│   │   ├── admin/         # + Platillos.tsx, MenuDelDia.tsx (Usuarios.tsx ya existe)
│   │   └── clientes/      # Menu.tsx pasa de placeholder a consulta real
│   ├── components/        # + componentes de tarjeta/etiqueta de menú
│   ├── routes/            # AppRouter agrega /admin/platillos y /admin/menu
│   └── lib/               # api.ts (existente, se reutiliza)
└── package.json

migrations/                # sin cambios: 001 ya crea platillo y menu_dia
```

**Structure Decision**: Se conserva la estructura de dos paquetes
(`backend/` y `frontend/`) del sprint 1; el nuevo dominio se agrega en los
mismos directorios (`services`, `controllers`, `routes`, `schemas`, `pages`).
No se crea `database/` porque las migraciones viven en `migrations/` desde el
inicio del proyecto y este sprint no modifica el esquema.

## Complexity Tracking

> Sin violaciones de la constitución; no aplica.
