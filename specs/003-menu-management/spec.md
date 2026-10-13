# Feature Specification: Sprint 2 — Gestión de menú y consulta de menú

**Feature Branch**: `003-menu-management`

**Created**: 2026-10-13

**Status**: Draft

**Input**: Sprint 2 de `docs/sprints.md`: el administrador publica el menú del
día y los alumnos/docentes lo consultan. Subconjunto trazable de la spec
maestra `specs/001-pedidos-anticipados-cafeteria/spec.md`.

> **Nota de trazabilidad**: este sprint corresponde a las historias **US2**
> (Gestión del menú del día y platillos) y **US3** (Consulta del menú del día)
> de la spec 001. La columna "Historias de 001" de `docs/sprints.md` usa una
> numeración heredada distinta ("US7 + US1"); la referencia autoritativa es la
> numeración de la spec maestra 001.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestión de platillos y menú del día (Priority: P1)

El administrador crea y edita platillos con nombre, categoría y descripción,
define el menú de hoy seleccionando platillos con su precio, marca cuáles son
especiales del día y activa o desactiva la disponibilidad de cada platillo del
día. Los cambios se reflejan de inmediato para los clientes.

**Why this priority**: Sin un menú publicado y actualizado no existe nada que
consultar ni que pedir; es el prerequisito del flujo de pedidos (US2 de la
spec maestra).

**Independent Test**: Crear un platillo, agregarlo al menú de hoy con un
precio, marcarlo especial y cambiar su disponibilidad, y verificar que un
cliente ve el resultado con los valores definidos.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** crea un platillo y lo agrega al menú de hoy con un precio, **Then** el platillo aparece para los clientes con ese precio.
2. **Given** un platillo del día, **When** el administrador lo marca como no disponible, **Then** queda identificado como no disponible para los clientes.
3. **Given** un platillo del día, **When** el administrador lo marca como especial, **Then** el cliente lo ve identificado como especial del día.
4. **Given** un platillo existente, **When** el administrador edita su nombre o descripción, **Then** los cambios se reflejan en el menú del día.
5. **Given** un administrador, **When** intenta guardar un platillo o un precio con datos inválidos (vacíos, no numéricos o negativos), **Then** el sistema rechaza la operación con un mensaje claro.

---

### User Story 2 - Consulta del menú del día (Priority: P1)

Un alumno o docente abre la aplicación y consulta el menú del día con
platillos, precios, disponibilidad y especiales del día, de forma rápida
incluso en horarios de receso, desde el móvil o la computadora.

**Why this priority**: Es el primer paso del flujo principal de aceptación y
entrega valor por sí solo: informar qué hay disponible hoy (US3 de la spec
maestra).

**Independent Test**: Publicar un menú del día y verificar que un cliente ve
todos los platillos con su precio, disponibilidad y marca de especial, y que
un platillo no disponible aparece identificado como tal.

**Acceptance Scenarios**:

1. **Given** un menú publicado para la fecha actual, **When** el cliente abre la consulta del menú, **Then** ve los platillos con nombre, precio, disponibilidad y marca de especial.
2. **Given** un platillo marcado como no disponible, **When** el cliente consulta el menú, **Then** el platillo aparece marcado como no disponible.
3. **Given** cambios recientes del administrador (precio, disponibilidad o especiales), **When** el cliente vuelve a consultar el menú, **Then** ve los valores actualizados sin esperas perceptibles.
4. **Given** sin sesión de cliente, **When** un visitante abre la consulta del menú, **Then** el menú es consultable (la compra todavía no existe en este sprint).

---

### Edge Cases

