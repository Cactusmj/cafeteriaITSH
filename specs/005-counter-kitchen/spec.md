# Feature Specification: Sprint 4 — Mostrador (cajero) y cocina

**Feature Branch**: `005-counter-kitchen`

**Created**: 2026-10-14

**Status**: Draft

**Input**: Sprint 4 de `docs/sprints.md`: operación interna — captura de
mostrador y pantalla de cocina con todos los estados operativos. Subconjunto
trazable de la spec maestra `specs/001-pedidos-anticipados-cafeteria/spec.md`.

> **Nota de trazabilidad**: este sprint corresponde a las historias **US5**
> (Preparación de pedidos en cocina) y **US6** (Pedidos de mostrador y cobro)
> de la spec 001. Los FR de esta especificación referencian los FR-020 a
> FR-026, FR-030 y FR-031 de la maestra (con FR-023/023a/022b/023b en su
> numeración original).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Captura de pedido de mostrador y cobro (Priority: P1)

El cajero captura un pedido presencial seleccionando platillos disponibles del
menú del día con sus cantidades, ve el total, registra el cobro en efectivo
(con monto recibido y cambio) y el pedido queda en estado "Pagado", listo para
cocina. Todo ocurre sin interrumpir la fila de mostrador.

**Why this priority**: Garantiza que el servicio presencial actual continúe y
conviva con los pedidos anticipados (US6 de la maestra); sin mostrador no hay
operación real.

**Independent Test**: Capturar un pedido de mostrador, registrar el cobro en
efectivo y verificar que queda "Pagado" con su folio, y que aparece en cocina
junto a los anticipados.

**Acceptance Scenarios**:

1. **Given** un cajero con sesión activa y menú publicado, **When** captura platillos disponibles con cantidades y confirma, **Then** el sistema muestra el total antes del cobro.
2. **Given** un pedido de mostrador confirmado, **When** el cajero registra el cobro en efectivo con el monto recibido, **Then** el pedido pasa a "Pagado" y el sistema muestra el cambio a devolver.
3. **Given** un intento de incluir un platillo no disponible, **When** el cajero confirma, **Then** el sistema lo rechaza con un mensaje claro.
4. **Given** un pedido de mostrador sin cobro registrado, **When** se consulta su estado, **Then** permanece "Pendiente" y no aparece como listo para preparar.
5. **Given** pedidos anticipados en curso, **When** el cajero captura y cobra en mostrador, **Then** ambas operaciones conviven sin interferirse.

---

### User Story 2 - Cocina procesa los pedidos en una sola pantalla (Priority: P1)

El cocinero ve en una sola pantalla los pedidos entrantes (anticipados y de
mostrador) ordenados por llegada, con productos y cantidades a preparar, y
avanza cada pedido a "En preparación" y luego a "Listo". La pantalla se
actualiza sin recarga manual.

**Why this priority**: Habilita la operación real de la cafetería y el avance
del pedido hacia la entrega (US5 de la maestra).

**Independent Test**: Con pedidos "Pagados" de ambos orígenes, verificar que
aparecen ordenados por llegada, que el cocinero los avanza a "En preparación"
y luego a "Listo", y que un salto directo a "Listo" se rechaza.

**Acceptance Scenarios**:

1. **Given** pedidos "Pagados" anticipados y de mostrador, **When** el cocinero abre la pantalla, **Then** ve una sola lista ordenada por llegada con productos y cantidades de cada pedido.
2. **Given** un pedido "Pagado", **When** el cocinero lo marca "En preparación", **Then** el estado se actualiza.
3. **Given** un pedido "En preparación", **When** el cocinero lo marca "Listo", **Then** el estado se actualiza.
4. **Given** un pedido "Pagado", **When** el cocinero intenta marcarlo "Listo" directamente, **Then** el sistema rechaza el cambio por transición no válida.
5. **Given** la pantalla de cocina abierta, **When** llega un pedido nuevo o cambia un estado, **Then** la lista se actualiza sin recarga manual.
6. **Given** un pedido "Entregado" o "Cancelado", **When** se intenta cambiar su estado, **Then** el sistema lo rechaza.

