# Phase 0 — Research: Sprint 1 — Fundamentos y autenticación

Decisiones técnicas para resolver las incógnitas del Technical Context y alinear
con la constitución y `docs/reglas.md`.

## R1. Motor de base de datos

- **Decisión**: MySQL 8.0.16+ (base `cafeteria_itsh`).
- **Rationale**: La constitución (§II), `docs/reglas.md` §4 y las migraciones ya
  escritas (`migrations/001_crear_esquema_mysql.sql`) usan MySQL; `docs/ejecutar-migraciones.md`
  documenta el procedimiento sobre MySQL 9.6.
- **Alternativas consideradas**: PostgreSQL (mencionado por error en `docs/sprints.md`).
  Se descarta porque contradice la constitución y obligaría a reescribir migraciones
  y documentación ya aprobadas.

## R2. Acceso a datos

- **Decisión**: `mysql2` con un pool de conexiones y consultas parametrizadas.
- **Rationale**: La constitución prohíbe ORMs innecesarios y pide una librería de
  acceso a datos adecuada. `mysql2` ofrece `execute` con parámetros (previene
  inyección SQL) y soporte de `Promise`.
- **Alternativas consideradas**: Sequelize/Prisma (rechazados por sobre-ingeniería
  para el tamaño del MVP); `mysql` (sin Promises nativas ni el mismo rendimiento de `mysql2`).

## R3. Autenticación y sesiones

- **Decisión**: JWT firmados con `JWT_SECRET` (librería `jsonwebtoken`), enviados
  por el cliente en el encabezado `Authorization: Bearer <token>`. El token incluye
  `id` y `rol` del usuario y expira en un plazo acotado.
- **Rationale**: La constitución (§III) exige JWT y autorización por rol.
- **Alternativas consideradas**: sesiones en servidor con cookies (más estado y
  configuración CORS/cookies); OAuth externo (fuera de alcance).

## R4. Hashing de contraseñas

- **Decisión**: `bcrypt` con `cost` por defecto (10–12), almacenando `password_hash`.
- **Rationale**: Requisito FR-005 y constitución §III (nunca texto plano).
- **Alternativas consideradas**: `argon2` (válido, pero añade dependencia nativa;
  bcrypt es estándar y suficiente).

## R5. Validación de entrada

- **Decisión**: `zod` para validar y tipar los cuerpos de `login`, `registro` y
  gestión de usuarios en el servidor; el frontend reutiliza reglas equivalentes
  para retroalimentación temprana.
- **Rationale**: FR-008 exige validar y sanitizar antes de procesar/almacenar;
  la validación del cliente nunca es autoritativa.
- **Alternativas consideradas**: validación manual (propensa a omisiones y
  duplicación).

## R6. Migraciones

- **Decisión**: Consumir los scripts SQL existentes ejecutados manualmente según
  `docs/ejecutar-migraciones.md`; no introducir un framework de migraciones.
- **Rationale**: El esquema inicial ya está creado y la constitución pide
  simplicidad. Este sprint no rediseña la base.
- **Alternativas consideradas**: `node-pg-migrate`/`dbmate`/Knex migrations
  (más infraestructura de la necesaria para el MVP).

## R7. Enrutamiento y protección en el frontend

- **Decisión**: `react-router-dom` (v7) con un componente `RutaProtegida` que
  exige sesión y un componente `RutaPorRol` que valida el rol; el token y los
  datos del usuario se guardan en un contexto de sesión apoyado en `localStorage`.
- **Rationale**: FR-011/FR-012; la app única con rutas por rol es el principio I.
- **Alternativas consideradas**: guardas dentro de cada página (duplicación y
  riesgo de olvidos).

## R8. UI y estilos

- **Decisión**: Tailwind CSS + shadcn/ui con los componentes copiados a
  `src/components/ui` y personalizados con los tokens del proyecto.
- **Rationale**: Constitución (Restricciones) y `docs/reglas.md` §2 y §19.
- **Alternativas consideradas**: librerías de componentes con estilo propio
  (MUI/Chakra) — rechazadas porque la constitución fija Tailwind + shadcn/ui.

## R9. Pruebas

- **Decisión**: Vitest en backend (servicios de autenticación, generación/
  verificación de JWT, middleware de rol, servicio de usuarios) y en frontend
  (guardas de ruta y utilidades de sesión).
- **Rationale**: Principio V de la constitución; debe probarse al menos
  autenticación, autorización y gestión de usuarios.
- **Alternativas consideradas**: Jest (más configuración y no integrado con Vite).

## R10. Variables de entorno

- **Decisión**: `dotenv` en backend; variables `DATABASE_URL` (o `DB_HOST/DB_USER/DB_PASSWORD/DB_NAME`),
  `JWT_SECRET`, `NODE_ENV`, `PORT`. El frontend usa `VITE_API_URL`.
- **Rationale**: Constitución (§III y Restricciones) y `docs/reglas.md` §23.
  Nunca se versionan valores reales.
- **Alternativas consideradas**: configuración en código (prohibida por seguridad).
