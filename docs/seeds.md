# Cuentas sembradas (seeds)

Cuentas base del Sprint 1 para poder iniciar sesión y validar el sistema.

## Cómo se crean

1. Roles y datos base: `migrations/002_seed_inicial_mysql.sql` (y antes `001`).
2. Cuentas de usuario: el script `backend/scripts/sembrar-usuarios.mjs`, que
   hashea la contraseña con **bcrypt** en tiempo de ejecución.

La contraseña **no** está en el repositorio: se toma de la variable de entorno
`SEED_PASSWORD` (definida en `backend/.env`). El repositorio solo versiona la
plantilla `backend/.env.example`.

```powershell
# en backend/, con dependencias instaladas y backend/.env configurado
npm run seed:usuarios
```

El script es idempotente: omite las cuentas cuyo correo ya existe.

## Cuentas creadas

| Rol | Correo |
|---|---|
| administrador | `admin@cafeteria-itsh.mx` |
| cajero | `cajero@cafeteria-itsh.mx` |
| cocinero | `cocinero@cafeteria-itsh.mx` |

Las tres usan la contraseña indicada en `SEED_PASSWORD` (entorno de desarrollo).

> **Solo para desarrollo.** Define una contraseña local distinta en `backend/.env`
> y cámbiala antes de cualquier uso real. `backend/.env` está en `.gitignore`.

## Verificar

```powershell
mysql -u cafe_admin -p -D cafeteria_itsh -e "SELECT correo, rol_id, activo FROM usuario;"
```

Resultado esperado: tres cuentas con `activo = 1`. El `password_hash` corresponde
a un hash bcrypt (`$2...`), nunca a texto plano.