- Un platillo agregado al menú de hoy es marcado como no disponible mientras los clientes lo consultan: la consulta debe mostrar el estado actualizado.
- Un platillo es desactivado (baja lógica) mientras forma parte del menú de hoy: no debe ofrecerse como disponible.
- Dos platillos con el mismo nombre en el catálogo: el sistema debe distinguirlos o impedir el duplicado, sin ambigüedad para el cliente.
- Precio en cero, negativo, con formato no numérico o vacío al definir el menú del día.
- Nombre o descripción vacíos, o demasiado largos, al crear o editar un platillo.
- Un administrador intenta gestionar platillos o el menú sin sesión activa o con un rol distinto al administrador.
- El cliente consulta el menú en un día sin menú publicado: debe ver un mensaje claro, no una pantalla vacía o un error interno.
- El administrador agrega el mismo platillo más de una vez al menú del mismo día: el sistema debe evitar el duplicado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El administrador MUST poder crear, editar y gestionar platillos con nombre, categoría y descripción. (Maestra: FR-007)
- **FR-002**: El administrador MUST poder definir el menú de cada día seleccionando platillos, con su precio y su estado de disponibilidad. (Maestra: FR-008)
- **FR-003**: El administrador MUST poder marcar platillos como especiales del día dentro del menú. (Maestra: FR-009)
- **FR-004**: El sistema MUST reflejar de inmediato los cambios del menú para los clientes. (Maestra: FR-010)
- **FR-005**: El sistema MUST identificar los platillos no disponibles como tales; MUST NOT presentarlos como seleccionables. (Maestra: FR-011; la selección de pedidos es del sprint 3)
- **FR-006**: Los clientes MUST poder consultar el menú del día con platillos, precios, disponibilidad y especiales. (Maestra: FR-012)
- **FR-007**: Solo el rol administrador MUST poder gestionar platillos y el menú; el backend MUST denegar el resto de roles con los códigos HTTP apropiados.
- **FR-008**: El sistema MUST validar en el servidor los datos del menú antes de procesarlos o almacenarlos: nombre de platillo de 1 a 100 caracteres, descripción opcional de hasta 500, categoría de 1 a 50 y precio numérico mayor que cero; los mensajes de error MUST ser claros sin exponer detalles internos.
- **FR-009**: Un mismo platillo MUST poder formar parte del menú de distintos días, cada vez con su propio precio, disponibilidad y marca de especial.
- **FR-010**: El sistema MUST impedir que el mismo platillo aparezca más de una vez en el menú de un mismo día.
- **FR-011**: La consulta del menú MUST mostrar por defecto el menú de la fecha actual y MUST mostrar un mensaje claro cuando no haya menú publicado para ese día.
- **FR-012**: Un platillo desactivado (baja lógica) MUST quedar excluido del catálogo activo: no MUST poder agregarse al menú y, si forma parte del menú del día, MUST mostrarse como no disponible.
- **FR-013**: El frontend MUST ofrecer la gestión de platillos y menú del día en el módulo de administración (`/admin`) y la consulta del menú en la ruta de clientes (`/menu`), ambas responsivas en móvil y computadora.

### Key Entities *(include if feature involves data)*

- **Platillo**: Producto de la cafetería; tiene nombre, categoría, descripción y estado activo (baja lógica, no se elimina).
- **Categoría**: Agrupación de platillos (por ejemplo: comidas, bebidas, postres) para ordenar el menú.
- **Menú del día**: Registro de un platillo ofrecido en una fecha concreta; tiene precio, estado de disponibilidad y marca de especial.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador crea un platillo y lo publica en el menú de hoy en menos de 2 minutos.
- **SC-002**: Los cambios de precio, disponibilidad o especiales realizados por el administrador son visibles para el cliente en la siguiente consulta del menú, sin esperas perceptibles.
- **SC-003**: Un cliente ve el menú del día en pocos segundos incluso en horarios de mayor demanda (receso).
- **SC-004**: El 100 % de los platillos no disponibles aparece identificado como tal en la consulta del menú.
- **SC-005**: El 100 % de las operaciones de gestión del menú sin rol administrador es denegado.
- **SC-006**: `npm test` y `npm run typecheck` pasan (backend y frontend) sin errores, con pruebas de la lógica del menú en verde.

## Assumptions

- Se reutiliza la autenticación, autorización y estructura del sprint 1 (`specs/002-foundation-auth/`); este sprint solo agrega el dominio del menú.
- El "día" del menú es la fecha calendario del plantel (sin zona horaria configurada de forma distinta); no se contemplan menús semanales ni programación con anticipación de días futuros en este sprint.
- Las categorías son un catálogo simple administrable dentro de la gestión de platillos (lista fija en este sprint: comidas, bebidas, postres, complementos), sin entidad independiente de administración.
- Un platillo se desactiva con baja lógica; su historial en menús de días pasados se conserva.
- Los precios se registran como importe en pesos con dos decimales como máximo.
- La consulta del menú es pública (sin sesión) porque la compra aún no existe; la autenticación de clientes ya está disponible desde el sprint 1.
- No entran pedidos, carrito, pagos ni notificaciones; este sprint prepara el menú que el sprint 3 usará para pedir.
- El diseño sigue `.stitch/DESIGN.md` como referencia y los tokens ya existentes de Tailwind; se prioriza legibilidad y áreas táctiles ≥ 44 px en operaciones frecuentes.
