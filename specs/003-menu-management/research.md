# Phase 0 — Research: Sprint 2 — Gestión de menú y consulta de menú

Decisiones técnicas para resolver las incógnitas del Technical Context. El
stack (TypeScript, Express, `mysql2`, zod, Vitest, Tailwind) ya está
establecido por la constitución y el sprint 1; aquí se documentan las
decisiones propias del dominio del menú.

## R1. Esquema de datos

- **Decisión**: Consumir las tablas `platillo` y `menu_dia` tal como las crea
  `migrations/001_crear_esquema_mysql.sql`; este sprint no añade ni modifica
  migraciones.
- **Rationale**: El esquema ya modela platillos (nombre, categoría,
  descripción, `activo`) y el menú por fecha con precio, disponibilidad y
  especial, más la restricción `uq_menu_fecha_platillo` que impide duplicados.
- **Alternativas consideradas**: crear una migración adicional (innecesaria;
  el esquema cubre los requisitos) o un framework de migraciones (ya descartado
  en el sprint 1, R6).

## R2. Precio mínimo

- **Decisión**: El servidor exige `precio > 0` (zod `positive()`), aunque el
  `CHECK` de la base permite `precio >= 0`.
- **Rationale**: FR-008 de la spec exige precio mayor que cero; un platillo
  gratuito no tiene sentido en la cafetería y el CHECK es un respaldo, no la
  regla de negocio.
- **Alternativas consideradas**: relajar a `>= 0` para coincidir con el CHECK
  (contradice la spec); ajustar el CHECK con una migración (desproporcionado).

## R3. Fecha del menú

- **Decisión**: El "día" es la fecha calendario del servidor. La consulta
  pública usa la fecha actual por defecto; la API de gestión admite una fecha
  explícita (`YYYY-MM-DD`) para operar el menú de hoy. No se programan menús de
  días futuros.
- **Rationale**: La spec asume una única cafetería con menú del día y
  descarta programación anticipada; mantener una sola fuente de verdad (fecha
  del servidor) evita diferencias de huso horario entre clientes.
- **Alternativas consideradas**: pedir la fecha al cliente (ambigua entre
  dispositivos); zona horaria configurable (complejidad fuera de alcance).

## R4. Disponibilidad y bajas lógicas

- **Decisión**: Un platillo del menú se considera disponible solo si
  `menu_dia.disponible = TRUE` **y** `platillo.activo = TRUE`. La consulta
  pública calcula este valor combinado. El catálogo de administración oculta
  los platillos inactivos por defecto y admite incluirlos para consulta.
- **Rationale**: FR-005 y FR-012 exigen que un platillo desactivado no se
  ofrezca como disponible aunque forme parte del menú de hoy, sin perder su
  historial.
- **Alternativas consideradas**: desactivar `menu_dia.disponible` al
  desactivar el platillo (escritura oculta y propensa a quedar inconsistente);
  excluir el platillo inactivo de la respuesta pública (contradice la spec,
  que pide mostrarlo como no disponible).

## R5. Categorías

- **Decisión**: Lista fija en el backend (`backend/src/config/categorias.ts`):
  `comidas`, `bebidas`, `postres`, `complementos`. zod valida contra esa
  lista; el frontend ofrece un selector con las mismas opciones.
- **Rationale**: La spec asume un catálogo simple sin entidad independiente de
  administración; una constante compartida evita ambigüedad y migraciones.
- **Alternativas consideradas**: tabla `categoria` con CRUD (sobre-ingeniería
  para el MVP); campo de texto libre (pérdida de consistencia en la
  presentación del menú).

## R6. API de gestión del menú

- **Decisión**: Dos grupos de rutas bajo `/api`: `/api/admin/platillos` y
  `/api/admin/menu` (gestión, con `autenticar` + `autorizarRol('administrador')`)
  y `/api/menu` (consulta pública del día). Formato de error idéntico al
  sprint 1 (`{ "error": { "codigo", "mensaje" } }`).
- **Rationale**: Consistencia con los contratos de `auth` y `usuarios`;
  separar consulta pública de gestión simplifica el control de acceso.
- **Alternativas consideradas**: un único prefijo `/api/admin/menu` para todo
  (la consulta pública quedaría protegida o mezclada con la gestión).

## R7. Eliminación de un platillo del menú

- **Decisión**: `DELETE /api/admin/menu/{id}` elimina la entrada del menú de
  un día. Si la entrada está referenciada por pedidos (`pedido_detalle`), se
  responde `409` y no se elimina. Los platillos nunca se borran físicamente:
  se desactivan (`activo = FALSE`).
- **Rationale**: El administrador necesita corregir altas equivocadas del menú
  de hoy; la FK `fk_detalle_menu` protege la integridad con los pedidos de los
  sprints siguientes. La baja lógica preserva el historial (FR-012).
- **Alternativas consideradas**: ocultarlo marcándolo no disponible (no libera
  la restricción de duplicado `uq_menu_fecha_platillo`); borrado físico de
  platillos (destruye el historial de menús pasados).

## R8. Actualización inmediata para el cliente

- **Decisión**: La consulta pública lee la base en cada petición; no se usa
  caché en servidor. El frontend consulta `/api/menu` al montar la página y
  permite refrescar.
- **Rationale**: FR-004/SC-002 exigen que los cambios del administrador se
  reflejen de inmediato; el volumen (una cafetería) no justifica caché.
- **Alternativas consideradas**: caché con TTL (riesgo de mostrar precios
  obsoletos); websockets para empujar cambios (complejidad innecesaria;
  FR-026 de tiempo real aplica a cocina en el sprint 4, no al menú).

## R9. Pruebas

- **Decisión**: Vitest con el patrón del sprint 1 (mock de `pool.execute`):
  `platillos.service.test.ts` (alta, validaciones, duplicados, edición,
  desactivación) y `menu.service.test.ts` (agregar al menú, precio inválido,
  duplicado en el mismo día, disponibilidad, especial, consulta pública
  combinando `disponible` y `activo`, menú vacío del día).
- **Rationale**: Principio V exige pruebas de gestión del menú.
- **Alternativas consideradas**: pruebas de integración contra MySQL real
  (frágiles en CI y lentas; el patrón del sprint 1 ya cubre la lógica).

## R10. Navegación en el frontend

- **Decisión**: `AppRouter` agrega `/admin/platillos` y `/admin/menu`
  (ambas tras `RutaPorRol` de administrador) y el `LayoutPorRol` del
  administrador enlaza a usuarios, platillos y menú. `/menu` deja de ser
  placeholder y consume `/api/menu`.
- **Rationale**: Principio I; consistencia con la navegación existente.
- **Alternativas consideradas**: una sola página admin con pestañas (cambios
  mayores sobre el layout del sprint 1 sin necesidad).
