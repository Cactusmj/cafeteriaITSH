# Phase 0 — Research: Sprint 3 — Pedido anticipado y pago

Decisiones técnicas para resolver las incógnitas del Technical Context. El
stack (TypeScript, Express, `mysql2`, zod, Vitest, Tailwind) ya está
establecido por la constitución y los sprints 1–2; aquí se documentan las
decisiones propias del dominio de pedidos y pagos.

## R1. Esquema de datos

- **Decisión**: Consumir las tablas `pedido`, `pedido_detalle`, `pago`,
  `pedido_estado_historial`, `estado_pedido` y `transicion_estado` tal como las
  crean `migrations/001` y siembran `migrations/002`. Única migración del
  sprint: `003_clave_idempotencia_pedido.sql` agrega
  `pedido.clave_idempotencia VARCHAR(36) NULL` con índice único (MySQL admite
  varios `NULL` en un índice único).
- **Rationale**: El esquema ya modela pedidos anticipados (con
  `chk_pedido_anticipado` que exige `usuario_id` y `fecha_recoleccion`), el
  detalle por `menu_dia_id`, el pago único por pedido (`pago.pedido_id UNIQUE`)
  y la máquina de estados sembrada en `002`. La clave de idempotencia es lo
  único que falta para cumplir FR-010 sin deduplicación heurística.
- **Alternativas consideradas**: deduplicar por (usuario, carrito, minutos
  recientes) — frágil y ambiguo; tabla separada de idempotencia —
  sobre-ingeniería para un MVP; no cubrir FR-010 — contradice la spec.

## R2. Folio del pedido (`pedido.numero`)

- **Decisión**: Folio con formato `PED-` + 8 caracteres alfanuméricos en
  mayúsculas generados con `crypto.randomUUID` (runtime de Node, sin
  dependencias). Ante colisión del índice único, se reintenta hasta 3 veces y
  luego se responde error interno.
- **Rationale**: `numero` es `VARCHAR(20) UNIQUE`; generar el folio antes del
  `INSERT` evita un segundo `UPDATE` y una ventana de folio provisional. 8
  caracteres dan margen de colisión despreciable en el volumen de una
  cafetería, y el reintento cubre el caso extremo.
- **Alternativas consideradas**: `PED-{insertId}` (requiere insertar con
  placeholder y actualizar, con carrera entre concurrentes); secuencia por tabla
  (migración y bloqueos innecesarios); UUID completo (no cabe cómodamente en
  `VARCHAR(20)` ni es legible para el cliente).

## R3. Regla de los 10 minutos y reloj

- **Decisión**: El servidor valida `fecha_recoleccion >= NOW() + 10 minutos`
  usando la hora del servidor MySQL/Node (misma fuente de verdad que R3 del
  sprint 2). Se rechaza también cualquier horario anterior al momento de la
  confirmación. Error `400 ANTICIPACION_INSUFICIENTE` con mensaje claro.
- **Rationale**: FR-003/SC-001 exigen el mínimo absoluto; confiar en la hora
  del cliente permitiría saltarse la regla.
- **Alternativas consideradas**: validar solo en el cliente (insuficiente);
  zona horaria configurable (fuera de alcance; una sola cafetería en el
  plantel).

## R4. Recálculo de precios y disponibilidad en el servidor

- **Decisión**: Al crear el pedido, el servidor vuelve a leer las entradas del
  menú de hoy por `menu_dia_id`, exige `menu_dia.disponible AND
  platillo.activo`, toma el `precio` de la base (ignora el precio del cliente)
  y recalcula `subtotal` y `total`. Si alguna entrada no está disponible →
  `409 PLATILLO_NO_DISPONIBLE` y no se crea el pedido.
- **Rationale**: FR-002 y FR-004 exigen total con precios vigentes y rechazo
  de no disponibles incluso cuando cambian entre la selección y la
  confirmación (edge case de la spec). FR-011 fija el precio del detalle al
  momento de confirmar.
- **Alternativas consideradas**: confiar en el total enviado por el cliente
  (manipulable); recalcular en cada consulta posterior (los pedidos ya creados
  deben conservar su precio).

## R5. Estados: nacimiento en "Pendiente" y transición a "Pagado"

