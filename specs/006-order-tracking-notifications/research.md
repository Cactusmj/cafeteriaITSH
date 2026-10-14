# Phase 0 — Research: Sprint 5 — Seguimiento, notificaciones y pulido

Decisiones propias del cierre. Patrones de los sprints 1–4 (servicios con
`pool` simulado, permisos con servidor efímero, `api<T>()`, guards de ruta).

## R1. Migración 004: canal 'app' y estado 'vista'

- **Decisión**: `migrations/004_avisos_app.sql` altera solo los CHECK de
  `notificacion`: `chk_notificacion_canal` admite `'app'` además de
  `correo`/`push`/`sms`; `chk_notificacion_estado` admite `'vista'` además de
  `pendiente`/`enviada`/`fallida`. Implementación con `ALTER TABLE ...
  DROP CHECK` + `ADD CONSTRAINT` (MySQL 8.0.16+).
- **Rationale**: El CHECK actual no permite representar el aviso en-app ni su
  lectura; sin la migración habría que abusar de `push`/`enviada` con otro
  significado. Es aditiva y no toca datos existentes.
- **Alternativas consideradas**: reutilizar `push`/`enviada` con significado
  forzado (ambiguo para el futuro proveedor externo); tabla nueva de avisos
  (duplica `notificacion`, que ya existe para esto).

## R2. Punto de disparo del aviso

- **Decisión**: `avanzarEstado` (sprint 4) llama al módulo de avisos cuando el
  destino confirmado es `"Listo"` y el pedido tiene `usuario_id` (dueño). Sin
  dueño (mostrador anónimo) no se genera nada. Otros destinos no generan.
- **Rationale**: FR-005/FR-006; un solo punto de disparo garantiza el "100 %
  de Listo con dueño". El módulo de pedidos no conoce canales ni proveedores.
- **Alternativas consideradas**: trigger en base de datos (lógica fuera del
  código versionado y difícil de probar con mocks); sondeo desde el módulo de
  avisos (latencia y complejidad innecesarias).

## R3. Módulo de avisos separado con proveedor opcional

- **Decisión**: `services/avisos/avisos.service.ts` con `emitirAvisoListo({ pedidoId, usuarioId })`: siempre inserta la fila en-app (`tipo='pedido_listo'`, `canal='app'`, `estado_envio='enviada'`); después, si hay proveedor externo configurado (`NOTIFICATION_API_KEY` + proveedor), intenta el envío sin bloquear ni revertir lo en-app. Interfaz `ProveedorAvisos` con implementación `Ninguno` por defecto.
- **Rationale**: FR-008/FR-009 y constitución (notificaciones separadas, servicio externo opcional); el fallo externo nunca impide el aviso en-app.
- **Alternativas consideradas**: solo externo (bloquea la demo sin proveedor); solo en-app sin interfaz (cierra la puerta a la extensión futura).

## R4. Lectura de avisos

- **Decisión**: `GET /api/avisos` (dueño o admin) devuelve los avisos del
  cliente ordenados (pendientes primero = `enviada`, luego `vista`); `PATCH
  /api/avisos/vistos` marca como `vista` todos los `enviada` del dueño. El
  frontend muestra banner destacado y botón "Marcar como vistos".
- **Rationale**: FR-007; explícito y testeable; evita marcar como visto algo
  que el cliente no abrió.
- **Alternativas consideradas**: marcado implícito al listar (el cliente
  "vería" avisos sin abrirlos); un endpoint por aviso (verboso para el MVP).

## R5. Lista propia de pedidos

- **Decisión**: `GET /api/mis-pedidos` (dueño) devuelve sus pedidos recientes
  con folio, estado, total, horario y conteo de líneas, ordenados por
  creación descendente; el detalle usa el `GET /api/pedidos/{id}` existente
  (ya restringido al dueño). Sin paginación en el MVP (un cliente tiene
  pocos pedidos).
- **Rationale**: FR-001/FR-002/FR-004; reutiliza el detalle probado del
  sprint 3.
- **Alternativas consideradas**: paginación (innecesaria en el volumen real);
  un solo endpoint con detalle anidado (payload pesado por lista).

## R6. Pulido acotado

- **Decisión**: Nuevo `BadgeEstado.tsx` con los 6 colores de
  `design/DESIGN.md`, usado en MisPedidos (y donde aplique en Caja/Cocina sin
  reestructurar); foco visible y contraste ya existentes se conservan; sin
  cambio de paleta global, tipografías ni navegación (eso es la futura spec
  de rediseño).
- **Rationale**: FR-012; mejora visible de cierre sin el riesgo de un
  rediseño a mitad del MVP.
- **Alternativas consideradas**: aplicar toda la paleta/tipografía ahora
  (equivale al rediseño diferido; riesgo de regresión visual antes de la
  demo final).

## R7. Pruebas

- **Decisión**: `avisos.service.test.ts` (genera al pasar a Listo con dueño;
  no genera en otros destinos; sin dueño no genera; proveedor ausente/fallido
  no bloquea lo en-app; avance a Listo registra historial + aviso);
  `mis-pedidos.test.ts` (solo propios, orden descendente, lista vacía);
  `permisos.avisos.test.ts` (401/403 en los 3 endpoints, cliente ajeno 403);
  ampliación de `rutas.test.tsx` (`/mis-pedidos` por rol).
- **Rationale**: Principio V, FR-013 y SC-005.
- **Alternativas consideradas**: pruebas contra MySQL real (descartadas desde
  el sprint 1).
