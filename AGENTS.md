# Instrucciones del proyecto

- Responde siempre en español.
- Escribe en español todos los documentos, comentarios y mensajes de commit.
- Mantén en inglés solo términos técnicos e identificadores del código.

## Estructura

- Dos paquetes independientes **sin package.json raíz**: `backend/` (Express + TS estricto + `mysql2`, sin ORM) y `frontend/` (React 19 + Vite + Tailwind 4). Todos los comandos se ejecutan **desde la carpeta del paquete**.
- Entradas: backend `src/server.ts` → `src/app.ts` (`crearApp()`; los tests la usan para levantar un servidor efímero); frontend `src/main.tsx`.
- Ciclo de desarrollo por sprints (speckit): `docs/sprints.md` define el ciclo; specs en `specs/00N-*/`; comandos speckit en `.opencode/commands/speckit.*`.
- `.specify/memory/constitution.md` prevalece sobre cualquier convención: pruebas Vitest obligatorias (Principio V), MySQL sin ORM, JWT + `autorizarRol`, UI con áreas táctiles ≥ 44 px.

## Comandos de verificación (por paquete)

Orden recomendado: `npm run lint` → `npm run typecheck` → `npm test`.

- `lint` **solo existe en `frontend/`**; el backend no tiene lint.
- Test puntual: `npx vitest run tests/<archivo>.test.ts` (backend) o `npx vitest run src/<ruta>.test.tsx` (frontend).
- `npm test` **no necesita MySQL**: los tests de backend hacen `vi.mock('../src/config/db.js', () => ({ pool: { execute: vi.fn() } }))` y los de permisos usan `crearApp()` + `firmar()` sin tocar la BD.
- Frontend: vitest con jsdom, `include: src/**/*.test.{ts,tsx}`, setup en `src/configuracionPruebas.ts`.

## Desarrollo local

- Backend `npm run dev` → `:3000` (requiere MySQL corriendo y `backend/.env`; ver `backend/.env.example`). Frontend `npm run dev` → `:5173` (requiere `frontend/.env` con `VITE_API_URL`).
- `.env` está en `.gitignore`; solo se versionan los `*.example`. Contraseña de seeds en `SEED_PASSWORD` (`backend/.env`), nunca en el repo (`docs/seeds.md`: `admin@`, `cajero@`, `cocinero@cafeteria-itsh.mx`).
- Migraciones: `docs/ejecutar-migraciones.md` — ejecutar `001` y luego `002` con `cmd /c "mysql ... < archivo.sql"` (PowerShell 5.1 no admite `<`); `001` **no** es re-ejecutable sin recrear la base.
- Entorno: Windows + PowerShell 5.1. Al escribir scripts `.ps1` con la herramienta de archivos añade BOM UTF-8 (si no, PowerShell los lee como ANSI y fallan el parseo); `-replace` de PowerShell insensible a mayúsculas.

## Convenciones del código

- Identificadores y UI en español (`crearPlatillo`, `useSesion`, `Platillos.tsx`); los hooks de React sí deben empezar con `use`.
- Errores API con formato `{ "error": { "codigo", "mensaje" } }`; helpers `envolverAsync`, `errorConflicto`/`errorNoEncontrado`/`errorValidacion` (`src/utils/errores.ts`) y `validar(esquema, datos)` (`src/utils/validar.ts`). Validación de entrada con zod en `src/schemas/`.
- Backend por capas simples: `routes` → `controllers` → `services` (SQL con `pool` de `src/config/db.ts`); rutas admin montan `autenticar` + `autorizarRol(ROL.X)` en `src/app.ts`.
- Frontend: páginas en `src/pages/<rol>/`, cliente HTTP en `src/lib/api.ts` (`api<T>()`, lanza `ErrorPeticion`), sesión en `src/lib/useSesion.ts` (importar `ProveedorSesion` desde `lib/ContextoSesion.tsx`).
- eslint react-hooks v7 (restringido): **no** llamar `setState` de forma síncrona desde `useEffect`; patrón del repo: `void Promise.resolve().then(cargar)` en el effect y un `refrescar()` (`setCargando(true); return cargar()`) para los handlers.

## Pruebas y calidad

- Patrón de tests de servicios: mock del `pool` + aserciones sobre `pool.execute` con `[sql, parámetros]`; error API asserting `cuerpo.error.codigo`.
- Tests de permisos: servidor efímero real (sin BD) y token con `firmar()` de `src/utils/jwt.ts` para simular roles sin dependencia de datos.
- Commits pequeños y descriptivos **en español**. `*.log` está ignorado (los servidores dev suelen dejar `temp-*.log` en la raíz).

## Workflow speckit por sprint (resumen de `docs/sprints.md`)

1. `/speckit.specify` → `specs/00N-*/spec.md`; 2. `/speckit.plan` → `plan.md` + research/data-model/contracts, **revisado por la usuaria**; 3. `/speckit.tasks` → `tasks.md`; 4. implementar siguiendo tareas, tests primero, commits pequeños; 5. **demo con la patrocinadora**; 6. recién entonces marcar el sprint en `docs/sprints.md`. Un sprint no arranca sin la demo aprobada del anterior.
