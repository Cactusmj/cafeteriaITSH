# Phase 0 — Research: Rediseño UI del sistema

Todas las incógnitas del Technical Context quedaron resueltas con el
contexto del repo y las decisiones aprobadas. Sin NEEDS CLARIFICATION.

## R1. Tokens de DESIGN.md en Tailwind v4

- **Decision**: Mapear el frontmatter de `design/DESIGN.md` a un bloque
  `@theme` en `frontend/src/index.css` (colores `surface*`, `primary`,
  `secondary`, `tertiary`, `error`, `status-*`, `on-*`; radios; espaciado
  base 4px) y usar las clases generadas (`bg-surface`, `text-on-surface`,
  `bg-primary`, etc.) en lugar de `slate-*`.
- **Rationale**: Tailwind v4 genera utilidades desde `@theme` sin config JS;
  el repo ya usa `@import "tailwindcss"`, así que es el camino nativo y sin
  dependencias nuevas.
- **Alternatives considered**: `tailwind.config.js` clásico (v3, no aplica a
  v4), CSS variables sueltas sin `@theme` (pierde las utilidades).

## R2. Tipografías autoalojadas

- **Decision**: `@fontsource/plus-jakarta-sans` (700/800) +
  `@fontsource/inter` (400/500/600), subconjunto latin, registradas en
  `main.tsx`; clases `font-heading` (Jakarta) y cuerpo Inter.
- **Rationale**: Decisión aprobada por la usuaria; autoalojadas evitan
  dependencia de red/CDN y cumplen la restricción presupuestaria del MVP.
- **Alternatives considered**: Enlace a Google Fonts (descartado: carga
  externa), solo sistema (descartado: DESIGN.md las exige).

## R3. Drawer + bottom bar sin librerías

- **Decision**: Construir drawer (overlay móvil, panel fijo 16rem en
  escritorio) y bottom bar (≥56 px, pestañas ≥44 px) con Tailwind + React
  Router dentro de `LayoutPorRol`; contadores desde endpoints existentes
  (`GET /api/avisos` en cliente con sondeo, pendientes de caja en cajero).
- **Rationale**: `diseño-operativo.md` §1 lo prevé ("sin dependencias
  nuevas"); reutiliza el patrón `void Promise.resolve().then(cargar)` del
  repo para la carga inicial.
- **Alternatives considered**: Librería de componentes (rechazada: dependencia
  innecesaria, constitución II).

## R4. Rutas nuevas y guardas intactas

- **Decision**: `/admin` (landing, rol administrador) y `/caja/entregas`
  (rol cajero) dentro de los grupos `RutaPorRol` existentes; actualizar
  `INICIO_POR_ROL` en `lib/sesion.ts`; `RutaProtegida`/`RutaPorRol` sin
  cambios; ampliar `rutas.test.tsx`.
- **Rationale**: Las aclaraciones Q1/Q2 exigen rutas propias con pruebas de
  ruta; colgarlas de los grupos existentes conserva la matriz de permisos.
- **Alternatives considered**: Secciones con estado local (rechazadas en Q1/Q2).

## R5. Cocina en dos columnas (escritorio)

- **Decision**: Grid 1 col móvil / 2 col escritorio agrupadas por estado (Por
  preparar / En preparación), orden de llegada dentro de cada columna; lista
  única con badge en móvil (aclaración Q3).
- **Rationale**: Respeta "una sola pantalla" (misma ruta y sondeo) añadiendo
  el agrupamiento opcional que el diseño propone.
- **Alternatives considered**: Lista única en todo tamaño (rechazada en Q3).

## R6. Estrategia de migración slate → tokens

- **Decision**: Fase A migra página por página a tokens con los mismos
  layouts; cada página migrada se verifica con `lint + typecheck + test`
  antes de pasar a la siguiente; Fase B cambia navegación y pantallas sobre
  los tokens ya aplicados.
- **Rationale**: Reduce el riesgo de una migración "big bang" con ~100 usos
  de `slate-*`; cada paso es demostrable y reversible por commit.
- **Alternatives considered**: Migración atómica (rechazada: bloquea demo
  parcial y dificulta bisect).
