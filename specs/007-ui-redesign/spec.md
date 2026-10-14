# Feature Specification: Rediseño UI del sistema

**Feature Branch**: `007-ui-redesign`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Rediseño completo de la interfaz del Sistema de Pedidos Anticipados Cafetería ITSH aplicando el sistema de diseño canónico de design/DESIGN.md (Fase A: tokens y componentes; Fase B: navegación y pantallas por rol), con tipografías autoalojadas y todos los roles juntos, sin implementar nada marcado [Fuera de alcance]"

> **Nota de trazabilidad**: esta feature implementa la propuesta de `design/DESIGN.md`
> (canónico) y los documentos por rol `design/diseño-cliente.md`,
> `design/diseño-operativo.md` y `design/diseño-cocina.md` (índice en
> `design/diseño-conceptual.md`). No agrega funcionalidad del producto: es el
> mismo MVP de los sprints 1–5 con la identidad visual y navegación previstas.
> La constitución (`.specify/memory/constitution.md`) prevalece en conflicto.

## Clarifications

### Session 2026-10-14

- Q: ¿Las entregas de caja deben vivir en una ruta propia separada o como sección dentro de la página de caja? → A: Ruta propia para Entregas, con su prueba de ruta y contador compartido.
- Q: ¿El inicio de administración debe ser una ruta nueva propia o la reorganización de las pestañas existentes? → A: Ruta nueva de inicio con resumen y accesos.
- Q: ¿El tablero de cocina en escritorio debe agrupar los pedidos en dos columnas por estado o mantener una sola lista? → A: Dos columnas en escritorio (Por preparar / En preparación), lista única en móvil.
- Q: ¿El aviso de pedido listo en la navegación del cliente debe actualizarse solo o únicamente al visitar Mis pedidos? → A: La navegación consulta los avisos periódicamente y muestra el aviso de listo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Identidad visual institucional en todas las pantallas (Priority: P1)

Cada pantalla de la aplicación usa la identidad de `design/DESIGN.md`: fondo
crema con tarjetas blancas, acciones principales en verde institucional,
tipografía de títulos en Plus Jakarta Sans y de cuerpo en Inter, y componentes
consistentes (botones, tarjetas, campos, insignias de estado tipo pill).

**Why this priority**: Es la base de todo el rediseño; sin los tokens
aplicados, ningún otro cambio visual es verificable. Corrige la brecha actual
(paleta gris por defecto y fuente del sistema en todas las pantallas).

**Independent Test**: Abrir cada ruta (`/login`, `/menu`, `/mis-pedidos`,
`/caja`, `/cocina`, `/admin/*`) y verificar fondo crema, acciones principales
verdes, títulos en la tipografía de títulos y cuerpo en la de texto, e
insignias de estado con los colores definidos.

**Acceptance Scenarios**:

1. **Given** cualquier pantalla del sistema, **When** se visualiza, **Then** el fondo es crema, las tarjetas son blancas y la acción principal es verde institucional.
2. **Given** un pedido en cualquier estado, **When** se muestra su insignia, **Then** usa el color de estado definido (Pendiente, Pagado, En preparación, Listo, Entregado, Cancelado) con texto blanco.
3. **Given** cualquier control interactivo, **When** se mide, **Then** su área táctil es de al menos 44 px.
4. **Given** un campo de formulario con error, **When** se muestra, **Then** la etiqueta está visible arriba y el mensaje aparece debajo en color de error.

---

### User Story 2 - Navegación por rol con drawer y barra inferior (Priority: P1)

Cada rol navega con un menú lateral (drawer) y, en móvil, barra inferior:
cliente (Menú, Mis pedidos con aviso de listo), caja (Caja, Entregas con
contador), cocina (vista única con drawer), administración (Usuarios,
Platillos, Menú del día). El control de acceso por rol no cambia.

**Why this priority**: Reemplaza los tabs horizontales actuales por el patrón
previsto en el diseño; es el cambio estructural que ordena todas las pantallas
de la Fase B.

