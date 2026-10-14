# Quickstart — Validación del Sprint 4

Guía para validar mostrador, cocina y cierre del ciclo. Ver `tasks.md` y
`contracts/` para detalles. Sin migraciones nuevas (esquema de los sprints
1–3).

## Prerrequisitos

- Sprints 1–3 completados (usuarios base, menú del día, pedidos anticipados).
- MySQL con `cafeteria_itsh` y menú publicado hoy; dependencias y `.env`
  configurados; `npm test` y `npm run typecheck` en verde.

## Ejecutar en local

```powershell
npm run dev   # en backend/  (http://localhost:3000)
npm run dev   # en frontend/ (http://localhost:5173)
```

## Escenario 1 — Captura y cobro (US1, por interfaz)

1. Iniciar sesión como cajero → `/caja`.
2. Seleccionar platillos disponibles con cantidades → ver el total.
3. Anotar nombre de cliente (opcional) y pulsar "Cobrar" indicando el monto
   recibido → folio, estado "Pagado" y cambio a devolver.
4. Intentar cobrar con monto menor que el total → rechazo claro, sigue
   "Pendiente".

## Escenario 2 — Reglas de mostrador (US1, API)

1. `POST /api/pedidos/mostrador` con `menu_dia_id` no disponible → `409
   PLATILLO_NO_DISPONIBLE`.
2. Repetir la creación con la misma `clave_idempotencia` → `200` mismo pedido.
3. `POST /api/pedidos/{id}/cobro` dos veces seguidas → un solo cobro (segunda
   `200` idempotente, una fila en `pago`).
4. Cobrar un anticipado desde caja → `409 ESTADO_INVALIDO`.

## Escenario 3 — Cocina (US2, por interfaz)

1. Con anticipados "Pagados" y mostrador cobrado, abrir `/cocina` como
   cocinero → una sola lista ordenada por llegada con productos y cantidades.
2. "Iniciar preparación" en un "Pagado" → pasa a "En preparación".
3. Intentar "Marcar listo" directo desde "Pagado" (otro pedido) → rechazo.
4. "Marcar listo" desde "En preparación" → "Listo".
5. Dejar la pantalla abierta y crear un pedido nuevo → aparece sin recargar
   (sondeo con indicador de actualización).

## Escenario 4 — Entrega y cancelación (US3)

1. Como cajero, en `/caja` pendientes, marcar "Entregado" un "Listo" →
   desaparece de pendientes; intentar cambiarlo de nuevo → `409`.
2. Cancelar un mostrador "Pendiente" (error de captura) → "Cancelado".
3. Cancelar un anticipado "Pagado" → "Cancelado" con historial (sin devolución
   en el MVP).

## Escenario 5 — Permisos

1. Sin token → `401` en los 4 endpoints nuevos.
2. Cliente (`usuario`) en mostrador/cocina/caja → `403`.
3. Cajero en `GET /api/cocina/pedidos` y `PATCH` a "En preparación" → `403`;
   cocinero en cobro/entrega → `403`.
4. Administrador en tablero de cocina → `403` (operativo, no admin).

## Escenario 6 — Convivencia

1. Crear un anticipado (cliente) y un mostrador (cajero) a la vez → ambos
   "Pagados" visibles en cocina ordenados por llegada, sin interferirse.
2. Verificar en base: historiales completos de ambos pedidos.

## Puertas de calidad

```powershell
npm test            # en backend/ y en frontend/  (Vitest)
npm run typecheck   # en backend/ y en frontend/
```

Resultado esperado: todo en verde, incluidas las pruebas de mostrador,
transiciones, tablero y permisos.

## Demo del sprint (con la patrocinadora)

Flujo visible: cajero captura y cobra en `/caja` → cocina lo ve y avanza en
`/cocina` sin recargar → cajero entrega → pedido "Entregado"; un salto de
estado se rechaza en vivo.
