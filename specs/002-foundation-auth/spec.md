# Feature Specification: Sprint 1 — Fundamentos y autenticación

**Feature Branch**: `002-foundation-auth`

**Created**: 2026-10-12

**Status**: Draft

**Input**: Sprint 1 de `docs/sprints.md`: base técnica y de seguridad del
Sistema de Pedidos Anticipados — Cafetería ITSH: base de datos, login con JWT y
esqueleto del frontend (app única con rutas por rol). Subconjunto trazable de la
spec maestra `specs/001-pedidos-anticipados-cafeteria/spec.md`.

> **Nota de trazabilidad**: la tabla de `docs/sprints.md` referencia las
> historias de la spec maestra con una numeración que no coincide con la real.
> Este sprint corresponde a las historias **US1** (Autenticación y acceso por
> rol) y **US8** (Gestión de usuarios operativos) de la spec 001; la
> infraestructura de base de datos corresponde a los prerrequisitos técnicos de
> la spec 001. `docs/sprints.md` llama "US6" a la gestión de usuarios operativos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Autenticación y acceso por rol (Priority: P1)

Un alumno, docente, cajero, cocinero o administrador se registra o inicia sesión
con su correo y contraseña. Al entrar, solo puede ver y usar el módulo
correspondiente a su rol; no puede acceder a los módulos de otros roles.

**Why this priority**: Es la base de seguridad y de todo el sistema; sin control
de acceso por rol no es posible operar de forma segura ni separar
responsabilidades.

**Independent Test**: Registrar un usuario con un rol, iniciar sesión y verificar
que es dirigido a su módulo y que el acceso a rutas de otros roles es denegado.

**Acceptance Scenarios**:

1. **Given** un visitante con datos válidos, **When** se registra como cliente o inicia sesión, **Then** obtiene una sesión activa y es dirigido a su módulo según su rol.
2. **Given** una sesión activa de un rol, **When** intenta entrar a la ruta de otro rol, **Then** el acceso es denegado y se le redirige a su módulo.
3. **Given** credenciales incorrectas, **When** intenta iniciar sesión, **Then** el acceso es denegado con un mensaje claro y sin revelar si la cuenta existe.
4. **Given** un usuario sin sesión, **When** intenta abrir cualquier ruta protegida, **Then** es redirigido a `/login`.
5. **Given** una cuenta deshabilitada, **When** intenta iniciar sesión, **Then** el acceso es denegado.

---

### User Story 2 - Gestión de usuarios operativos (Priority: P2)

El administrador crea, edita y deshabilita las cuentas de cajeros y cocineros
desde el panel `/admin`, de modo que el personal pueda operar el sistema.

**Why this priority**: Habilita la operación a largo plazo y el alta del personal,
pero no bloquea el flujo principal del MVP; depende de la autenticación (US1).

**Independent Test**: Crear una cuenta de cajero desde `/admin` y verificar que
puede iniciar sesión con su rol; editar y deshabilitarla y verificar que el
acceso cambia.

**Acceptance Scenarios**:

1. **Given** un administrador con sesión activa, **When** crea una cuenta operativa con un rol (cajero o cocinero), **Then** la cuenta queda disponible para iniciar sesión con ese rol.
2. **Given** una cuenta operativa existente, **When** el administrador la edita, **Then** los cambios se reflejan en los datos del usuario.
3. **Given** una cuenta operativa activa, **When** el administrador la deshabilita, **Then** el usuario ya no puede iniciar sesión.
4. **Given** un administrador intentando crear una cuenta, **When** usa un correo ya registrado, **Then** el sistema rechaza la operación con un mensaje claro.

---

### Edge Cases