- **Decisión**: El pedido se inserta con `estado_id` de `Pendiente`; el pago
  confirmado lo mueve a `Pagado` validando la transición contra
  `transicion_estado` (sembrada en `002`: Pendiente → Pagado y Pendiente →
  Cancelado). Cada cambio registra fila en `pedido_estado_historial` con
  `cambiado_por` = usuario. Las transiciones de cocina (`En preparación`,
  `Listo`) siguen siendo del sprint 4.
- **Rationale**: FR-008 y el Principio IV exigen que el pedido nazca
  `Pendiente` y que solo el pago confirmado lo marque `Pagado`, sin saltarse
  estados; el historial da trazabilidad (FR-014).
- **Alternativas consideradas**: crear el pedido directamente en `Pagado`
  (contradice FR-007); validar transiciones solo en la aplicación sin consultar
  `transicion_estado` (duplica la regla sembrada en la base).

## R6. Abstracción del proveedor de pago (sandbox)

- **Decisión**: Interfaz interna `ProveedorPago` con un único método
  `procesarPago({ numero, monto, referenciaSugerida })` que devuelve
  `{ aprobado, referencia, mensaje? }`. Implementación por defecto
  `ProveedorPagoSandbox`: aprueba siempre (simula un proveedor externo) salvo
  que se use el modo de prueba de fallo. El proveedor se elige con
  `PAYMENT_PROVIDER` (por defecto `sandbox`); la llave vive en
  `PAYMENT_API_KEY` (ya prevista por la constitución, hoy sin usar). Este
  sprint solo se implementa el sandbox; la interfaz deja el punto de extensión
  para un proveedor real sin tocar la lógica de pedidos.
- **Rationale**: La spec asume un servicio externo cuyo proveedor aún no está
  definido; el sandbox permite validar todo el flujo (aprobado y rechazado)
  localmente y en la demo, cumpliendo FR-005 a FR-007 sin depender de
  credenciales de terceros.
- **Alternativas consideradas**: integrar ya un proveedor real (requiere
  cuenta y llaves que no existen; bloquea la demo); simular el pago solo en el
  frontend (el servidor quedaría sin registrar la transacción ni validar el
  estado).

## R7. Rechazo del pago y estado del pedido

- **Decisión**: Si el proveedor devuelve `aprobado: false`, el servicio
  responde `402 PAGO_RECHAZADO`, no se inserta fila en `pago` ni cambia el
  estado; el pedido permanece `Pendiente` y el cliente puede reintentar. Solo
  se persiste `pago` cuando el proveedor aprueba (`metodo = 'online'`,
  `monto = total`, `referencia` del proveedor).
- **Rationale**: FR-007/SC-003/SC-004 exigen que nunca quede `Pagado` sin pago
  confirmado y que un fallo deje el pedido reintentable.
- **Alternativas consideradas**: registrar el pago rechazado en la tabla
  `pago` (mezclaría intentos fallidos con transacciones válidas; `pago` es uno
  por pedido); dejar el pedido en un estado "en pago" (no existe en la máquina
  de estados sembrada).

## R8. Idempotencia de creación y de pago

- **Decisión**: El cliente genera un `clave_idempotencia` (UUID) antes de
  enviar el pedido y lo conserva en un reintento del mismo carrito. El servidor
  intenta el `INSERT`; si el índice único de `clave_idempotencia` detecta un
  duplicado, devuelve el pedido existente con `200` en lugar de `201`. El
  endpoint de pago es idempotente por diseño: un pedido ya `Pagado` responde
  `200` con la misma confirmación (sin duplicar el cobro, gracias a
  `pago.pedido_id UNIQUE`).
- **Rationale**: FR-010/SC-006 exigen cero duplicados ante reconexión o
  pérdida de respuesta; la unicidad en la base es la garantía fuerte, no el
  control del cliente.
- **Alternativas consideradas**: bloqueo pesimista por usuario (degrada la
  experiencia y no cubre reintentos con sesión renovada); memoria del servidor
  (se pierde al reiniciar).

## R9. API de pedidos

- **Decisión**: Un grupo de rutas bajo `/api/pedidos` con `autenticar` +
  `autorizarRol(ROL.CLIENTE)` para creación y pago; `GET /api/pedidos/{id}`
  admite también al administrador (dueño o admin). Formato de error idéntico a
  los sprints anteriores (`{ "error": { "codigo", "mensaje" } }`). Códigos:
  `400 VALIDACION` / `400 ANTICIPACION_INSUFICIENTE`, `401`, `403`, `404`,
  `409 PLATILLO_NO_DISPONIBLE` / `409 ESTADO_INVALIDO`, `402 PAGO_RECHAZADO`.
