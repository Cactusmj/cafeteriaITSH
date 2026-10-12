# Constitución del Sistema de Pedidos Anticipados — Cafetería ITSH

## Core Principles

### I. Aplicación única con rutas protegidas por rol

El sistema es UNA sola aplicación web (React + TypeScript con Vite) organizada en
rutas por rol: `/admin`, `/caja`, `/cocina` y `/menu` + `/mis-pedidos` para
alumnos y docentes. Cada ruta MUST exigir sesión activa y el rol correspondiente:
un usuario sin el rol adecuado MUST NOT acceder a módulos ajenos. Alumnos y
docentes comparten la misma vista de cliente, diferenciados solo por su cuenta y
rol. El frontend MUST ser responsivo y funcionar en móviles y computadoras.

Rationale: un único despliegue con control de acceso por rol reduce complejidad,
evita duplicar lógica y garantiza que cada actor vea solo lo que le corresponde.

### II. TypeScript estricto y arquitectura simple

El lenguaje principal MUST ser TypeScript, con tipado estático estricto siempre
que sea posible; MUST NOT existir JavaScript sin tipado en la lógica principal.
El backend MUST usar Node.js LTS con Express y exponer una API REST. La estructura
MUST ser sencilla y organizada por funcionalidad; MUST NOT implementarse capas ni
arquitecturas innecesariamente complejas para el tamaño del sistema. La base de
datos MUST ser MySQL y las consultas MUST realizarse con una librería de acceso a
datos adecuada; MUST NOT introducirse ORMs innecesarios.

Rationale: un stack homogéneo y tipado, sin sobre-ingeniería, mantiene el código
mantenible y comprensible para un equipo y un MVP acotados.

### III. Seguridad y manejo de credenciales (NO NEGOCIABLE)

La autenticación MUST realizarse con correo electrónico y contraseña, y las
sesiones MUST gestionarse con JSON Web Tokens (JWT). MUST implementarse
autorización basada en roles. Las contraseñas MUST almacenarse siempre con hash,
nunca en texto plano. Las credenciales, tokens y claves secretas MUST NOT
incluirse en el código fuente ni en el repositorio; MUST usarse variables de
entorno. Los datos recibidos MUST validarse y sanitizarse antes de procesarse o
almacenarse. El sistema MUST NOT almacenar información sensible de tarjetas
bancarias. En producción MUST usarse HTTPS.

Rationale: estos controles protegen cuentas, transacciones y datos personales, y
son condición mínima para operar un servicio con pagos.

### IV. Flujo de pedidos con estados y anticipación

Los pedidos anticipados MUST realizarse con al menos 10 minutos de anticipación;
MUST NOT permitirse crearlos con menos tiempo. Todo pedido MUST mantener un
estado que refleje su progreso, con los estados mínimos: `Pendiente`, `Pagado`,
`En preparación`, `Listo`, `Entregado` y `Cancelado`. Las transiciones MUST
respetar el flujo válido (Pendiente → Pagado → En preparación → Listo →
Entregado, con paso a `Cancelado` antes de la entrega) y MUST NOT saltarse
estados ni modificar pedidos Entregados o Cancelados. MUST NOT incluirse
platillos no disponibles. El sistema MUST operar simultáneamente pedidos
anticipados y de mostrador, y MUST evitar errores por interpretación verbal.

Rationale: estados y validaciones explícitas hacen trazable el pedido y eliminan
la ambigüedad del pedido verbal.

### V. Calidad verificable con pruebas

La lógica de negocio importante MUST contar con pruebas unitarias usando Vitest.
MUST probarse como mínimo: autenticación, autorización, gestión de usuarios,
gestión del menú, creación y validación de pedidos, cálculo de totales, cambios
de estado y control de permisos por rol. No se exige una cobertura mínima, pero
las funcionalidades críticas MUST estar cubiertas.

Rationale: las pruebas sobre reglas de negocio y permisos reducen regresiones en
los flujos de mayor riesgo (pagos, estados y control por rol).

## Restricciones y Requisitos Técnicos

- **Stack**: TypeScript; Node.js LTS + Express; React + TypeScript con Vite;
  Tailwind CSS + shadcn/ui; MySQL. Los diseños de `.stitch/DESIGN.md` son
  referencia y podrán modificarse durante el desarrollo.
- **API REST**: todas las operaciones frontend/backend MUST usar una API REST con
  los métodos HTTP según su propósito (`GET`, `POST`, `PUT`/`PATCH`, `DELETE`) y
  códigos HTTP apropiados.
- **Pagos**: los pedidos anticipados MUST pagarse mediante un servicio en línea;
  solo se registra lo necesario para identificar y validar la transacción.