**Independent Test**: Iniciar sesión con cada rol y verificar su drawer y
barra inferior, navegar entre secciones y confirmar que las rutas ajenas
siguen denegadas.

**Acceptance Scenarios**:

1. **Given** un cliente con un pedido listo, **When** mira su navegación, **Then** ve un aviso en Mis pedidos.
2. **Given** un cajero con entregas pendientes, **When** mira su navegación, **Then** ve el contador de entregas.
3. **Given** un usuario de un rol, **When** intenta abrir una ruta de otro rol, **Then** se le deniega como hoy.
4. **Given** un teléfono móvil, **When** se usa la barra inferior, **Then** cada pestaña es un área táctil de al menos 44 px.

---

### User Story 3 - App del cliente rediseñada (Priority: P2)

El cliente ve el menú con buscador, filtros por categoría del catálogo,
tarjetas con control de cantidad y barra flotante del pedido; confirma con la
regla de 10 minutos explicada en pantalla; paga sin capturar datos de tarjeta;
y sigue sus pedidos con el aviso destacado de listo para recoger.

**Why this priority**: Es la cara más visible del sistema en horario de
receso y donde la rapidez de lectura más impacta.

**Independent Test**: Completar menú → pedido → pago → seguimiento solo con
lo visible en pantalla, y verificar filtros, barra flotante, regla de 10
minutos y aviso de listo.

**Acceptance Scenarios**:

1. **Given** el menú del día, **When** se busca o filtra por categoría, **Then** la lista se reduce y el vacío de filtro lo explica.
2. **Given** un carrito no vacío, **When** se mira la pantalla, **Then** la barra flotante muestra productos y total con acceso al pedido.
3. **Given** una hora de recolección a menos de 10 minutos, **When** se elige, **Then** aparece un mensaje con la hora mínima posible.
4. **Given** la pantalla de pago, **When** se lee, **Then** indica que no se capturan datos de tarjeta.
5. **Given** un pedido en estado Listo, **When** se abre Mis pedidos, **Then** aparece destacado como listo para recoger.

---

### User Story 4 - Caja rediseñada (Priority: P2)

El cajero opera desde un panel de inicio con acciones rápidas y módulo de
entregas, captura con catálogo filtrable y control de cantidad, cobra en un
solo paso y entrega pedidos listos ordenados por llegada.

**Why this priority**: La caja es la operación crítica del plantel; cada paso
de más es espera en fila.

**Independent Test**: Capturar y cobrar un pedido y entregar uno listo
midiendo pasos y áreas táctiles, con el contador de entregas actualizado.

**Acceptance Scenarios**:

1. **Given** el panel de caja, **When** se pulsa Capturar pedido, **Then** se abre el catálogo en un paso.
2. **Given** el resumen de cobro, **When** se confirma, **Then** captura y cobro ocurren en una sola acción y se muestra el folio.
3. **Given** un cobro fallido, **When** se muestra el resultado, **Then** hay opciones de reintentar y cancelar con el folio visible.
4. **Given** pedidos listos, **When** se abre Entregas, **Then** aparecen por orden de llegada con folio grande y botones Entregar y Cancelar.
5. **Given** una entrega, **When** se confirma, **Then** la fila desaparece y el contador se actualiza.

---

### User Story 5 - Tablero de cocina (KDS) rediseñado (Priority: P2)

El cocinero ve una sola pantalla con tarjetas de alto contraste: folio
grande, origen (anticipado/mostrador), hora de recolección, tiempo
transcurrido con alerta de retraso y un solo botón por tarjeta para avanzar.

**Why this priority**: La cocina decide de un vistazo qué preparar y en qué
orden durante el receso.

**Independent Test**: Con pedidos de ambos orígenes, verificar una sola
vista ordenada por llegada, legibilidad de folio y cantidades, y avance de un
toque por tarjeta.

**Acceptance Scenarios**:

