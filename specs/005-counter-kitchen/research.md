# Phase 0 — Research: Sprint 4 — Mostrador (cajero) y cocina

Decisiones técnicas propias del dominio operativo. El stack y los patrones
(servicios con `pool` simulado, `crearApp()` + `firmar()` para permisos,
`RutaPorRol`, `api<T>()`) vienen de los sprints 1–3.

## R1. Esquema de datos

- **Decisión**: Sin migraciones. Se consumen `pedido` (tipo, `cliente_nombre`,
  `fecha_recoleccion` nula en mostrador, `creado_por`), `pedido_detalle`,
  `pago` (método "efectivo"), `estado_pedido` + `transicion_estado` (sembradas
  en `002`) y `pedido_estado_historial`.
- **Rationale**: El esquema del sprint 1 ya modela ambos orígenes y todos los
  estados; la restricción `chk_pedido_anticipado` solo exige usuario y fecha
  para anticipados.
- **Alternativas consideradas**: migración aditiva (innecesaria; todo lo
  requerido existe).

## R2. Creación y cobro de mostrador en dos pasos

- **Decisión**: `POST /api/pedidos/mostrador` crea el pedido "Pendiente" (con
  `clave_idempotencia` igual que en anticipados); `POST
  /api/pedidos/{id}/cobro` registra el efectivo y lo pasa a "Pagado". El
  frontend de caja puede encadenarlos en un solo botón ("Cobrar") sin perder
  la separación.
- **Rationale**: Separa validación de captura y de dinero; permite reintentar
  el cobro, impide el doble cobro (`pago.pedido_id UNIQUE`) y reutiliza el
  patrón de idempotencia del sprint 3 (FR-004, SC-005).
- **Alternativas consideradas**: un solo endpoint crea+cobra (no deja
  reintentar el cobro ni auditar la captura previa).

## R3. Nacimiento en "Pagado" y monto recibido

- **Decisión**: El cobro exige `monto_recibido >= total`; responde el `cambio`
  calculado (`recibido − total`, dos decimales). Solo con cobro confirmado se
  inserta `pago` (método "efectivo", `monto` = total, `referencia` =
  `efectivo-{folio}`, `registrado_por` = cajero) y el pedido pasa a "Pagado"
  con historial. `monto_recibido` no se persiste (dato operativo efímero).
- **Rationale**: FR-003/SC-005; la referencia trazable identifica el cobro sin
  columnas nuevas.
- **Alternativas consideradas**: persistir el monto recibido (columna nueva sin
  requerimiento); permitir cobro parcial (contradice "sin cobro no avanza").

## R4. Endpoint único de transiciones con matriz de roles

- **Decisión**: `PATCH /api/pedidos/{id}/estado` con cuerpo `{ estado }`. La
  transición se valida contra `transicion_estado`; además cada rol solo puede
  los destinos de su matriz: cocinero → "En preparación", "Listo"; cajero →
  "Entregado", "Cancelado". Otro rol o destino ajeno → `403`; transición
  inexistente en la tabla → `409 ESTADO_INVALIDO`; pedido "Entregado" o
  "Cancelado" → `409` siempre.
- **Rationale**: FR-007 a FR-010, FR-013; una sola regla en el servidor evita
  que el cliente "salte" estados manipulando llamadas.
- **Alternativas consideradas**: un endpoint por transición (verboso; N rutas
  para la misma regla); validar solo en el cliente (manipulable).

## R5. Tableros de lectura

- **Decisión**: `GET /api/cocina/pedidos` (cocinero): pedidos en "Pagado", "En
  preparación" y "Listo", ordenados por `creado_en`, con detalle
  (platillo/cantidad) y minutos en espera; una sola consulta con JOIN.
  `GET /api/caja/pendientes` (cajero): pedidos "Listo" (ambos orígenes, para
  entregar) más mostrador "Pendiente"/"Pagado" (para cobrar), con folio,
  total, nombre de cliente y estado.
- **Rationale**: FR-006, SC-002; cada rol ve exactamente lo que debe operar.
- **Alternativas consideradas**: un solo endpoint para ambos roles (mezcla
  permisos y payloads); varios endpoints por estado (N llamadas por pantalla).

## R6. Actualización de cocina por sondeo

- **Decisión**: `Cocina.tsx` re-consulta el tablero cada 4 segundos (coincide
  con `design/diseño-cocina.md`) con indicador visible de última
  actualización; las acciones (avanzar estado) refrescan de inmediato. Sin
  websockets en el MVP.
- **Rationale**: FR-011/SC-004; 4 s equilibra frescura y carga en una sola
  cafetería; el patrón `void Promise.resolve().then(cargar)` del repo evita
  `setState` síncrono en effects (eslint react-hooks v7).
- **Alternativas consideradas**: websockets/SSE (complejidad y dependencias
  fuera del MVP); solo refresco manual (contradice FR-011).

## R7. Cancelación solo por cajero

- **Decisión**: Solo el cajero cancela (destinos "Cancelado" desde
  Pendiente/Pagado/En preparación/Listo), con historial y `cambiado_por`. La
  devolución queda fuera del MVP (ajuste manual de caja, supuesto de la spec).
- **Rationale**: FR-010; punto único de control del dinero; evita que cocina
  cancele pedidos cobrados sin registro de caja.
- **Alternativas consideradas**: cancelación por cocinero (rompe el control de
  caja); motivo obligatorio en base (columna nueva sin requerimiento; el
  historial con usuario/fecha basta).

## R8. Nombre de cliente opcional

- **Decisión**: `cliente_nombre` (0–100 caracteres, opcional) en la creación
  de mostrador; se muestra en cocina y en pendientes de caja para identificar
  la entrega.
- **Rationale**: FR-005; evita confusiones al entregar sin costo de esquema.
- **Alternativas consideradas**: folio como único identificador (menos usable
  en fila de mostrador); campo obligatorio (fricción innecesaria).

## R9. Reutilización de validaciones del sprint 3

- **Decisión**: La captura de mostrador reutiliza las reglas de creación
  (disponibilidad efectiva, recálculo de total con precios vigentes, folio
  `PED-…`, idempotencia, historial `NULL → Pendiente`) sin los 10 minutos ni
  el horario. Donde el código lo permita, se extrae un ayudante compartido;
  sin refactors grandes.
- **Rationale**: FR-015 y consistencia entre orígenes; evita duplicar la
  lógica de precios/disponibilidad.
- **Alternativas consideradas**: duplicar la lógica en un servicio aislado
  (divergencia futura); forzar horario en mostrador (contradice el supuesto de
  recogida inmediata).

## R10. Pruebas

- **Decisión**: `mostrador.service.test.ts` (captura OK, total recalculado,
  no disponible, cobro con cambio, monto insuficiente, doble cobro
  idempotente, pendiente sin cobro); `estados.service.test.ts` (avances
  válidos, salto rechazado, Entregado/Cancelado inmutables, matriz de roles);
  `tablero` (orden por llegada, ambos orígenes); `permisos.mostrador-cocina.test.ts`
  (401/403 por rol y endpoint); ampliación de `rutas.test.tsx` (caja/cocina
  por rol).
- **Rationale**: Principio V y SC-007.
- **Alternativas consideradas**: pruebas contra MySQL real (descartadas desde
  el sprint 1).
