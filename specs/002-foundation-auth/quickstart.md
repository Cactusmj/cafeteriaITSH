# Quickstart — Validación del Sprint 1

Guía para validar de punta a punta que el Sprint 1 funciona. No incluye código
de implementación; ver `tasks.md` para las tareas.

## Prerrequisitos

- Node.js LTS y npm.
- MySQL 8.0.16+ corriendo; base `cafeteria_itsh` creada y sembrada (ver
  `docs/ejecutar-migraciones.md`).
- Variables de entorno configuradas en `backend/.env` (`DATABASE_URL` o
  `DB_HOST/DB_USER/DB_PASSWORD/DB_NAME`, `JWT_SECRET`, `PORT`, `SEED_PASSWORD`).
- Dependencias instaladas en `backend/` y `frontend/`.

## Preparar la base de datos

```powershell
cmd /c "mysql -u cafe_admin -p < migrations\001_crear_esquema_mysql.sql"
cmd /c "mysql -u cafe_admin -p < migrations\002_seed_inicial_mysql.sql"
mysql -u cafe_admin -p -D cafeteria_itsh -e "SELECT id, nombre FROM rol;"

# Cuentas base: requiere backend/.env con SEED_PASSWORD definido.
npm --prefix backend run seed:usuarios
mysql -u cafe_admin -p -D cafeteria_itsh -e "SELECT correo, rol_id, activo FROM usuario;"
```

Resultado esperado: roles `administrador`, `cajero`, `cocinero`, `usuario`, y tres
cuentas base (`admin@`, `cajero@`, `cocinero@cafeteria-itsh.mx`) activas.

La contraseña de desarrollo se define en la variable de entorno `SEED_PASSWORD`
(ver `docs/seeds.md`); no se guarda en el repositorio.

## Ejecutar en local

```powershell
# Terminal 1: backend
npm run dev        # en backend/  (API en http://localhost:3000)

# Terminal 2: frontend
npm run dev        # en frontend/ (app en http://localhost:5173)
```

## Escenario 1 — Login por rol (US1)

1. Abrir `http://localhost:5173/` sin sesión → redirige a `/login`.
2. Entrar con credenciales de administrador sembradas → redirige a `/admin`.
3. Cerrar sesión; entrar como cajero → redirige a `/caja`.
4. Con sesión de cajero, navegar manualmente a `/admin` → acceso denegado.
5. Entrar con contraseña incorrecta → mensaje claro sin revelar si la cuenta existe.

Resultado esperado: cada rol llega a su módulo; los accesos cruzados se deniegan;
las credenciales inválidas no revelan información.

## Escenario 2 — Registro de cliente

1. En `/login`, abrir el registro; crear una cuenta con rol cliente.
2. Verificar que se crea y se dirige al área de cliente (`/menu`).
3. Intentar registrar un correo ya existente → mensaje de conflicto.

## Escenario 3 — Alta de usuario operativo (US8)

1. Con sesión de administrador, ir a la gestión de usuarios en `/admin`.
2. Crear un cajero con nombre, correo y contraseña → aparece en la lista.
3. Cerrar sesión e iniciar con el cajero nuevo → entra a `/caja`.
4. Como administrador, editar el nombre del cajero y luego deshabilitarlo.
5. Intentar iniciar sesión con el cajero deshabilitado → acceso denegado.

## Escenario 4 — Seguridad

1. Llamar a `/api/admin/usuarios` sin token → `401`.
2. Llamar con token de cajero → `403`.
3. Revisar la base de datos: `password_hash` no es texto plano.

```powershell
mysql -u cafe_admin -p -D cafeteria_itsh -e "SELECT correo, LEFT(password_hash, 4) AS prefijo FROM usuario;"
```

Resultado esperado: el prefijo corresponde a un hash bcrypt (`$2...`), nunca la
contraseña.

## Puertas de calidad

```powershell
npm test            # en backend/ y en frontend/  (Vitest)
npm run typecheck   # en backend/ y en frontend/ si el script existe (o tsc --noEmit)
```

Resultado esperado: pruebas en verde y sin errores de tipos.
