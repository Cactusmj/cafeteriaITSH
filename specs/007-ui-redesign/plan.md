# Implementation Plan: Rediseño UI del sistema

**Branch**: `007-ui-redesign` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-ui-redesign/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Aplicar el sistema de diseño canónico (`design/DESIGN.md`) a todo el
frontend en dos fases: **Fase A** (tokens de Tailwind v4 + tipografías
autoalojadas + componentes `ui/` + migración de `slate-*`, sin cambiar
navegación) y **Fase B** (drawer + bottom bar por rol, 2 rutas nuevas
—landing `/admin` y `/caja/entregas`— y pantallas rediseñadas de cliente,
caja, cocina y admin). Sin cambios de API ni de base de datos; nada marcado
[Fuera de alcance] en `design/`.

## Technical Context

**Language/Version**: TypeScript estricto; Node.js LTS para tooling; React 19 + Vite (frontend).

**Primary Dependencies**: `react`, `react-dom`, `react-router-dom` v7, `tailwindcss` v4 (+ `@tailwindcss/vite`); NUEVAS: `@fontsource/plus-jakarta-sans`, `@fontsource/inter` (autoalojadas, decisión aprobada). Sin dependencias nuevas de componentes: drawer y bottom bar con Tailwind + React Router.

**Storage**: N/A (sin cambios de datos; carrito sigue en `localStorage` vía `lib/carrito.ts`).

**Testing**: Vitest + Testing Library (existentes). Se amplían `src/routes/rutas.test.tsx` (drawer/bottom bar, rutas nuevas, guardas intactas) y pruebas de componentes `ui/`; regresión de permisos de backend sin cambios.

**Target Platform**: Aplicación web; navegadores modernos en móvil y computadora.

**Project Type**: Aplicación web (backend + frontend en el mismo repositorio; esta feature solo toca `frontend/`).

**Performance Goals**: Sin regresión perceptible: tokens CSS y fuentes autoalojadas (subconjunto latin + `display=swap`); el sondeo de cocina (4 s) y el nuevo sondeo de avisos del cliente reutilizan endpoints existentes sin aumentar frecuencia.

**Constraints**: Sin rutas de API nuevas; sin migraciones; sin cambios a guardas de rol (`RutaProtegida`/`RutaPorRol` intactas); áreas táctiles ≥ 44 px; contraste legible sobre crema/blanco; entrega por rol demostrable; nada [Fuera de alcance] (FR-016).

**Scale/Scope**: 1 app, 4 roles, ~11 rutas (2 nuevas: `/admin`, `/caja/entregas`), ~10 páginas a migrar, 5 componentes `ui/` nuevos + `BadgeEstado` existente; ~100 usos de `slate-*` a convertir.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento | Evidencia |
|---|---|---|
| I. Aplicación única con rutas protegidas por rol | ✅ | Sin rutas nuevas fuera de `LayoutPorRol`; `RutaProtegida`/`RutaPorRol` intactas; drawer/bottom bar viven en layouts existentes; tests de rutas por rol. |
| II. TypeScript estricto y arquitectura simple | ✅ | Solo `frontend/`; componentes `ui/` pequeños y reutilizables; 2 dependencias de fuentes justificadas (autoalojadas, sin CDN); sin librerías de UI. |
| III. Seguridad y manejo de credenciales | ✅ | Sin secretos ni cambios de auth; pago sigue sin capturar datos de tarjeta (FR-009 visible en UI). |
| IV. Flujo de pedidos con estados y anticipación | ✅ | Sin cambios de lógica: regla de 10 min solo se explica en cliente; transiciones intactas. |
| V. Calidad verificable con pruebas | ✅ | Vitest: rutas por rol, componentes `ui/`, regresión de seguimiento/avisos/permisos. |

**Resultado**: PASA sin violaciones. No se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/007-ui-redesign/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── navegacion-ui.md
├── checklists/
│   └── requirements.md  # de /speckit.specify
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── index.css              # @theme con tokens DESIGN.md (Fase A)
│   ├── main.tsx               # registro de @fontsource (Fase A)
│   ├── components/
│   │   ├── ui/                # NUEVO: Boton, Tarjeta, Campo, InsigniaEspecial, EstadoVacio (Fase A)
│   │   ├── layout/            # LayoutPorRol: drawer + bottom bar por rol (Fase B)
│   │   ├── menu/              # TarjetaPlatillo migrada a tokens
│   │   └── pedidos/           # BadgeEstado (existente, se reutiliza)
│   ├── pages/
│   │   ├── admin/             # + InicioAdmin.tsx (ruta /admin); Usuarios/Platillos/MenuDelDia migrados
│   │   ├── caja/              # Caja.tsx (captura) + Entregas.tsx (ruta /caja/entregas)
│   │   ├── cocina/            # Cocina.tsx (2 columnas escritorio)
│   │   └── clientes/          # Menu/ConfirmarPedido/MisPedidos/Login/Registro migrados
│   ├── routes/                # AppRouter (+2 rutas), RutaProtegida/RutaPorRol intactas
│   └── lib/                   # sesion.ts (INICIO_POR_ROL), api.ts, carrito.ts intactos
└── package.json               # +2 deps @fontsource
```

**Structure Decision**: Se conserva la estructura de dos paquetes; la feature
solo toca `frontend/`. Los componentes nuevos viven en `components/ui/`; las
2 rutas nuevas cuelgan de los grupos de rol existentes en `AppRouter`.

## Complexity Tracking

> Sin violaciones de la constitución; no aplica.
