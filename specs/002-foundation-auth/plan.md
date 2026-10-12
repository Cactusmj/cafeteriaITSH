# Implementation Plan: Sprint 1 — Fundamentos y autenticación

**Branch**: `002-foundation-auth` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-foundation-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Construir la base técnica y de seguridad del Sistema de Pedidos Anticipados —
Cafetería ITSH: esquema inicial de usuarios y roles en MySQL (ya provisto por
`migrations/`), API REST de autenticación con JWT y contraseñas con hash, y el
esqueleto de la aplicación única de React con rutas protegidas por rol. El
administrador gestiona cuentas operativas (cajeros y cocineros). El enfoque
técnico sigue la constitución: TypeScript estricto, Express, MySQL sin ORM,
Tailwind + shadcn/ui y pruebas con Vitest.

## Technical Context

**Language/Version**: TypeScript en backend y frontend (el `frontend/package.json` ya fija `typescript ~6.0.2`); Node.js LTS para el backend.

**Primary Dependencies**: Backend: Express, `jsonwebtoken`, `bcrypt`, `mysql2`, `dotenv`, `zod` (validación). Frontend: React 19, `react-router-dom`, Tailwind CSS, shadcn/ui (componentes copiados y personalizados), Vitest + Testing Library.

**Storage**: MySQL 8.0.16+ (probado en 9.6), base `cafeteria_itsh`, esquema en `migrations/001_crear_esquema_mysql.sql` y datos en `migrations/002_seed_inicial_mysql.sql`. Acceso con `mysql2` (consultas parametrizadas), sin ORM.

**Testing**: Vitest (backend y frontend). Backend con pruebas unitarias de servicios y de middleware de autorización; frontend con pruebas de guardas de ruta y de funciones de sesión.

**Target Platform**: Aplicación web; navegadores modernos en móvil y computadora; servidor Node.js local/Docker.

**Project Type**: Aplicación web (backend + frontend en el mismo repositorio).

**Performance Goals**: Respuesta de login y consultas de menú ágiles en horarios de receso; el sistema debe servir sin degradación perceptible. Objetivo directo de este sprint: rutas protegidas resueltas al instante (validación local de sesión + verificación de token en el servidor).

**Constraints**: No guardar credenciales ni tokens en el repositorio; usar variables de entorno (`DATABASE_URL`, `JWT_SECRET`, `SEED_PASSWORD`, `NODE_ENV`, `PORT`). Las cuentas base se siembran con `backend/scripts/sembrar-usuarios.mjs` leyendo `SEED_PASSWORD`. No exponer información interna en errores. Validar y sanitizar toda entrada. Área táctil ≥ 44 px en pantallas de caja y cocina (aplica al layout desde el inicio).

**Scale/Scope**: MVP de una sola cafetería; decenas de usuarios concurrentes. Este sprint: 2 historias (US1 autenticación, US8 gestión de usuarios operativos), 13 requisitos funcionales, 6 rutas frontend protegidas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Evidencia |
|---|---|---|
| I. Aplicación única con rutas protegidas por rol | ✅ | Una app React con `/login`, `/admin`, `/caja`, `/cocina`, `/menu`, `/mis-pedidos`; guardas por sesión y rol. |
| II. TypeScript estricto y arquitectura simple | ✅ | TS en backend y frontend; Express; MySQL con `mysql2`; estructura por funcionalidad sin capas extra. |
| III. Seguridad y manejo de credenciales (NO NEGOCIABLE) | ✅ | JWT + bcrypt; secretos por variables de entorno; validación/sanitización; sin datos de tarjeta. |
| IV. Flujo de pedidos con estados y anticipación | N/A en este sprint | No se implementan pedidos todavía; se prepara la base (roles/estados ya sembrados). |
| V. Calidad verificable con pruebas | ✅ | Vitest para autenticación, autorización y gestión de usuarios. |

**Resultado**: PASA sin violaciones. No se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-foundation-auth/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/            # carga de .env y pool de conexión MySQL
│   ├── routes/            # auth.routes.ts, usuarios.routes.ts
│   ├── controllers/       # auth.controller.ts, usuarios.controller.ts
│   ├── services/          # auth.service.ts, usuarios.service.ts
│   ├── middlewares/       # autenticar.ts (JWT), autorizarRol.ts
│   ├── schemas/           # validación con zod (login, registro, usuarios)
│   ├── utils/             # hashing bcrypt, firma/verificación JWT, errores, logging
│   └── app.ts             # composición de Express
├── scripts/               # semillas de datos (sembrar-usuarios.mjs)
├── tests/                 # pruebas Vitest (servicios y middlewares)
└── package.json

frontend/
├── src/
│   ├── pages/
│   │   ├── admin/         # panel y gestión de usuarios operativos
│   │   ├── caja/          # layout del cajero (placeholder)
│   │   ├── cocina/        # layout del cocinero (placeholder)
│   │   └── clientes/      # login, registro, menú y mis-pedidos (placeholder)
│   ├── components/
│   │   ├── ui/            # componentes shadcn/ui personalizados
│   │   └── layout/        # LayoutPorRol
│   ├── routes/            # Router, RutaProtegida, RutaPorRol
│   ├── lib/               # cliente HTTP y sesión (token)
│   └── main.tsx
└── package.json

migrations/
├── 001_crear_esquema_mysql.sql
└── 002_seed_inicial_mysql.sql
```

**Structure Decision**: Aplicación web con dos paquetes en la raíz (`backend/` y
`frontend/`), consistente con `docs/reglas.md` §17 y la constitución. El esquema
de base de datos ya vive en `migrations/`; este sprint no añade un framework de
migraciones formal, solo consume los scripts existentes.

## Complexity Tracking

> Sin violaciones de la constitución; no aplica.
