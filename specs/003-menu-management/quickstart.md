# Quickstart — Validación del Sprint 2

Guía para validar de punta a punta que la gestión y consulta del menú
funcionan. No incluye código de implementación; ver `tasks.md` para las tareas
y `contracts/` para los detalles de la API.

## Prerrequisitos

- Sprint 1 completado y validado (base de datos con roles y usuarios base).
- MySQL 8.0.16+ con la base `cafeteria_itsh` creada y sembrada (ver
  `specs/002-foundation-auth/quickstart.md`).
- Dependencias instaladas en `backend/` y `frontend/`; variables de entorno
  configuradas (`backend/.env`, `frontend/.env`).
- `npm test` y `npm run typecheck` en verde en ambos paquetes.

## Ejecutar en local

```powershell
# Terminal 1: backend
npm run dev        # en backend/  (API en http://localhost:3000)

# Terminal 2: frontend
npm run dev        # en frontend/ (app en http://localhost:5173)
```

## Escenario 1 — Gestión de platillos (US2)

1. Iniciar sesión como administrador en `/login` → llega a `/admin`.
2. Ir a la gestión de platillos (`/admin/platillos`) y crear un platillo con
   nombre, categoría y descripción → aparece en el catálogo.
3. Intentar crear otro platillo con el mismo nombre → mensaje de conflicto.
4. Editar la descripción del platillo → los cambios quedan registrados.
5. Desactivar el platillo → desaparece del catálogo activo.

## Escenario 2 — Publicar el menú del día (US2)

1. Como administrador, abrir la gestión del menú (`/admin/menu`).
2. Agregar el platillo al menú de hoy con un precio válido → aparece en la
   lista del día.
3. Intentar agregar el mismo platillo otra vez al mismo día → conflicto
   (duplicado).
4. Intentar guardar un precio en cero, negativo o no numérico → validación
   clara, sin guardar.
5. Marcar el platillo como especial y ponerlo no disponible → la lista del día
   refleja ambos cambios.
6. Quitar la marca de especial y volver a ponerlo disponible.

## Escenario 3 — Consulta del cliente (US3)

1. Iniciar sesión como cliente (o cualquier rol) y abrir `/menu` → ve el menú de hoy con
   nombre, precio y categorías.
2. Verificar que el platillo marcado especial aparece identificado como
   especial.
3. Verificar que el platillo no disponible aparece identificado como no
   disponible.
4. En otra pestaña, el administrador cambia el precio y la disponibilidad;
   al recargar `/menu` (o volver a abrirlo) se ven los valores nuevos sin
   esperas perceptibles.
5. Consultar un día sin menú publicado (`/api/menu?fecha=2000-01-01`) →
   lista vacía; en la interfaz de clientes, mensaje claro de "sin menú".

## Escenario 4 — Permisos

1. Llamar a `/api/admin/platillos` y `/api/admin/menu` sin token → `401`.
2. Llamar con token de cajero o cliente → `403`.
3. `GET /api/menu` sin token → `200`.

```powershell
# Ejemplo con PowerShell (sin token)
Invoke-WebRequest -Uri http://localhost:3000/api/menu -UseBasicParsing
```

## Escenario 5 — Baja lógica vs. menú (FR-012)

1. Con un platillo en el menú de hoy, desactivarlo desde `/admin/platillos`.
2. Verificar que en `/menu` sigue visible pero como no disponible.
3. Intentar agregarlo al menú de otro día → conflicto `PLATILLO_INACTIVO`.

## Puertas de calidad

```powershell
npm test            # en backend/ y en frontend/  (Vitest)
npm run typecheck   # en backend/ y en frontend/
```

Resultado esperado: pruebas en verde (incluidas las nuevas de platillos y
menú) y sin errores de tipos.