1. **Given** pedidos anticipados y de mostrador, **When** se abre cocina, **Then** aparecen en una sola vista ordenados por llegada con su origen visible.
2. **Given** una tarjeta de pedido, **When** se lee, **Then** folio, cantidades y hora de recolección son legibles de un vistazo.
3. **Given** una hora de recolección ya pasada, **When** se muestra la tarjeta, **Then** aparece marcada como retrasada.
4. **Given** un pedido pagado o en preparación, **When** se pulsa su botón, **Then** avanza al siguiente estado con un solo toque.
5. **Given** un pedido listo, **When** se muestra su tarjeta, **Then** no ofrece avanzar (el siguiente paso es de caja).

---

### User Story 6 - Panel de administración rediseñado (Priority: P3)

La administración abre en un inicio con accesos rápidos y resumen del menú de
hoy, y gestiona usuarios, platillos y menú del día con listas de filas altas
y formularios claros. No agrega funcionalidad: es el mismo CRUD.

**Why this priority**: Ordena el trabajo del administrador sin cambiar lo que
el sistema puede hacer.

**Independent Test**: Recorrer inicio, usuarios, platillos y menú del día
verificando conteos, filas altas y los mismos flujos de crear/editar actuales.

**Acceptance Scenarios**:

1. **Given** el inicio de administración, **When** se abre, **Then** muestra accesos a usuarios, platillos y menú con sus conteos y el resumen del menú de hoy.
2. **Given** la lista de usuarios, **When** se revisa, **Then** cada fila muestra nombre, rol, estado y acciones con filas altas.
3. **Given** el menú del día, **When** se revisa, **Then** cada platillo muestra precio, disponibilidad y marca de especial.
4. **Given** cualquier pantalla de administración, **When** falla la carga, **Then** hay mensaje con opción de reintentar.

---

### Edge Cases

- Pantalla pequeña (teléfono) frente a escritorio: el drawer lateral se vuelve panel fijo y los grids colapsan a una columna sin perder acciones.
- Menú vacío o sin resultados de filtro: mensaje explicativo con acción (volver al menú o limpiar filtro), nunca pantalla en blanco.
- Fallo de red durante el pago o un avance de estado: mensaje claro con reintento; el estado de verdad lo confirma el servidor al reintentar.
- Dos operadores avanzan el mismo pedido a la vez: se muestra el mensaje del servidor y la vista se actualiza.
- Un pedido listo de mostrador sin dueño: no genera aviso a nadie (se anuncia por folio en caja), como hoy.
- Controles y textos deben mantener contraste legible sobre crema y blanco en todos los estados (normal, deshabilitado, error).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Todas las pantallas MUST usar el fondo crema, tarjetas blancas y texto principal/secundario definidos en `design/DESIGN.md`.
- **FR-002**: Todas las acciones principales MUST mostrarse en verde institucional con texto blanco; las secundarias con borde verde y fondo transparente.
- **FR-003**: Los títulos, precios y totales MUST usar Plus Jakarta Sans en pesos 700/800 y el cuerpo MUST usar Inter.
- **FR-004**: Los estados de pedido MUST mostrarse como insignias pill con texto blanco y los colores definidos (Pendiente, Pagado, En preparación, Listo, Entregado, Cancelado).
- **FR-005**: Todo control interactivo MUST tener un área táctil de al menos 44 px; los botones principales de 44–48 px.
- **FR-006**: Cada rol MUST navegar con su drawer lateral y, en móvil, su barra inferior con los contadores definidos (listo para recoger en cliente, entregas en caja); la navegación del cliente MUST consultar los avisos periódicamente para mostrar el aviso de listo; el control de acceso por rol MUST mantenerse sin cambios.
- **FR-007**: El menú del cliente MUST ofrecer buscador en vivo y filtros por las categorías reales del catálogo, tarjetas con control de cantidad y barra flotante con total solo con carrito no vacío.
- **FR-008**: La confirmación del pedido MUST validar y explicar la regla de 10 minutos de anticipación con la hora mínima posible.
- **FR-009**: La pantalla de pago MUST indicar que no captura datos de tarjeta y MUST ofrecer reintentar y cancelar si el pago es rechazado.
- **FR-010**: Mis pedidos MUST listar del más reciente al más antiguo con folio, estado, total y horario, detalle expandible y aviso destacado de listo para recoger.
- **FR-011**: La caja MUST capturar y cobrar en una sola acción, mostrar el folio al confirmar y listar entregas por orden de llegada con folio grande; Entregas MUST vivir en una ruta propia con su prueba de ruta y contador compartido con la navegación.
- **FR-012**: La cocina MUST ser una sola vista ordenada por llegada con origen visible, tiempo transcurrido con alerta de retraso y un solo botón por tarjeta para avanzar; en escritorio MUST agrupar en dos columnas por estado (Por preparar / En preparación) manteniendo el orden de llegada dentro de cada columna, y en móvil MUST mostrar una sola lista con insignia de estado.
- **FR-013**: La administración MUST abrir en un inicio con conteos y resumen del menú de hoy, con los mismos flujos actuales de usuarios, platillos y menú del día; el inicio MUST vivir en una ruta nueva propia que sirva de entrada del drawer.
- **FR-014**: Todas las pantallas MUST definir sus estados de carga, vacío y error con opción de reintentar donde haya llamada de red.
- **FR-015**: La funcionalidad MUST mantenerse idéntica (mismos flujos y reglas de negocio); este rediseño MUST NOT agregar pantallas, campos ni endpoints nuevos salvo los de navegación interna.
- **FR-016**: Ningún elemento marcado [Fuera de alcance] en `design/` (fotos de platillo, notificaciones push/SMS, historial de ventas, métricas de negocio, métodos de pago, descuentos, favoritos/reseñas, configuración) MUST implementarse sin aprobación previa.
- **FR-017**: La lógica de negocio importante afectada MUST contar con pruebas (navegación por rol, seguimiento, avisos y permisos) y las puertas de calidad MUST estar en verde.

