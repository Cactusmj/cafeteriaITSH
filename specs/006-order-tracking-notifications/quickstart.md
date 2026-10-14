# Quickstart — Validación del Sprint 5

Guía para validar seguimiento, avisos, pulido y el flujo completo del MVP.
Ver `tasks.md` y `contracts/` para detalles.

## Prerrequisitos

- Sprints 1–4 completados (usuarios, menú, pedidos, pagos, mostrador,
  cocina).
- MySQL con `cafeteria_itsh`; aplicar la migración nueva **una sola vez**:

  ```powershell
  cmd /c "mysql -u cafe_admin -p < migrations\004_avisos_app.sql"
  ```

- Dependencias y `.env` configurados; `npm test` y `npm run typecheck` en
  verde.

## Ejecutar en local

```powershell
npm run dev   # en backend/  (http://localhost:3000)
npm run dev   # en frontend/ (http://localhost:5173)
```

## Escenario 1 — Mis pedidos (US1, por interfaz)

1. Como cliente con pedidos en varios estados, abrir `/mis-pedidos` → lista
   del más reciente al más antiguo con folio, estado y total.
2. Abrir el detalle de uno → platillos, cantidades, precios y total.
3. Como cliente sin pedidos (cuenta nueva) → mensaje claro.
4. Avanzar un estado en cocina/caja y volver a consultar → estado vigente.

## Escenario 2 — Aviso de listo (US2, API + interfaz)

1. Llevar un anticipado a "Listo" (cocina) → `GET /api/avisos` del dueño
   muestra el aviso `enviada`.
2. Llevar otro pedido a "En preparación" → no genera aviso.
3. Pasar a "Listo" un mostrador sin dueño → no genera aviso.
4. En `/mis-pedidos`, ver el banner destacado y pulsar "Marcar como vistos"
   → `PATCH /api/avisos/vistos` responde `actualizados: N` y el banner
   desaparece.
5. Verificar en base una sola fila en `notificacion` por pedido listo.

## Escenario 3 — Permisos

1. Sin token → `401` en los 3 endpoints.
2. Otro cliente en `GET /api/pedidos/{id}` ajeno → `403`; en
   `/api/mis-pedidos` solo ve lo propio.
3. Cajero/cocinero en `/api/mis-pedidos` y `/api/avisos` → `403`.

## Escenario 4 — Pulido

1. Abrir `/mis-pedidos`, `/menu`, `/caja`, `/cocina` → badges de estado con
   los colores de `design/DESIGN.md`, áreas ≥ 44 px, sin cambios de
   navegación.
2. Móvil y escritorio legibles.

## Escenario 5 — Flujo completo del MVP (demo final)

menú → selección → pedido → pago → cocina → preparación → listo → aviso →
recogida (marcar "Entregado" en caja). Cada paso visible con su folio y
estado; el aviso aparece al pasar a "Listo".

## Puertas de calidad

```powershell
npm test            # en backend/ y en frontend/  (Vitest)
npm run typecheck   # en backend/ y en frontend/
npm run lint        # en frontend/
```

Resultado esperado: todo en verde, incluidas las pruebas de avisos,
seguimiento y permisos.