- **Rationale**: Consistencia con `auth`, `usuarios` y `menu`; separar el
  dominio de pedidos del menú evita mezclar gestión con operación del cliente.
- **Alternativas consideradas**: prefijo `/api/clientes/pedidos` (más
  verboso); un solo `POST /api/pedidos` que cree y cobre de una vez (no deja
  reintentar el pago ni cumple "el pago forma parte del flujo" con estados
  claros).

## R10. Horarios de recolección

- **Decisión**: El backend solo valida el mínimo de 10 minutos y que el
  horario no esté en el pasado; admite cualquier `fecha_recoleccion` del mismo
  día en formato ISO (`YYYY-MM-DDTHH:mm`). El frontend ofrece slots cada 15
  minutos desde `ahora + 15 min` hasta el cierre de la cafetería (por defecto
  17:00, constante en el frontend) para guiar al usuario sin imponer una
  ventana de negocio que la spec no define.
- **Rationale**: La spec define solo el mínimo (supuesto de la spec: mismo día,
  horario de la cafetería); una lista de slots mejora la usabilidad en móvil
  sin complejidad de servidor.
- **Alternativas consideradas**: catálogo de horarios en base de datos
  (entidad nueva sin requerimiento); selector de fecha libre (contradice el
  supuesto de mismo día y la regla de 10 minutos).

## R11. Flujo del frontend

- **Decisión**: `/menu` gana un carrito en estado local (agregar/quitar
  cantidades, botón fijo con el total). Nueva ruta `/confirmar-pedido` tras
  `RutaPorRol` de cliente: resumen del carrito, selector de horario, botón
  "Pagar" (que crea el pedido y procesa el pago) y, tras el éxito, vista de
  confirmación con folio, total y estado. `MisPedidos.tsx` permanece como
  placeholder hasta el sprint 5. `AppRouter` y la prueba de rutas se actualizan.
- **Rationale**: Principio I; separar la confirmación/pago del menú evita una
  página sobrecargada y permite reintentar el pago sin perder el carrito.
- **Alternativas consideradas**: todo en una sola página `/menu` (mucho
  contenido en una pantalla chica, poco práctico en receso); checkout en modal
  (menos accesible en móvil y difícil de compartir el estado tras un fallo).

## R12. Pruebas

- **Decisión**: `pedidos.service.test.ts` (mock de `pool.execute`, patrón de
  los sprints 1–2): creación exitosa con recálculo de total, rechazo por
  anticipación insuficiente, por platillo no disponible, por cantidad inválida,
  folio e idempotencia, transición a `Pagado` con historial, pago rechazado
  dejando `Pendiente`, pago repetido idempotente. `permisos.pedidos.test.ts`
  con servidor efímero y tokens `firmar()`: `401` sin token, `403` en roles
  administrador/cajero/cocinero para crear y pagar, `200/201` para cliente.
  Frontend: ampliar `rutas.test.tsx` con `/confirmar-pedido`.
- **Rationale**: Principio V exige pruebas de creación y validación de
  pedidos, cálculo de totales y control de permisos; el patrón mockeado ya
  funciona en verde sin MySQL.
- **Alternativas consideradas**: pruebas contra MySQL real (frágiles y lentas
  en CI; ya descartadas en sprints previos).

## R13. Configuración y despliegue

- **Decisión**: `backend/src/config/env.ts` expone `paymentProvider`
  (`PAYMENT_PROVIDER`, por defecto `sandbox`) y `paymentApiKey`
  (`PAYMENT_API_KEY`, vacío en desarrollo). `backend/.env.example` documenta
  ambas; ningún valor real en el repositorio (Principio III). La guía de
  migraciones (`docs/ejecutar-migraciones.md`) y el `quickstart.md` del sprint
  agregan el paso del script `003`.
- **Rationale**: La constitución ya prevé `PAYMENT_API_KEY`; el modo sandbox
  permite operar sin llaves reales mientras el proveedor se decide.
- **Alternativas consideradas**: llave obligatoria para arrancar (rompe el
  desarrollo local y la demo); leer la llave directamente de `process.env` en
  el servicio (duplica configuración y complica las pruebas).
