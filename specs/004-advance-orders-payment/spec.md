# Feature Specification: Sprint 3 — Pedido anticipado y pago

**Feature Branch**: `004-advance-orders-payment`

**Created**: 2026-10-13

**Status**: Draft

**Input**: Sprint 3 de `docs/sprints.md`: el alumno/docente completa el pedido
anticipado con pago; nacen los estados de pedido. Subconjunto trazable de la
spec maestra `specs/001-pedidos-anticipados-cafeteria/spec.md`.

> **Nota de trazabilidad**: este sprint corresponde a la historia **US4**
> (Realizar un pedido anticipado con pago) de la spec 001. Los FR de esta
> especificación referencian los FR-011 a FR-019, FR-030, FR-031 y FR-033 de la
> maestra.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear el pedido anticipado con sus validaciones (Priority: P1)

Un alumno o docente selecciona uno o más platillos disponibles del menú del día
con sus cantidades, revisa el total calculado con los precios vigentes, elige
un horario de recolección con al menos 10 minutos de anticipación y confirma
el pedido; el pedido nace en estado "Pendiente".

**Why this priority**: es el corazón de la US4 de la maestra: sin un pedido
creado y validado no hay nada que pagar; entrega valor por sí solo (el pedido
queda registrado con su folio y total).

**Independent Test**: Seleccionar platillos disponibles con cantidades, ver el
total antes de confirmar, intentar confirmar con menos de 10 minutos de
anticipación (debe rechazarse) y confirmar con un horario válido (el pedido
queda "Pendiente" con su folio).

**Acceptance Scenarios**:

1. **Given** un cliente con sesión activa y un menú publicado, **When** selecciona platillos disponibles con cantidades válidas, **Then** el sistema muestra el total antes de confirmar.
2. **Given** una selección válida, **When** el cliente intenta confirmar con menos de 10 minutos de anticipación o con un horario ya pasado, **Then** el sistema impide la creación del pedido y muestra un mensaje claro.
3. **Given** una selección que incluye un platillo no disponible o ajeno al menú de hoy, **When** el cliente confirma el pedido, **Then** el sistema lo rechaza con un mensaje claro.
4. **Given** un carrito vacío o con cantidades inválidas (cero, negativas o no numéricas), **When** el cliente intenta confirmar, **Then** el sistema rechaza la operación sin crear el pedido.
5. **Given** una confirmación válida, **When** el pedido se registra, **Then** el pedido queda en estado "Pendiente" con un folio identificable y su detalle (platillos, cantidades, precios y total).

---

### User Story 2 - Pagar el pedido y dejarlo en "Pagado" (Priority: P1)

El cliente paga el pedido en línea con un servicio de pago externo; cuando el
pago se confirma, el pedido pasa a estado "Pagado" y queda listo para que
cocina lo reciba. El sistema nunca almacena datos sensibles de tarjeta.

**Why this priority**: es la segunda mitad de la US4 y el criterio central del
sprint: sin pago confirmado no hay pedido "Pagado" ni flujo hacia cocina.

**Independent Test**: Completar el flujo de pago de un pedido "Pendiente" con
resultado exitoso y verificar que el pedido pasa a "Pagado"; simular un pago
fallido y verificar que el pedido permanece "Pendiente".

**Acceptance Scenarios**:

1. **Given** un pedido en estado "Pendiente", **When** el cliente completa el pago con resultado exitoso, **Then** el pedido pasa a estado "Pagado" y el sistema muestra la confirmación con el folio.
2. **Given** un pedido en estado "Pendiente", **When** el pago falla o no se confirma, **Then** el pedido permanece en estado "Pendiente" y el cliente puede reintentar.
3. **Given** un pedido "Pagado", **When** el personal de cocina consulta los pedidos entrantes (pantalla del sprint 4), **Then** el pedido aparece en estado "Pagado" listo para iniciar preparación.
4. **Given** el proceso de pago, **When** el sistema registra la transacción, **Then** solo guarda la información mínima para identificar y validar la transacción, nunca datos de tarjeta.

---

### Edge Cases

