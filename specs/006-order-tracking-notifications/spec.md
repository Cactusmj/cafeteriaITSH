# Feature Specification: Sprint 5 — Seguimiento, notificaciones y pulido

**Feature Branch**: `006-order-tracking-notifications`

**Created**: 2026-10-14

**Status**: Draft

**Input**: Sprint 5 de `docs/sprints.md`: el cliente ve el recorrido completo
de su pedido y recibe el aviso de listo; cierre del MVP con pruebas y demo
final. Subconjunto trazable de la spec maestra
`specs/001-pedidos-anticipados-cafeteria/spec.md`.

> **Nota de trazabilidad**: este sprint corresponde a la historia **US7**
> (Notificación y seguimiento del pedido) de la spec 001, más el pulido de
> cierre. Los FR referencian los FR-027 a FR-031 de la maestra.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mis pedidos con estado y detalle (Priority: P1)

Un alumno o docente abre "Mis pedidos" y ve la lista de sus pedidos con el
estado actual de cada uno; al abrir uno ve su detalle (platillos, cantidades,
total, horario y folio). La lista refleja el estado vigente sin acciones
manuales confusas.

**Why this priority**: Es la mitad de la US7 de la maestra y lo que el cliente
consulta mientras espera; sin esto el pedido es una caja negra tras pagar.

**Independent Test**: Con pedidos en varios estados, abrir `/mis-pedidos` y
verificar la lista ordenada con estados correctos y el detalle completo de
uno; avanzar un estado en cocina/caja y verificar que se refleja.

**Acceptance Scenarios**:

1. **Given** un cliente con pedidos, **When** abre el seguimiento, **Then** ve cada pedido con su folio, estado actual, total y horario.
2. **Given** la lista de pedidos, **When** abre el detalle de uno, **Then** ve platillos, cantidades, precios y total.
3. **Given** un cambio de estado (cocina o caja), **When** el cliente vuelve a consultar, **Then** ve el estado vigente.
4. **Given** un cliente sin pedidos, **When** abre el seguimiento, **Then** ve un mensaje claro, no una pantalla vacía ni un error.
5. **Given** dos clientes distintos, **When** cada uno abre su seguimiento, **Then** solo ve sus propios pedidos.

---

### User Story 2 - Aviso de pedido listo (Priority: P1)

Cuando un pedido pasa a "Listo", el alumno o docente recibe un aviso de que
ya puede recogerlo; el aviso queda registrado y visible hasta su consulta. La
funcionalidad vive en un módulo separado de la lógica de pedidos.

**Why this priority**: Cierra el ciclo de valor para el cliente y evita
esperas innecesarias en mostrador (segunda mitad de la US7).

**Independent Test**: Llevar un pedido a "Listo" y verificar que se genera el
aviso para su dueño; abrir el seguimiento y verificar que el aviso aparece y
puede marcarse como visto.

**Acceptance Scenarios**:

1. **Given** un pedido que pasa a "Listo", **When** el cambio se registra, **Then** se genera un aviso para el cliente dueño del pedido.
2. **Given** avisos pendientes, **When** el cliente abre el seguimiento, **Then** ve el aviso de "listo para recoger" destacado.
3. **Given** un aviso consultado, **When** el cliente lo marca como visto, **Then** deja de aparecer como pendiente.
4. **Given** un pedido de mostrador sin dueño registrado, **When** pasa a "Listo", **Then** no se genera aviso a nadie (se anuncia por folio en caja).
5. **Given** un cambio a cualquier otro estado, **When** se registra, **Then** no se genera aviso.

---

### Edge Cases