---

### User Story 3 - Entrega y cancelación (Priority: P2)

El cajero marca "Entregado" cuando el cliente recoge su pedido y puede
cancelar un pedido no entregado (por ejemplo, un error de captura o un cliente
que no llega). La cancelación de un pedido pagado queda registrada sin
movimiento de dinero en este MVP.

**Why this priority**: Cierra el ciclo operativo (recogida/entrega) y da una
salida controlada a los errores; depende de que existan pedidos en flujo.

**Independent Test**: Llevar un pedido a "Listo", marcarlo "Entregado" y
verificar que ya no admite cambios; crear otro pedido y cancelarlo antes de la
entrega.

**Acceptance Scenarios**:

1. **Given** un pedido "Listo", **When** el cajero lo marca "Entregado", **Then** el estado se actualiza y el pedido deja de aparecer como pendiente.
2. **Given** un pedido en "Pendiente", "Pagado", "En preparación" o "Listo", **When** el cajero lo cancela, **Then** pasa a "Cancelado" con registro del motivo operativo.
3. **Given** un pedido "Cancelado", **When** se intenta cualquier cambio de estado, **Then** el sistema lo rechaza.

---

### Edge Cases

- El cajero intenta cobrar con un monto recibido menor que el total.
- Un platillo se marca no disponible entre la captura y el cobro.
- Dos cajeros (o el mismo en dos pestañas) intentan cobrar el mismo pedido "Pendiente" a la vez: solo un cobro debe confirmarse.
- El cocinero intenta avanzar un pedido que el cajero acaba de cancelar.
- La pantalla de cocina se abre sin pedidos en flujo: debe mostrar un mensaje claro, no una lista vacía confusa ni un error.
- Se pierde la conectividad en cocina: al recuperarse, la pantalla muestra el estado vigente sin duplicar acciones.
- Un pedido "Pagado" anticipado y uno de mostrador comparten horario: cocina distingue el orden por llegada (hora de creación/pago).
- El cajero intenta avanzar estados de cocina ("En preparación"/"Listo") o el cocinero intenta cobrar: debe denegarse por rol.
- Cancelar un pedido anticipado ya pagado en línea: se registra la cancelación; la devolución del dinero queda fuera del MVP.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El cajero MUST poder capturar pedidos de mostrador con platillos disponibles del menú del día y sus cantidades. (Maestra: FR-023)
- **FR-002**: El sistema MUST mostrar el total del pedido de mostrador antes del cobro, calculado con los precios vigentes.
- **FR-003**: El sistema MUST registrar el cobro en efectivo con monto recibido y MUST mostrar el cambio a devolver; con monto insuficiente MUST rechazar el cobro. (Maestra: FR-023a)
- **FR-004**: Un pedido de mostrador cobrado MUST pasar a "Pagado"; sin cobro registrado MUST permanecer "Pendiente" y MUST NOT aparecer como listo para preparar.
- **FR-005**: El cajero MUST poder anotar un nombre de cliente opcional para identificar el pedido en la entrega.
- **FR-006**: La pantalla de cocina MUST mostrar anticipados y mostrador en una sola lista ordenada por llegada, con productos y cantidades a preparar. (Maestra: FR-023b, FR-025)
- **FR-007**: El cocinero MUST poder marcar "En preparación" (desde "Pagado") y "Listo" (desde "En preparación"). (Maestra: FR-024)
- **FR-008**: El sistema MUST permitir solo las transiciones del flujo (Pendiente → Pagado → En preparación → Listo → Entregado, más Cancelado antes de la entrega) y MUST rechazar saltos y cambios sobre "Entregado" o "Cancelado". (Maestra: FR-020, FR-021, FR-022)
- **FR-009**: El cajero MUST poder marcar "Entregado" (desde "Listo") al recoger el cliente.
- **FR-010**: El cajero MUST poder cancelar pedidos no entregados, registrando quién y cuándo; la devolución de dinero queda fuera del MVP.
- **FR-011**: La pantalla de cocina MUST actualizarse para reflejar pedidos y estados sin recarga manual. (Maestra: FR-026)
- **FR-012**: Los pedidos anticipados y de mostrador MUST operarse simultáneamente sin interferirse. (Maestra: FR-022b)
- **FR-013**: Solo el rol cajero MUST capturar, cobrar, entregar y cancelar; solo el rol cocinero MUST avanzar preparación; el resto MUST ser denegado con los códigos HTTP apropiados.
- **FR-014**: El sistema MUST validar los datos en el servidor y MUST mostrar mensajes claros sin detalles internos. (Maestra: FR-030, FR-031)
- **FR-015**: Ningún pedido (mostrador o anticipado) MUST incluir platillos no disponibles al confirmarse. (Constitución, Principio IV)
- **FR-016**: Cada creación y cada cambio de estado MUST registrarse en el historial con quién y cuándo.
- **FR-017**: El frontend MUST ofrecer la captura y cobro en `/caja` y el tablero en `/cocina`, responsivos, de alto contraste y con áreas táctiles ≥ 44 px. (Constitución)