- El cliente elige un horario de recolección a exactamente 10 minutos (o a menos) desde la confirmación: debe rechazarse; solo se admite a partir de 10 minutos completos.
- El cliente elige un horario de recolección ya pasado o de otro día.
- Un platillo es marcado como no disponible (o se le modifica el precio) entre la selección del cliente y la confirmación: el sistema debe rechazarlo o cobrar el precio vigente al confirmar, sin sorpresas.
- El pago falla, se cancela o nunca se confirma: el pedido debe permanecer "Pendiente" y nunca quedar como "Pagado".
- El cliente pierde la sesión o la conectividad durante el pago y reintenta: no deben crearse pedidos duplicados con el mismo carrito.
- Dos reintentos de pago simultáneos para el mismo pedido: solo uno debe confirmarlo; el segundo no duplica el pedido ni el cobro.
- Carrito vacío, cantidades cero o negativas, o platillos fuera del menú de hoy al confirmar.
- El administrador modifica precios del menú mientras hay pedidos en curso: los pedidos ya creados conservan los precios con que se registraron.
- El cliente inicia sesión con un rol distinto al de cliente (cajero, cocinero, administrador) e intenta crear un pedido anticipado: debe denegarse.
- Errores del servicio de pago externo o de red durante la confirmación: el cliente ve un mensaje claro, sin detalles internos, y puede reintentar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Los clientes MUST poder seleccionar uno o más platillos disponibles del menú del día con sus cantidades. (Maestra: FR-013)
- **FR-002**: El sistema MUST mostrar el total del pedido antes de confirmarlo, calculado con los precios vigentes del menú del día. (Maestra: FR-014)
- **FR-003**: El sistema MUST requerir al menos 10 minutos de anticipación entre la confirmación del pedido y el horario de recolección, y MUST impedir la creación de pedidos con menos tiempo o con un horario ya pasado, con un mensaje claro. (Maestra: FR-015, FR-016)
- **FR-004**: El sistema MUST impedir incluir platillos no disponibles ni ajenos al menú del día, y MUST rechazar la confirmación con un mensaje claro. (Maestra: FR-011)
- **FR-005**: El pago MUST formar parte del flujo de confirmación del pedido anticipado: el pedido no MUST completarse sin el pago. (Maestra: FR-017)
- **FR-006**: El sistema MUST registrar únicamente la información necesaria para identificar y validar la transacción de pago, y MUST NOT almacenar datos sensibles de tarjetas. (Maestra: FR-018; constitución, Principio III)
- **FR-007**: El sistema MUST marcar el pedido como "Pagado" únicamente cuando el pago se confirme; si el pago falla o no se confirma, el pedido MUST permanecer en "Pendiente". (Maestra: FR-019)
- **FR-008**: Un pedido anticipado MUST nacer en estado "Pendiente" y, al confirmarse el pago, MUST pasar a "Pagado" respetando el flujo de transiciones válido; las transiciones inválidas MUST ser rechazadas. (Maestra: FR-020, FR-021, FR-022; el resto de transiciones es del sprint 4)
- **FR-009**: El sistema MUST asignar a cada pedido un folio único e identificable que se muestra en la confirmación.
- **FR-010**: El sistema MUST evitar la creación de pedidos duplicados ante reintentos de pago o reconexión con el mismo carrito. (Maestra: FR-033)
- **FR-011**: Cada línea de pedido MUST conservar el precio unitario vigente al momento de confirmarlo; cambios posteriores del menú MUST NOT alterar pedidos ya creados. (Maestra: caso borde de la maestra)
- **FR-012**: Solo el rol cliente (alumno/docente) con sesión activa MUST poder crear pedidos anticipados; el resto de roles MUST ser denegado con los códigos HTTP apropiados.
- **FR-013**: El sistema MUST validar los datos antes de procesarlos o almacenarlos, tanto en el cliente como en el servidor, y MUST mostrar mensajes de error claros sin exponer detalles internos. (Maestra: FR-030, FR-031)
- **FR-014**: El sistema MUST registrar el historial de estados del pedido (creación en "Pendiente" y paso a "Pagado") con quién y cuándo, para trazabilidad.
- **FR-015**: Tras el pago confirmado, el pedido MUST quedar visible para cocina en estado "Pagado" (la pantalla de cocina es del sprint 4; aquí solo se garantiza el estado).
- **FR-016**: El frontend MUST ofrecer el flujo de selección, confirmación y pago en las rutas de clientes (`/menu` → confirmación/pago), responsivo en móvil y computadora, con áreas táctiles ≥ 44 px en las acciones frecuentes. (Constitución, Principio I)

