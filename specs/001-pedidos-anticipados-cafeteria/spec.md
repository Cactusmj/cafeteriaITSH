# Feature Specification: Sistema de Pedidos Anticipados — Cafetería ITSH

**Feature Branch**: `001-pedidos-anticipados-cafeteria`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Construir un sistema web de pedidos anticipados llamado 'Sistema de Pedidos Anticipados — Cafetería ITSH' para que alumnos y docentes del Instituto Tecnológico Superior de Huauchinango consulten el menú, hagan pedidos y pagos por adelantado, y reciban una notificación cuando su pedido esté listo, sin interrumpir el servicio actual de mostrador."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Autenticación y acceso por rol (Priority: P1)

Un alumno, docente, cajero, cocinero o administrador se registra o inicia sesión con
su correo y contraseña. Al entrar, solo puede ver y usar el módulo correspondiente a
su rol; no puede acceder a los módulos de otros roles.

**Why this priority**: Es la base de seguridad y de todo el sistema; sin control de
acceso por rol no es posible operar de forma segura ni separar responsabilidades.

**Independent Test**: Registrar un usuario con un rol y verificar que el inicio de
sesión funciona y que el acceso a módulos de otros roles es denegado.

**Acceptance Scenarios**:

1. **Given** un visitante con datos válidos, **When** se registra o inicia sesión, **Then** obtiene una sesión activa y es dirigido a su módulo según su rol.
2. **Given** una sesión activa de un rol, **When** intenta entrar a la ruta de otro rol, **Then** el acceso es denegado.
3. **Given** credenciales incorrectas, **When** intenta iniciar sesión, **Then** el acceso es denegado con un mensaje claro y sin revelar detalles internos.

---

### User Story 2 - Gestión del menú del día y platillos (Priority: P1)

El administrador crea y edita platillos, define el menú del día con sus precios,
marca especiales del día y activa o desactiva la disponibilidad de cada platillo. Los
cambios se reflejan de inmediato para los clientes.

**Why this priority**: Sin un menú publicado y actualizado no existe nada que
consultar ni que pedir; es prerequisito del flujo de pedidos.

**Independent Test**: Crear un platillo, agregarlo al menú del día con precio, marcar
su disponibilidad y verificar que un cliente ve el resultado con los valores definidos.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** crea un platillo y lo agrega al menú de hoy con un precio, **Then** el platillo aparece para los clientes con ese precio.
2. **Given** un platillo del día, **When** el administrador lo marca como no disponible, **Then** deja de poder seleccionarse en nuevos pedidos y se indica como no disponible.
3. **Given** un platillo marcado como especial, **When** el cliente consulta el menú, **Then** el especial se identifica como tal.

---

### User Story 3 - Consulta del menú del día (Priority: P1)

Un alumno o docente abre el sistema y consulta el menú del día con platillos, precios,
disponibilidad y especiales del día, de forma rápida incluso en horarios de receso.

**Why this priority**: Es el primer paso del flujo principal de aceptación y entrega
valor por sí solo (informar qué hay disponible hoy).

**Independent Test**: Publicar un menú del día y verificar que un cliente ve todos los
platillos con su precio, disponibilidad y marca de especial.

**Acceptance Scenarios**:

1. **Given** un menú publicado para la fecha actual, **When** el cliente abre la consulta, **Then** ve los platillos con nombre, precio y disponibilidad.
2. **Given** un platillo no disponible, **When** el cliente consulta el menú, **Then** el platillo aparece marcado como no disponible y no puede seleccionarse.

---

### User Story 4 - Realizar un pedido anticipado con pago (Priority: P1)

Un alumno o docente selecciona uno o más platillos disponibles del menú del día con
sus cantidades, ve el total, elige un horario de recolección con al menos 10 minutos de
anticipación, paga en línea y confirma el pedido.

**Why this priority**: Es el objetivo central del proyecto y la principal fuente de
valor para los clientes.

**Independent Test**: Seleccionar platillos disponibles, confirmar que no se permite
un horario con menos de 10 minutos de anticipación, completar el pago y verificar que
el pedido queda en estado "Pagado".

**Acceptance Scenarios**:

1. **Given** un cliente con sesión activa y platillos disponibles, **When** selecciona platillos y cantidades válidas, **Then** el sistema muestra el total antes de confirmar.
2. **Given** una selección válida, **When** el cliente intenta confirmar con menos de 10 minutos de anticipación, **Then** el sistema impide la creación del pedido.
3. **Given** un pedido confirmado con pago exitoso, **When** el pago se valida, **Then** el pedido pasa a estado "Pagado".
4. **Given** un intento de incluir un platillo no disponible, **When** el cliente confirma el pedido, **Then** el sistema lo rechaza.

---

### User Story 5 - Preparación de pedidos en cocina (Priority: P2)

El cocinero ve en una sola pantalla los pedidos entrantes (anticipados y de
mostrador), los productos y cantidades a preparar y el orden de preparación, y cambia
el estado del pedido a "En preparación" y luego a "Listo".

**Why this priority**: Habilita la operación real de la cafetería y el avance del
pedido hacia la entrega; depende de que existan pedidos.

**Independent Test**: Con un pedido pagado, verificar que aparece en cocina, que el
cocinero puede marcarlo "En preparación" y luego "Listo", y que no puede saltarse
estados.

**Acceptance Scenarios**:

1. **Given** pedidos pagados existentes, **When** el cocinero abre la pantalla, **Then** ve los pedidos entrantes con sus productos y cantidades.
2. **Given** un pedido en estado "Pagado", **When** el cocinero lo marca "En preparación", **Then** el estado se actualiza.
3. **Given** un pedido "En preparación", **When** el cocinero lo marca "Listo", **Then** el estado se actualiza y se dispara la notificación al cliente.
4. **Given** un pedido "Pagado", **When** el cocinero intenta marcarlo "Listo" directamente, **Then** el sistema rechaza el cambio por ser una transición no válida.

---

### User Story 6 - Pedidos de mostrador y cobro (Priority: P2)

El cajero captura pedidos realizados presencialmente, registra el cobro y opera en
simultáneo con los pedidos anticipados, sin interrumpir el servicio de mostrador.

**Why this priority**: Garantiza que el servicio presencial actual continúe y conviva
con los pedidos anticipados.

**Independent Test**: Registrar un pedido de mostrador, cobrarlo y verificar que
aparece en cocina junto con los pedidos anticipados.

**Acceptance Scenarios**:

1. **Given** un cajero con sesión activa, **When** captura un pedido de mostrador con sus platillos, **Then** el pedido se registra y puede cobrarse.
2. **Given** un pedido de mostrador cobrado, **When** el personal revisa la cocina, **Then** el pedido aparece junto con los anticipados.

---

### User Story 7 - Notificación y seguimiento del pedido (Priority: P2)

Cuando un pedido pasa a "Listo", el alumno o docente recibe una notificación de que ya
puede recogerlo; además puede consultar en cualquier momento la lista y el detalle de
sus pedidos.

**Why this priority**: Cierra el ciclo de valor para el cliente y evita esperas
innecesarias en mostrador.

**Independent Test**: Llevar un pedido a "Listo" y verificar que se genera una
notificación al cliente y que el cliente ve el estado y detalle actualizados.

**Acceptance Scenarios**:

1. **Given** un pedido que pasa a "Listo", **When** el cambio de estado se registra, **Then** se emite una notificación al cliente que hizo el pedido.
2. **Given** un cliente con pedidos, **When** abre el seguimiento, **Then** ve cada pedido con su estado actual y su detalle (platillos, cantidades y total).

---

### User Story 8 - Gestión de usuarios operativos (Priority: P3)

El administrador crea, edita y gestiona las cuentas de cajeros y cocineros.

**Why this priority**: Facilita la operación a largo plazo, pero no bloquea el flujo
principal del MVP.

**Independent Test**: Crear una cuenta de cajero desde el panel de administrador y
verificar que puede iniciar sesión con su rol.

**Acceptance Scenarios**:

1. **Given** un administrador con sesión activa, **When** crea una cuenta operativa con un rol, **Then** la cuenta queda disponible para iniciar sesión con ese rol.
2. **Given** una cuenta operativa existente, **When** el administrador la edita o desactiva, **Then** los cambios se reflejan en el acceso del usuario.