- El cliente abre el seguimiento mientras cocina avanza el estado: la siguiente consulta muestra el valor vigente.
- Un pedido anticipado pagado se cancela antes de estar listo: no genera aviso de listo.
- El cliente pierde la sesión: al reingresar ve sus pedidos y avisos intactos.
- Dos avisos del mismo cliente (dos pedidos listos a la vez): ambos aparecen, distinguibles por folio.
- El servicio externo de notificaciones no está disponible: el aviso en-app se registra de todos modos.
- Un cliente intenta ver el pedido o los avisos de otro: denegado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Los clientes MUST poder consultar la lista de sus propios pedidos con folio, estado, total y horario, ordenada del más reciente al más antiguo. (Maestra: FR-029)
- **FR-002**: Los clientes MUST poder ver el detalle de cada pedido propio (platillos, cantidades, precios, total). (Maestra: FR-029)
- **FR-003**: La lista y el detalle MUST mostrar siempre el estado vigente del pedido.
- **FR-004**: Solo el dueño MUST ver sus pedidos; el resto MUST ser denegado. (El administrador conserva su lectura existente.)
- **FR-005**: Al registrarse el paso a "Listo", el sistema MUST generar un aviso para el dueño del pedido; ningún otro cambio de estado MUST generar avisos. (Maestra: FR-027)
- **FR-006**: Los pedidos de mostrador sin dueño MUST NOT generar avisos a nadie.
- **FR-007**: Los avisos pendientes MUST mostrarse destacados en el seguimiento hasta marcarse como vistos; ver el aviso MUST permitir marcarlo como visto.
- **FR-008**: La funcionalidad de avisos MUST vivir separada de la lógica principal de pedidos (módulo propio) y MUST poder apoyarse en un servicio externo sin acoplarse a él. (Maestra: FR-028)
- **FR-009**: Si el servicio externo falla o no existe, el aviso en-app MUST registrarse de todos modos.
- **FR-010**: El sistema MUST validar los datos en el servidor y MUST mostrar mensajes claros sin detalles internos. (Maestra: FR-030, FR-031)
- **FR-011**: El frontend MUST ofrecer el seguimiento en `/mis-pedidos` (reemplaza el placeholder actual), responsivo, con áreas táctiles ≥ 44 px.
- **FR-012**: Pulido de cierre: las pantallas MUST aplicar lo básico de `design/DESIGN.md` (paleta en acciones primarias y badges de estado, tipografía y áreas táctiles) sin cambiar navegación ni layouts; el rediseño completo queda para una spec propia.
- **FR-013**: Las pruebas MUST cubrir la lista y el detalle propios, la generación del aviso al pasar a "Listo" (y solo entonces), los permisos por rol y la regresión de pagos/estados de los sprints 3–4.

### Key Entities *(include if feature involves data)*

- **Aviso (notificación)**: Aviso generado al pasar un pedido a "Listo"; tiene pedido, destinatario (dueño), canal, estado de envío/lectura y fecha; vive en módulo separado.
- **Seguimiento**: Vista de los pedidos propios con su estado vigente y detalle.
- **Pedido (lectura)**: Reutiliza la entidad de los sprints 3–4; aquí solo se consulta.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los pedidos que llegan a "Listo" con dueño genera su aviso. (Maestra: SC-007, adaptado a en-app)
- **SC-002**: Un cliente abre su seguimiento y entiende el estado de sus pedidos sin ayuda (cumple la expectativa del 90 % de la maestra SC-005 para el flujo completo).
- **SC-003**: El 0 % de clientes ve pedidos o avisos de otro cliente.
- **SC-004**: El flujo completo es demostrable de punta a punta: menú → pedido → pago → cocina → listo → aviso → recogida.
- **SC-005**: `npm test` y `npm run typecheck` pasan (backend y frontend) con las pruebas de seguimiento, avisos y permisos en verde.

## Assumptions

- **Sin tablas nuevas**: se reutilizan `pedido`, `pedido_detalle`, `pago` y `notificacion` del esquema del sprint 1; si el diseño exige un ajuste mínimo (p. ej. canal o lectura del aviso), se permite una migración aditiva pequeña.
- El aviso en-app es el mínimo del MVP; el servicio externo (correo/push/sms) se integra solo si está disponible y configurado, sin bloquear la demo.
- Los pedidos de mostrador anónimos se anuncian por folio/altavoz de caja, fuera del sistema.
- `/mis-pedidos` reemplaza el placeholder actual; la ruta y su guarda ya existen.
- El pulido es superficial (tokens básicos de diseño); no reestructura navegación, no agrega pantallas y no implementa nada marcado [Fuera de alcance] en `design/`.
- La demo final ante la patrocinadora cierra el MVP según el criterio de aceptación de la constitución.