### Key Entities *(include if feature involves data)*

- **Pedido**: Solicitud de un cliente con tipo "anticipado"; tiene folio único, estado (nace "Pendiente"), horario de recolección, total y fecha de creación.
- **Detalle de pedido**: Líneas del pedido con platillo del menú del día, cantidad, precio unitario y subtotal; los precios quedan fijados al confirmar.
- **Pago**: Transacción asociada a un pedido (método en línea, monto y referencia de validación); un pedido anticipado tiene como máximo un pago confirmado.
- **Historial de estados**: Registro de los cambios de estado de un pedido con el usuario y la fecha de cada cambio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los pedidos anticipados se registra con al menos 10 minutos de anticipación (ninguno con menos). (Maestra: SC-002)
- **SC-002**: Un cliente completa la selección, la confirmación y el pago de un pedido en menos de 3 minutos. (Maestra: SC-003, parcial)
- **SC-003**: El 0 % de los pedidos queda en estado "Pagado" sin un pago confirmado.
- **SC-004**: El 100 % de los pagos fallidos o no confirmados deja el pedido en "Pendiente" y disponible para reintentar.
- **SC-005**: El 100 % de los pedidos confirmados contiene solo platillos disponibles del menú del día, con el precio vigente al confirmar.
- **SC-006**: Los reintentos tras una interrupción de sesión o red no generan pedidos duplicados (0 pedidos duplicados por el mismo carrito).
- **SC-007**: El 100 % de las creaciones de pedido anticipado realizadas por roles distintos al cliente es denegado.
- **SC-008**: `npm test` y `npm run typecheck` pasan (backend y frontend) sin errores, con pruebas de creación de pedidos, cálculo de totales, validación de anticipación y transición a "Pagado" en verde.

## Assumptions

- **Sin tablas nuevas**: el esquema del sprint 1 (`specs/002-foundation-auth/`) ya crea las tablas `pedido`, `pedido_detalle`, `pago`, `pedido_estado_historial`, `estado_pedido` y `transicion_estado`, con los estados y transiciones sembrados; este sprint las implementa en lógica, no las redefine. Se permite como máximo una migración aditiva mínima (columna auxiliar) si el diseño la requiere para evitar duplicados (FR-010); no se rediseña el esquema.
- Se reutiliza la autenticación, autorización y estructura de los sprints 1 y 2; este sprint agrega el dominio de pedidos y pagos del cliente.
- El pago se realiza mediante un servicio de pago externo configurado con variables de entorno; en el entorno de desarrollo puede usarse el modo de prueba (sandbox) del proveedor. Solo el pago en línea aplica a pedidos anticipados; el cobro en efectivo es del cajero (sprint 4).
- La recolección es el mismo día, dentro del horario de la cafetería; este sprint solo exige el mínimo de 10 minutos de anticipación, sin ventana máxima de reserva.
- El catálogo de horarios de recolección (intervalos ofrecidos al cliente) se define en la planificación; la regla de negocio es solo el mínimo de 10 minutos.
- La cancelación de un pedido por parte del cliente no entra en este sprint (el estado "Cancelado" y sus transiciones se usan desde el sprint 4).
- No entra el listado "mis pedidos" con seguimiento en vivo (sprint 5), ni la captura de mostrador ni la pantalla de cocina (sprint 4); aquí solo se garantiza que el pedido pagado queda en estado correcto para esos módulos.
- Los importes se manejan en pesos con dos decimales como máximo, igual que el menú.
- El diseño sigue `.stitch/DESIGN.md` como referencia y los tokens existentes de Tailwind; se prioriza legibilidad y áreas táctiles ≥ 44 px en operaciones frecuentes.