- **Notificaciones**: la funcionalidad MUST mantenerse separada de la lógica de
  pedidos y podrá apoyarse en un servicio externo.
- **Gestión del menú**: el administrador MUST poder crear y modificar el menú
  diario, gestionar platillos y precios; los cambios MUST reflejarse para los
  usuarios y los platillos no disponibles MUST NOT poder seleccionarse.
- **Manejo de errores**: MUST NOT exponerse stack traces ni información interna
  del servidor; los mensajes MUST ser claros y registrarse sin datos sensibles.
- **Variables de entorno** (mínimas): `DATABASE_URL`, `JWT_SECRET`,
  `PAYMENT_API_KEY`, `NOTIFICATION_API_KEY`, `NODE_ENV`, `PORT`. Sus valores
  MUST NOT incluirse directamente en el código.
- **Rendimiento**: las consultas del menú MUST estar optimizadas; el sistema MUST
  responder bien en horarios de mayor demanda y priorizar reducir el tiempo de
  espera en caja. Objetivos: reducir el tiempo de espera en caja ≥ 50 % en
  recesos y permitir el 100 % de pedidos anticipados con ≥ 10 minutos de
  anticipación.
- **Alcance (MVP)**: gestión de usuarios y roles; gestión y consulta del menú;
  gestión de platillos; pedidos anticipados y de mostrador; pago anticipado;
  visualización de pedidos en cocina; actualización de estados; notificaciones de
  pedido listo. MUST NOT agregarse funcionalidades fuera del alcance sin
  aprobación previa.
- **Despliegue**: MUST poder ejecutarse localmente durante el desarrollo y
  desplegarse con servicios gratuitos o de bajo costo, separando configuración de
  desarrollo y de producción, considerando las restricciones presupuestarias.

## Flujo de Desarrollo y Puertas de Calidad

- **Estructura**: mantener `frontend/`, `backend/`, `database/` y `tests/`. El
  frontend se organiza en `pages/admin`, `pages/caja`, `pages/cocina`,
  `pages/clientes`, `components/ui` (shadcn/ui) y `lib`. El backend puede
  organizarse en `routes`, `controllers`, `services`, `middlewares` y `utils`,
  sin capas innecesarias.
- **Estilo de código**: `camelCase` para variables y funciones, `PascalCase` para
  componentes, tipos e interfaces; nombres descriptivos; funciones pequeñas y
  reutilizables; sin código duplicado.
- **Interfaz de usuario**: componentes con Tailwind CSS + shadcn/ui personalizados
  con los tokens del proyecto; botones de cocina y caja de alto contraste con
  área táctil ≥ 44 px; operaciones de caja y cocina con la menor cantidad de
  pasos posible y priorizando legibilidad.
- **Operación de caja**: el cajero MUST poder registrar pedidos de mostrador y
  gestionar sus cobros sin interrumpir el servicio presencial.
- **Operación de cocina**: los pedidos MUST visualizarse y actualizarse para que
  el personal sepa qué preparar y en qué orden.
- **Roles**: además del cliente, el sistema contempla Administrador (usuarios,
  menú, platillos, especiales y precios), Cajero (pedidos y cobros presenciales)
  y Cocinero (pedidos entrantes y cambios de estado).
- **Control de versiones**: usar Git con repositorio remoto; commits pequeños y
  descriptivos; MUST NOT almacenar `.env` ni credenciales en el repositorio.
- **Dependencias**: no agregar dependencias innecesarias; verificar antes si la
  funcionalidad puede resolverse con lo existente y mantener compatibilidad con
  Node.js LTS.
- **Criterio de aceptación**: el sistema se considera funcional cuando permite
  completar el flujo: consulta del menú → selección de productos → creación del
  pedido → pago → recepción en cocina → preparación → pedido listo →
  notificación al usuario → recogida/entrega.

## Governance

- Esta constitución prevalece sobre cualquier otra práctica o convención del
  proyecto en caso de conflicto.
- **Enmiendas**: cualquier cambio MUST documentarse, describir la motivación y
  aprobarse antes de su adopción; toda enmienda MUST actualizar el Sync Impact
  Report y la línea de versión.
- **Versionado**: se sigue Versionado Semántico. MAJOR ante cambios incompatibles
  o redefinición/eliminación de principios; MINOR al añadir o expandir de forma
  material principios o secciones; PATCH para aclaraciones y correcciones de
  redacción sin cambio semántico.
- **Cumplimiento**: toda revisión o PR MUST verificar la conformidad con estos
  principios; cualquier complejidad añadida MUST justificarse explícitamente o
  rechazarse. Las desviaciones deben justificarse y, cuando corresponda,
  aprobarse previamente.

**Version**: 1.0.0 | **Ratified**: 2026-10-11 | **Last Amended**: 2026-10-11