### Key Entities *(include if feature involves data)*

- **Sistema de diseño**: Conjunto de decisiones visuales (paleta, tipografías, espaciado, formas y componentes) que todas las pantallas comparten.
- **Navegación por rol**: Drawer lateral y barra inferior propios de cada rol con sus secciones y contadores.
- **Tarjeta de pedido operativa**: Presentación del pedido en cocina y caja (folio, origen, horarios, partidas, acción) sin cambiar sus datos.
- **Pedido (lectura)**: Se reutiliza la entidad existente de los sprints 3–5; aquí solo cambia su presentación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las pantillas y rutas usa fondo crema, tarjetas blancas y acción principal verde (verificación visual por ruta).
- **SC-002**: El 100 % de los controles interactivos medidos tiene al menos 44 px de área táctil.
- **SC-003**: Un cliente completa menú → pedido → pago → seguimiento sin ayuda en una pasada de prueba observada.
- **SC-004**: Un cocinero identifica folio, cantidades y retrasos de cada tarjeta sin acercarse ni pedir ayuda en la prueba observada.
- **SC-005**: Un cajero captura y cobra en una sola acción y entrega un pedido listo sin pasos adicionales.
- **SC-006**: El 0 % de elementos [Fuera de alcance] aparece implementado (revisión contra la lista de FR-016).
- **SC-007**: Las puertas de calidad están en verde con las pruebas de navegación por rol, seguimiento, avisos y permisos aprobadas.

## Assumptions

- Las tipografías se autoalojan con paquetes de fuentes (decisión aprobada); si un paquete no estuviera disponible, se usa la pila del sistema sin bloquear el resto.
- No hay cambios de API ni de base de datos: todo el rediseño consume endpoints existentes.
- El cambio de navegación (drawer + barra inferior) queda aprobado dentro de esta spec; no se tocan rutas ni guardas de rol.
- Las categorías del catálogo para filtros y chips se derivan de los datos reales, sin valores fijos.
- Los pedidos de mostrador sin dueño se siguen anunciando por folio en caja, fuera del sistema.
- La demo con la patrocinadora valida cada rol antes de cerrar la feature.