### Key Entities *(include if feature involves data)*

- **Pedido de mostrador**: Pedido con tipo "mostrador"; nace "Pendiente" al capturarse y pasa a "Pagado" al cobrarse; lleva nombre de cliente opcional y no exige horario de recolección.
- **Cobro en efectivo**: Pago con método "efectivo": monto igual al total, monto recibido y cambio calculado; un solo cobro confirmado por pedido.
- **Transición de estado**: Regla válida del flujo (incluye "Cancelado" antes de la entrega); se valida contra la tabla sembrada.
- **Tablero de cocina**: Vista de pedidos en "Pagado"/"En preparación" (y "Listo" pendiente de entrega) ordenados por llegada, de ambos orígenes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un cajero captura y cobra un pedido de mostrador en menos de 1 minuto.
- **SC-002**: El 100 % de los pedidos de cocina (ambos orígenes) aparece en una sola pantalla ordenada por llegada.
- **SC-003**: El 0 % de transiciones inválidas (saltos de estado o cambios sobre "Entregado"/"Cancelado") es aceptado.
- **SC-004**: La pantalla de cocina refleja pedidos y cambios de estado sin recarga manual.
- **SC-005**: El 0 % de pedidos queda "Pagado" en mostrador sin cobro registrado, y el 0 % de cobros duplicados confirma dos veces el mismo pedido.
- **SC-006**: El 100 % de las operaciones de caja/cocina con rol distinto al requerido es denegado.
- **SC-007**: `npm test` y `npm run typecheck` pasan (backend y frontend) con pruebas de mostrador, transiciones, cocina y permisos en verde.

## Assumptions

- **Sin migraciones nuevas**: el esquema del sprint 1 ya crea `pedido` (con tipo y `cliente_nombre`), `pedido_detalle`, `pago` (método "efectivo"), estados, transiciones e historial; este sprint los implementa en lógica.
- Se reutilizan autenticación, autorización, menú del día y base de pedidos/pagos de los sprints 1–3.
- El pedido de mostrador no exige los 10 minutos de anticipación (es de consumo/recogida inmediata) ni horario de recolección.
- El cobro de mostrador es solo en efectivo; el pago en línea es exclusivo de anticipados (sprint 3).
- La cancelación la opera solo el cajero; la devolución de dinero (en efectivo o en línea) queda fuera del MVP y se gestiona por caja como ajuste manual.
- El cocinero no cobra ni cancela; el cajero no avanza preparación: la separación de roles evita errores operativos.
- La actualización de cocina "sin recarga manual" se implementa con sondeo periódico (el intervalo se define en la planificación); sin websockets en el MVP.
- No entran notificaciones al cliente (sprint 5) ni el listado "mis pedidos" (sprint 5); la cocina es interna.
- Los importes en pesos con dos decimales; el cambio se calcula y muestra, sin manejar denominaciones.
- El diseño sigue `design/DESIGN.md` (paneles de caja/cocina, alto contraste, CTA claros) y áreas táctiles ≥ 44 px.