- Un correo ya registrado en un intento de registro o de alta de usuario.
- Contraseña vacía, demasiado corta o sin el formato mínimo requerido.
- Token JWT ausente, expirado o manipulado en una ruta protegida.
- Un administrador intenta deshabilitar su propia cuenta.
- Un cajero o cocinero intenta acceder a `/admin` (ruta de otro rol).
- Intento de registrar con un rol distinto de cliente (alumno/docente) desde el registro público.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir el registro y el inicio de sesión con correo electrónico y contraseña.
- **FR-002**: El sistema MUST asignar a cada usuario exactamente un rol: administrador, cajero, cocinero o alumno/docente.
- **FR-003**: El sistema MUST restringir cada módulo al rol correspondiente y denegar el acceso a los demás roles.
- **FR-004**: El sistema MUST mantener las sesiones autenticadas con JWT y exigir sesión activa en todas las rutas protegidas.
- **FR-005**: El sistema MUST almacenar las contraseñas con hash (nunca en texto plano) y MUST NOT enviarlas en texto plano ni registrarlas en logs.
- **FR-006**: El administrador MUST poder crear, editar y deshabilitar cuentas de cajeros y cocineros.
- **FR-006a**: El registro público MUST permitir únicamente cuentas con rol cliente (alumno/docente); MUST NOT permitir crear cuentas administrativas u operativas.
- **FR-007**: El sistema MUST exponer un endpoint de inicio de sesión y uno de registro (solo clientes) bajo una API REST, con códigos HTTP apropiados.
- **FR-008**: El sistema MUST validar y sanitizar los datos recibidos antes de procesarlos o almacenarlos, tanto en el cliente como en el servidor; la contraseña MUST tener al menos 8 caracteres.
- **FR-009**: El sistema MUST mostrar mensajes de error claros sin revelar si una cuenta existe ni exponer detalles internos.
- **FR-010**: El sistema MUST disponer de un esquema inicial de base de datos con usuarios y roles y de cuentas sembradas con contraseña con hash: un administrador y al menos un cajero y un cocinero de ejemplo. Las cuentas se crean con el script `backend/scripts/sembrar-usuarios.mjs`, que toma la contraseña de la variable de entorno `SEED_PASSWORD` (nunca del repositorio); véase `docs/seeds.md`.
- **FR-011**: El frontend MUST ser una aplicación única de React + TypeScript con rutas `/login`, `/admin`, `/caja`, `/cocina`, `/menu` y `/mis-pedidos`, protegidas por sesión y rol.
- **FR-012**: El sistema MUST ofrecer una pantalla de inicio de sesión y layouts por rol, responsivos en móvil y computadora.
- **FR-013**: El sistema MUST permitir cerrar sesión, descartando el token y regresando a `/login`.

### Key Entities *(include if feature involves data)*

- **Usuario**: Persona que accede al sistema; tiene nombre, correo, contraseña (con hash), estado activo y rol.
- **Rol**: Tipo de usuario (administrador, cajero, cocinero, alumno/docente) que determina los permisos y la ruta de acceso.
- **Sesión**: Credencial JWT emitida tras un inicio de sesión válido, con el rol e identidad del usuario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los intentos de acceso a una ruta sin sesión activa es redirigido a `/login`.
- **SC-002**: El 100 % de los accesos de un rol a un módulo ajeno es denegado.
- **SC-003**: El 0 % de las contraseñas se almacena o transmite en texto plano.
- **SC-004**: Un administrador completa el alta de un cajero o cocinero en menos de 2 minutos.
- **SC-005**: `npm test` y `npm run typecheck` pasan (backend y frontend) sin errores.

## Assumptions

- Se reutiliza el stack definido en la constitución y `docs/reglas.md`: TypeScript, Node.js LTS + Express, React + TypeScript con Vite, Tailwind CSS + shadcn/ui y MySQL.
- El esquema y el seed inicial ya existen en `migrations/001_crear_esquema_mysql.sql` y `migrations/002_seed_inicial_mysql.sql`; este sprint consume ese esquema, no lo rediseña. La numeración de migración es por archivo SQL, no un framework de migraciones formal. Las cuentas base se siembran con `backend/scripts/sembrar-usuarios.mjs` a partir de `SEED_PASSWORD` (variable de entorno), de modo que ninguna credencial queda en el repositorio.
- El login usa correo como identificador único; el alta de usuarios operativos puede fijar una contraseña inicial que el operativo podrá cambiar fuera del alcance de este sprint.
- El control de acceso se resuelve con JWT más autorización por rol en el backend y guardas de ruta en el frontend; la validación de servidor es la autoritativa.
- No entran menú, pedidos, pagos ni notificaciones; este sprint solo prepara la base para ellos.
- Las cuentas base (administrador) se siembran; el administrador gestiona las cuentas operativas.
