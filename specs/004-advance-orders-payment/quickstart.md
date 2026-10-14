# Quickstart — Validación del Sprint 3

Guía para validar de punta a punta el pedido anticipado y su pago. No incluye
código de implementación; ver `tasks.md` para las tareas y `contracts/` para
los detalles de la API.

## Prerrequisitos

- Sprints 1 y 2 completados y validados (usuarios base y menú del día
  publicado con platillos disponibles).
- MySQL 8.0.16+ con la base `cafeteria_itsh`; ejecutar la migración nueva
  **una sola vez** después de `001` y `002`:

  ```powershell
  cmd /c "mysql -u cafe_admin -p < migrations\003_clave_idempotencia_pedido.sql"
  ```

- Dependencias instaladas en `backend/` y `frontend/`; variables de entorno
  configuradas (`backend/.env`, `frontend/.env`). `PAYMENT_PROVIDER` puede
  quedar sin definir (usa `sandbox`).
- `npm test` y `npm run typecheck` en verde en ambos paquetes.

## Ejecutar en local

```powershell
# Terminal 1: backend
npm run dev        # en backend/  (API en http://localhost:3000)

# Terminal 2: frontend
npm run dev        # en frontend/ (app en http://localhost:5173)
```

## Escenario 1 — Crear el pedido (US1, por interfaz)

1. Iniciar sesión como cliente en `/login` → llega a `/menu`.
2. Agregar uno o más platillos disponibles al carrito → el resumen muestra el
   total.
3. Continuar a `/confirmar-pedido` → ver el resumen y elegir un horario de
   recolección disponible (≥ 10 minutos).
4. Confirmar → se crea el pedido `Pendiente` con folio (`PED-…`) y se pasa al
   paso de pago.

## Escenario 2 — Reglas de creación (US1)

1. Elegir un horario a menos de 10 minutos (o en el pasado) → mensaje claro
   `ANTICIPACION_INSUFICIENTE` y no se crea el pedido.
2. Con la consola del navegador o con `Invoke-RestMethod`, enviar un
   `menu_dia_id` marcado no disponible → `409 PLATILLO_NO_DISPONIBLE`.
3. Enviar cantidad `0` o un carrito vacío → `400 VALIDACION`.
4. Verificar con SQL que el total guardado coincide con precio × cantidad de
   las líneas del menú de hoy (el servidor recalcula; el cliente no envía
   total).

```powershell
# Login del cliente para pruebas de API (ajusta credenciales)
$login = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login `
  -ContentType 'application/json' `
  -Body '{"correo":"alumno@cafeteria-itsh.mx","contrasena":"<SEED_PASSWORD>"}'
$token = $login.token

# Pedido con menos de 10 minutos (debe fallar)
$en10 = (Get-Date).AddMinutes(5).ToString('yyyy-MM-ddTHH:mm')
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/pedidos `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType 'application/json' `
  -Body (@{ fecha_recoleccion = $en10; clave_idempotencia = [guid]::NewGuid().ToString()
            items = @(@{ menu_dia_id = 1; cantidad = 1 }) } | ConvertTo-Json)
```

## Escenario 3 — Pago aprobado (US2)

1. En `/confirmar-pedido`, pulsar "Pagar" (sandbox aprueba) → confirmación con
   folio, total y estado `Pagado`.
2. Verificar por API el detalle: `GET /api/pedidos/{id}` → `estado: "Pagado"`,
   `pago.referencia` con prefijo `sbx-`.
3. Consultar en la base que existe una fila en `pago` y dos filas de
   `pedido_estado_historial` (`NULL → Pendiente` y `Pendiente → Pagado`).

```powershell
$detalle = Invoke-RestMethod -Uri http://localhost:3000/api/pedidos/3 `
  -Headers @{ Authorization = "Bearer $token" }
$detalle.estado   # Pagado
$detalle.pago.referencia  # sbx-...
```

## Escenario 4 — Pago rechazado y reintento (US2)

1. Activar el modo de prueba de fallo del sandbox (según `research.md` R6) y
   intentar pagar un pedido `Pendiente` → `402 PAGO_RECHAZADO`; el detalle del
   pedido sigue en `Pendiente` y sin fila en `pago`.
2. Desactivar el modo de fallo y pagar de nuevo → `Pagado` con una sola fila
   de `pago` (SC-004).

## Escenario 5 — Idempotencia (FR-010)

1. Crear un pedido con una `clave_idempotencia` y reenviar exactamente el
   mismo cuerpo → `200` con el **mismo** folio y el mismo `id` (no se crea otro
   pedido).
2. Repetir `POST /api/pedidos/{id}/pago` sobre un pedido ya `Pagado` → `200`
   con la misma confirmación; no se duplica el cobro (SC-006).

## Escenario 6 — Permisos

1. `POST /api/pedidos` y `POST /api/pedidos/{id}/pago` sin token → `401`.
2. Con token de administrador, cajero o cocinero → `403`.
3. `GET /api/pedidos/{id}` con token de otro cliente → `403`; con
   administrador → `200`.

## Escenario 7 — Cambio de precio tras el pedido (FR-011)

1. Con un pedido creado, cambiar el precio de ese platillo en el menú desde
   `/admin/menu`.
2. `GET /api/pedidos/{id}` → el detalle conserva el precio con el que se
   registró.

## Puertas de calidad

```powershell
npm test            # en backend/ y en frontend/  (Vitest)
npm run typecheck   # en backend/ y en frontend/
```

Resultado esperado: pruebas en verde (incluidas las nuevas de pedidos,
pagos y permisos) y sin errores de tipos.

## Demo del sprint (con la patrocinadora)

Flujo visible: consultar `/menu` → seleccionar → confirmar con horario → ver
el rechazo con menos de 10 minutos → pagar → ver la confirmación con folio y
estado `Pagado` (el pedido queda listo para que cocina lo vea en el sprint 4).
