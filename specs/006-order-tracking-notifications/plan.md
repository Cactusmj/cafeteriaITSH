# Implementation Plan: Sprint 5 — Seguimiento, notificaciones y pulido

**Branch**: `006-order-tracking-notifications` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-order-tracking-notifications/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Cierre del MVP sobre los sprints 1–4: el cliente consulta sus pedidos con
estado vigente en `/mis-pedidos`, recibe el aviso de listo mediante un módulo
de notificaciones separado (en-app como mínimo, externo opcional), y las
pantallas reciben el pulido básico de `design/DESIGN.md` sin cambiar
navegación ni layouts. Una migración aditiva pequeña (`004`) amplía el
catálogo de canal y el estado de lectura de `notificacion`; el resto es API
REST, Vitest y frontend.

## Technical Context

**Language/Version**: TypeScript estricto en backend y frontend; Node.js LTS para el backend.

**Primary Dependencies**: Backend: Express, `mysql2`, `zod` (ya instalados). Frontend: React 19, `react-router-dom`, Tailwind CSS, Vitest + Testing Library (ya instalados). Sin dependencias nuevas (ni siquiera fuentes: el pulido usa las familias del sistema hasta la spec de rediseño).

**Storage**: MySQL 8.0.16+, base `cafeteria_itsh`. Reutiliza `pedido`, `pedido_detalle`, `pago`; migración única `migrations/004_avisos_app.sql` (aditiva: amplía los CHECK de `canal` con `'app'` y de `estado_envio` con `'vista'` en `notificacion`).

**Testing**: Vitest. Backend: servicio de avisos con `pool` simulado, lista propia y permisos con servidor efímero. Frontend: ampliación de la prueba de rutas (`/mis-pedidos`).

**Target Platform**: Aplicación web; navegadores modernos en móvil y computadora; servidor Node.js local.

**Project Type**: Aplicación web (backend + frontend en el mismo repositorio).

**Performance Goals**: Seguimiento y avisos responden sin esperas perceptibles; una consulta por lista; el aviso se genera en la misma operación del cambio a "Listo".

**Constraints**: Módulo de avisos separado de pedidos; en-app siempre aunque falle lo externo; solo el dueño ve sus pedidos/avisos; validación zod; mensajes claros; pulido acotado (sin cambiar navegación/layouts ni implementar [Fuera de alcance]); áreas ≥ 44 px.

**Scale/Scope**: MVP de una sola cafetería. Este sprint: 2 historias (US1 seguimiento, US2 avisos) + pulido transversal, 13 requisitos, 3 endpoints nuevos (`GET /api/mis-pedidos`, `GET /api/avisos`, `PATCH /api/avisos/vistos`), 1 pantalla reescrita (`MisPedidos.tsx`), 1 migración aditiva.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Evidencia |
|---|---|---|
| I. Aplicación única con rutas protegidas por rol | ✅ | `/mis-pedidos` y avisos en el área de clientes; API con `autenticar` (+ dueño o admin). |
| II. TypeScript estricto y arquitectura simple | ✅ | Módulo `services/avisos/` separado pero simple; SQL con `mysql2`; sin dependencias nuevas. |
| III. Seguridad y manejo de credenciales (NO NEGOCIABLE) | ✅ | Sin secretos nuevos (`NOTIFICATION_API_KEY` solo se lee si existe; en-app no la necesita); zod; errores sin detalles. |
| IV. Flujo de pedidos con estados y anticipación | ✅ | El aviso nace solo del paso a "Listo"; sin cambios al flujo. |
| V. Calidad verificable con pruebas | ✅ | Vitest para avisos, seguimiento y permisos; regresión de pagos/estados. |

**Resultado**: PASA sin violaciones. No se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/006-order-tracking-notifications/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── avisos-api.md
├── checklists/
│   └── requirements.md  # de /speckit.specify
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── routes/            # + avisos.routes.ts (GET /api/avisos, PATCH /api/avisos/vistos, GET /api/mis-pedidos)
│   ├── controllers/       # + avisos.controller.ts
│   ├── services/          # + avisos/avisos.service.ts (módulo separado) + proveedor externo opcional
│   ├── schemas/           # (sin esquemas nuevos: sin cuerpo de entrada)
│   └── app.ts             # monta /api/avisos y /api/mis-pedidos
├── tests/                 # + avisos.service.test.ts, mis-pedidos.test.ts, permisos.avisos.test.ts
└── package.json

frontend/
├── src/
│   ├── pages/clientes/    # MisPedidos.tsx pasa de placeholder a seguimiento real
│   ├── components/        # + BadgeEstado.tsx (colores de design/DESIGN.md)
│   ├── routes/            # (sin rutas nuevas)
│   └── lib/               # api.ts (existente)
└── package.json

migrations/
└── 004_avisos_app.sql     # única migración: canal 'app' + estado 'vista'
```

**Structure Decision**: Se conserva la estructura de dos paquetes; el módulo
de avisos es un directorio propio (`services/avisos/`) para cumplir la
separación exigida, sin paquetes nuevos.

## Complexity Tracking

> Sin violaciones de la constitución; no aplica.