---

### Edge Cases

- Un cliente intenta crear un pedido con menos de 10 minutos de anticipación o con un horario ya pasado.
- Un cliente incluye un platillo que fue marcado como no disponible entre la selección y la confirmación.
- El pago falla o no se confirma tras confirmar el pedido: el pedido no debe quedar como "Pagado".
- Se intenta una transición de estado no válida (por ejemplo, "Pendiente" → "Listo") o modificar un pedido "Entregado" o "Cancelado".
- Un pedido se cancela antes de ser entregado y debe reflejarse correctamente en cocina y para el cliente.
- El administrador modifica precios del menú mientras hay pedidos en curso (los pedidos ya creados conservan el precio con el que se registraron).
- Dos pedidos coinciden en el horario de recolección y cocina debe distinguir el orden de preparación.
- El cliente pierde la sesión o la conectividad durante el pago y debe poder reintentar sin pedidos duplicados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir el registro y el inicio de sesión con correo electrónico y contraseña.
- **FR-002**: El sistema MUST asignar a cada usuario exactamente un rol: administrador, cajero, cocinero o alumno/docente.
- **FR-003**: El sistema MUST restringir cada módulo al rol correspondiente y denegar el acceso a los demás roles.
- **FR-004**: El sistema MUST mantener las sesiones autenticadas y cerrar el acceso cuando no haya sesión activa.
- **FR-005**: El sistema MUST almacenar las contraseñas de forma no legible (nunca en texto plano).
- **FR-006**: El administrador MUST poder crear, editar y gestionar cuentas de cajeros y cocineros.
- **FR-007**: El administrador MUST poder crear, editar y gestionar platillos con nombre, categoría y descripción.
- **FR-008**: El administrador MUST poder definir el menú de cada día seleccionando platillos, con su precio y su estado de disponibilidad.
- **FR-009**: El administrador MUST poder marcar platillos como especiales del día.
- **FR-010**: El sistema MUST reflejar de inmediato los cambios del menú para los clientes.
- **FR-011**: El sistema MUST impedir que platillos no disponibles se seleccionen en nuevos pedidos.
- **FR-012**: Los clientes MUST poder consultar el menú del día con platillos, precios, disponibilidad y especiales.
- **FR-013**: Los clientes MUST poder seleccionar uno o más platillos disponibles con sus cantidades.
- **FR-014**: El sistema MUST mostrar el total del pedido antes de confirmarlo.
- **FR-015**: El sistema MUST requerir al menos 10 minutos de anticipación entre la confirmación del pedido y el horario de recolección.
- **FR-016**: El sistema MUST impedir la creación de pedidos anticipados con menos de 10 minutos de anticipación.
- **FR-017**: El pago MUST formar parte del flujo de confirmación del pedido anticipado.
- **FR-018**: El sistema MUST registrar únicamente la información necesaria para identificar y validar una transacción de pago, sin almacenar datos sensibles de tarjetas.
- **FR-019**: El sistema MUST marcar un pedido anticipado como "Pagado" únicamente cuando el pago se confirme.
- **FR-020**: El sistema MUST mantener cada pedido en un estado que refleje su progreso, con los estados mínimos: Pendiente, Pagado, En preparación, Listo, Entregado y Cancelado.
- **FR-021**: El sistema MUST permitir solo las transiciones válidas del flujo principal (Pendiente → Pagado → En preparación → Listo → Entregado) y el paso a Cancelado antes de la entrega.
- **FR-022**: El sistema MUST impedir saltarse estados y modificar pedidos en estado Entregado o Cancelado.
- **FR-023**: El cajero MUST poder capturar pedidos realizados presencialmente con sus platillos y cantidades.
- **FR-023a**: El sistema MUST permitir registrar y gestionar el cobro de los pedidos de mostrador.
- **FR-022b**: El sistema MUST operar simultáneamente pedidos anticipados y pedidos de mostrador sin interrumpir el servicio presencial.
- **FR-023b**: La interfaz de cocina MUST mostrar los pedidos entrantes (anticipados y de mostrador) con los productos y cantidades a preparar.
- **FR-024**: El sistema MUST permitir al cocinero cambiar el estado del pedido a "En preparación" y a "Listo".
- **FR-025**: El sistema MUST facilitar la identificación del orden de preparación de los pedidos.
- **FR-026**: La pantalla de cocina MUST actualizarse para reflejar los pedidos que deben prepararse sin recarga manual.
- **FR-027**: El sistema MUST notificar al cliente cuando su pedido pase a "Listo".
- **FR-028**: El sistema MUST mantener la funcionalidad de notificaciones separada de la lógica principal de pedidos.
- **FR-029**: Los clientes MUST poder consultar la lista y el detalle de sus propios pedidos.
- **FR-030**: El sistema MUST validar los datos antes de procesarlos o almacenarlos, tanto de entrada como en el servidor.
- **FR-031**: El sistema MUST mostrar mensajes de error claros sin exponer detalles internos.
- **FR-032**: El sistema MUST registrar los errores necesarios para mantenimiento sin exponer información sensible al usuario.
- **FR-033**: El sistema MUST evitar la creación de pedidos duplicados ante reintentos de pago o reconexión.

