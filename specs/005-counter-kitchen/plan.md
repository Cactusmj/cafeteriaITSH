# Implementation Plan: Sprint 4 — Mostrador (cajero) y cocina

**Branch**: `005-counter-kitchen` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-counter-kitchen/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Operación interna sobre la base de los sprints 1–3: el cajero captura pedidos
de mostrador y registra el cobro en efectivo (nacen "Pagado" con folio), y el
cocinero los procesa junto a los anticipados en un tablero único ordenado por
llegada ("En preparación" → "Listo"), con actualización por sondeo y cierre
del ciclo (cajero marca "Entregado" o "Cancela"). El esquema MySQL ya cubre
tipos, estados, transiciones, pagos en efectivo e historial: este sprint no
añade migraciones, solo API REST (zod + mysql2), pruebas Vitest y las
pantallas `/caja` y `/cocina`.

## Technical Context

**Language/Version**: TypeScript estricto en backend y frontend; Node.js LTS para el backend.

**Primary Dependencies**: Backend: Express, `mysql2`, `zod` (ya instalados). Frontend: React 19, `react-router-dom`, Tailwind CSS, Vitest + Testing Library (ya instalados). Sin dependencias nuevas.

**Storage**: MySQL 8.0.16+, base `cafeteria_itsh`. Sin migraciones: `pedido` (tipo, `cliente_nombre`, `fecha_recoleccion` nula en mostrador), `pago` (método "efectivo"), `transicion_estado` y `pedido_estado_historial` ya existen y están sembrados.

**Testing**: Vitest. Backend: pruebas de servicio con `pool` simulado (mostrador, cobro, transiciones, tablero) y de permisos con servidor efímero (`crearApp()` + `firmar()`). Frontend: ampliación de la prueba de rutas.

**Target Platform**: Aplicación web; navegadores modernos en móvil y computadora; servidor Node.js local. `/cocina` pensada para pantalla fija; `/caja` para operación rápida en receso.

**Project Type**: Aplicación web (backend + frontend en el mismo repositorio).

**Performance Goals**: Captura + cobro en menos de 1 minuto; el tablero refleja cambios en segundos (sondeo corto); consultas del tablero en una sola lectura ordenada por llegada.

**Constraints**: Cajero: capturar/cobrar/entregar/cancelar; cocinero: avanzar preparación; validación zod en servidor; recálculo de total y disponibilidad (no confiar en el cliente); un solo cobro confirmado por pedido; nunca exponer detalles internos; áreas táctiles ≥ 44 px y alto contraste en caja/cocina.

**Scale/Scope**: MVP de una sola cafetería. Este sprint: 3 historias (US1 mostrador, US2 cocina, US3 entrega/cancelación), 17 requisitos, endpoints nuevos bajo `/api/pedidos/mostrador`, `/api/pedidos/:id/cobro`, `/api/pedidos/:id/estado`, `/api/cocina/pedidos` y `/api/caja/pendientes`; 2 pantallas operativas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Evidencia |
|---|---|---|
| I. Aplicación única con rutas protegidas por rol | ✅ | `/caja` tras `RutaPorRol` de cajero, `/cocina` tras la de cocinero; API con `autenticar` + `autorizarRol` por operación (cajero/cocinero). |
| II. TypeScript estricto y arquitectura simple | ✅ | Mismos `routes` → `controllers` → `services`; SQL con `mysql2`; sin dependencias nuevas. |
| III. Seguridad y manejo de credenciales (NO NEGOCIABLE) | ✅ | Sin datos sensibles (solo efectivo); zod valida; errores sin detalles internos; sin secretos nuevos. |
| IV. Flujo de pedidos con estados y anticipación | ✅ | Transiciones validadas contra `transicion_estado`; sin saltos ni cambios sobre Entregado/Cancelado; mostrador no exige 10 minutos (recogida inmediata); sin no disponibles. |
| V. Calidad verificable con pruebas | ✅ | Vitest para mostrador, cobro, transiciones, tablero y permisos por rol. |

**Resultado**: PASA sin violaciones. No se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/005-counter-kitchen/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── mostrador-api.md
│   └── cocina-api.md
├── checklists/
│   └── requirements.md  # de /speckit.specify
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── routes/            # + mostrador.routes.ts (o extensión de pedidos.routes.ts), cocina.routes.ts, caja.routes.ts
│   ├── controllers/       # + mostrador.controller.ts, cocina.controller.ts
│   ├── services/          # + mostrador.service.ts; pedidos.service.ts agrega avanzarEstado
│   ├── schemas/           # + mostrador.schemas.ts, estado.schemas.ts (zod)
│   └── app.ts             # monta las rutas nuevas
├── tests/                 # + mostrador.service.test.ts, estados.service.test.ts, permisos.mostrador-cocina.test.ts
└── package.json

frontend/
├── src/
│   ├── pages/
│   │   ├── caja/          # Caja.tsx pasa de placeholder a captura + cobro + entregas
│   │   └── cocina/        # Cocina.tsx pasa de placeholder a tablero KDS con sondeo
│   ├── components/        # + componentes de tarjeta de pedido y tablero
│   ├── routes/            # AppRouter (sin rutas nuevas; páginas existentes)
│   └── lib/               # api.ts (existente, se reutiliza)
└── package.json

migrations/                # sin cambios
```

**Structure Decision**: Se conserva la estructura de dos paquetes; el dominio
operativo entra en los mismos directorios. La lógica de estados vive en
`pedidos.service.ts` (extensión) y lo propio de mostrador/cocina en servicios
nuevos.

## Complexity Tracking

> Sin violaciones de la constitución; no aplica.
