# Implementation Plan: Sprint 3 — Pedido anticipado y pago

**Branch**: `004-advance-orders-payment` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-advance-orders-payment/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Completar el flujo del cliente sobre la base de los sprints 1 y 2: el alumno
o docente selecciona platillos del menú de hoy, confirma el pedido con un
horario de recolección a ≥ 10 minutos (nace "Pendiente" con folio), y paga en
línea mediante un proveedor de pago externo en modo sandbox; el pago confirmado
pasa el pedido a "Pagado" con registro mínimo de la transacción (sin datos de
tarjeta). El esquema MySQL ya contiene `pedido`, `pedido_detalle`, `pago`,
`pedido_estado_historial` y las tablas de estados; este sprint solo añade una
migración aditiva mínima (clave de idempotencia en `pedido`) y construye API
REST (zod + mysql2), pruebas Vitest y el flujo de cliente en `/menu` →
`/confirmar-pedido`.

## Technical Context

**Language/Version**: TypeScript estricto en backend y frontend; Node.js LTS para el backend.

**Primary Dependencies**: Backend: Express, `mysql2`, `zod` (ya instalados). Frontend: React 19, `react-router-dom`, Tailwind CSS, Vitest + Testing Library (ya instalados). Sin dependencias nuevas: el proveedor de pago se abstrae en una interfaz propia y el modo sandbox usa únicamente utilidades del runtime (`crypto.randomUUID`).

**Storage**: MySQL 8.0.16+ (probado en 9.6), base `cafeteria_itsh`. Tablas existentes: `pedido`, `pedido_detalle`, `pago`, `pedido_estado_historial`, `estado_pedido`, `transicion_estado` (creadas en `migrations/001`, sembradas en `002`). Migración única: `migrations/003_clave_idempotencia_pedido.sql` (columna `clave_idempotencia VARCHAR(36) NULL UNIQUE`).

**Testing**: Vitest (backend y frontend). Backend: pruebas de `pedidos.service` con `pool` simulado (patrón de los sprints 1–2) y pruebas de permisos con servidor efímero (`crearApp()` + `firmar()`). Frontend: actualización de la prueba de rutas.

**Target Platform**: Aplicación web; navegadores modernos en móvil y computadora; servidor Node.js local.

**Project Type**: Aplicación web (backend + frontend en el mismo repositorio).

**Performance Goals**: El pago y la confirmación se completan sin esperas perceptibles; el cálculo de totales y la validación de disponibilidad resuelven en una sola lectura del menú del día (índice `idx_menu_dia_fecha`). Un café universitario: decenas de usuarios concurrentes.

**Constraints**: Solo el rol cliente (`usuario`) crea y paga pedidos anticipados; validación con zod de toda entrada; servidor recalcula total y disponibilidad (no confía en el cliente); ≥ 10 minutos de anticipación usando el reloj del servidor; nunca se reciben ni se almacenan datos de tarjeta; la clave del proveedor vive en `PAYMENT_API_KEY` (variable de entorno, nunca en el repositorio); mensajes de error claros sin detalles internos; áreas táctiles ≥ 44 px en el flujo de pedido.

**Scale/Scope**: MVP de una sola cafetería. Este sprint: 2 historias (US1 crear pedido, US2 pagar), 16 requisitos funcionales, 3 endpoints nuevos (`POST /api/pedidos`, `GET /api/pedidos/{id}`, `POST /api/pedidos/{id}/pago`), 2 pantallas nuevas en clientes (`/confirmar-pedido` y confirmación de pago) y una migración aditiva.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Evidencia |
|---|---|---|
| I. Aplicación única con rutas protegidas por rol | ✅ | `/menu` y `/confirmar-pedido` viven en el área de clientes (`RutaProtegida` + `RutaPorRol` de cliente existentes); la API de pedidos exige `autenticar` + `autorizarRol(ROL.CLIENTE)` (el detalle del propio pedido admite también administrador). |
| II. TypeScript estricto y arquitectura simple | ✅ | Nuevos `routes` → `controllers` → `services` en la estructura existente; SQL con `mysql2`/`pool`; sin ORM ni dependencias nuevas. |
| III. Seguridad y manejo de credenciales (NO NEGOCIABLE) | ✅ | Sin datos de tarjeta en la API (el proveedor se abstrae; solo se persiste referencia de transacción); `PAYMENT_API_KEY` en variables de entorno; zod valida y sanitiza; errores sin stack traces. |
| IV. Flujo de pedidos con estados y anticipación | ✅ | Pedido nace `Pendiente`, solo transición a `Pagado` con pago confirmado y vía `transicion_estado`; validación de ≥ 10 minutos con reloj del servidor; sin platillos no disponibles. |
| V. Calidad verificable con pruebas | ✅ | Vitest para creación de pedidos, cálculo de totales, regla de anticipación, idempotencia, transición a `Pagado`, pago rechazado y permisos por rol. |

**Resultado**: PASA sin violaciones. No se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/004-advance-orders-payment/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── pedidos-api.md
│   └── proveedor-pago.md
├── checklists/
│   └── requirements.md  # de /speckit.specify
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/            # env.ts agrega PAYMENT_PROVIDER y PAYMENT_API_KEY
│   ├── routes/            # + pedidos.routes.ts
│   ├── controllers/       # + pedidos.controller.ts
│   ├── services/          # + pedidos.service.ts; + pagos/proveedor-pago.ts (abstracción)
│   ├── middlewares/       # autenticar, autorizarRol (existente)
│   ├── schemas/           # + pedidos.schemas.ts (zod)
│   └── app.ts             # monta /api/pedidos
├── tests/                 # + pedidos.service.test.ts, permisos.pedidos.test.ts
└── package.json

frontend/
├── src/
│   ├── pages/clientes/    # Menu.tsx agrega carrito; + ConfirmarPedido.tsx
│   ├── components/        # + componentes de carrito/resumen de pedido
│   ├── routes/            # AppRouter agrega /confirmar-pedido (área de cliente)
│   └── lib/               # api.ts (existente, se reutiliza)
└── package.json

migrations/
└── 003_clave_idempotencia_pedido.sql   # única migración del sprint (aditiva)
```

**Structure Decision**: Se conserva la estructura de dos paquetes del proyecto;
el nuevo dominio entra en los mismos directorios (`services`, `controllers`,
`routes`, `schemas`, `pages/clientes`). La abstracción del proveedor de pago es
un módulo interno del backend (`services/pagos/`), no un paquete nuevo.

## Complexity Tracking

> Sin violaciones de la constitución; no aplica.