### Key Entities *(include if feature involves data)*

- **Usuario**: Persona que accede al sistema; tiene nombre, correo, credenciales y estado activo.
- **Rol**: Tipo de usuario (administrador, cajero, cocinero, alumno/docente) que determina los permisos.
- **Platillo**: Producto de la cafetería con nombre, categoría, descripción y estado activo.
- **Menú del día**: Conjunto de platillos ofrecidos en una fecha, cada uno con su precio, disponibilidad y marca de especial.
- **Pedido**: Solicitud de un cliente o capturada en mostrador; tiene tipo (anticipado/mostrador), estado, total y horario de recolección.
- **Detalle de pedido**: Líneas de un pedido con platillo, cantidad, precio unitario y subtotal.
- **Pago**: Registro de la transacción asociada a un pedido (método, monto y referencia de validación).
- **Estado del pedido**: Etapa del ciclo de vida del pedido dentro del flujo permitido.
- **Transición de estado**: Regla que define qué cambios de estado son válidos.
- **Historial de estados**: Registro de los cambios de estado de un pedido con quién y cuándo los realizó.
- **Notificación**: Aviso enviado al cliente cuando su pedido está listo, con su canal y resultado de envío.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El tiempo de espera en caja durante los recesos se reduce al menos un 50 % respecto a la operación actual.
- **SC-002**: El 100 % de los pedidos anticipados se registra con al menos 10 minutos de anticipación (ninguno con menos).
- **SC-003**: Un cliente completa la consulta del menú y la creación de un pedido anticipado en menos de 3 minutos.
- **SC-004**: Un cliente ve el menú del día en pocos segundos incluso en horarios de mayor demanda.
- **SC-005**: El 90 % de los clientes completa su primer pedido anticipado sin asistencia.
- **SC-006**: Los errores por interpretación verbal de pedidos en mostrador se reducen al capturarse en el sistema.
- **SC-007**: Al menos el 95 % de las notificaciones de "pedido listo" se entrega correctamente al cliente (canal que corresponda).
- **SC-008**: El sistema atiende pedidos anticipados y de mostrador de forma simultánea sin degradar la operación de mostrador.

## Assumptions

- Los usuarios cuentan con un dispositivo con navegador y conectividad a internet dentro del plantel.
- El alcance del MVP corresponde a una única cafetería dentro del plantel.
- La aceptación final requiere una demostración funcional y la validación de la patrocinadora del proyecto.
- El servicio presencial de mostrador se mantiene y no debe interrumpirse durante la operación del sistema.
- Se reutiliza el stack tecnológico y las reglas definidas en la constitución del proyecto; esta especificación permanece en términos de negocio.
- Existen cuentas base de administrador para operar el sistema y cuentas operativas (cajero y cocinero) que el administrador gestiona.
- El pago en línea se apoya en un servicio externo; solo se persiste la información mínima de validación de la transacción.
- La recolección del pedido es presencial en la cafetería; no se contemplan envíos.
- No se incluyen en el alcance: programa de lealtad, gestión de inventario, venta en línea a terceros ni soporte multilenguaje.
