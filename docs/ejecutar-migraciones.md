# Cómo ejecutar los scripts de migración

Scripts SQL para crear y sembrar la base de datos del **Sistema de Pedidos Anticipados — Cafetería ITSH** en MySQL 8.0.16 o superior (probado en MySQL 9.6).

## Requisitos

- **MySQL Server** instalado y su servicio corriendo (por ejemplo el servicio `MySQL96`).
- El cliente `mysql.exe` disponible en el PATH. Ruta habitual:
  `C:\Program Files\MySQL\MySQL Server 9.6\bin\mysql.exe`.
- El usuario `cafe_admin` creado en MySQL (ver primer paso).

## Datos de conexión

| Dato | Valor |
| --- | --- |
| Host | `127.0.0.1` |
| Puerto | `3306` |
| Base de datos | `cafeteria_itsh` |
| Usuario | `cafe_admin` |
| Contraseña | definida en `.env` (`DB_PASSWORD`); no se versiona |

El valor real de la contraseña vive en `backend/.env` (variable `DB_PASSWORD`) y
**nunca** en el repositorio. En los comandos de abajo sustituye `<DB_PASSWORD>` por
ese valor (o pásalo desde la variable de entorno).

Si el usuario `cafe_admin` aún no existe en MySQL, créalo una sola vez con el paso siguiente usando un usuario con privilegios de administrador (por ejemplo `root`).

## Paso 1: crear el usuario de la aplicación (una sola vez)

Desde la carpeta del proyecto, en PowerShell o CMD. Se pedirá la contraseña de `root`:

```powershell
mysql -u root -p -e "CREATE USER IF NOT EXISTS 'cafe_admin'@'localhost' IDENTIFIED BY '<DB_PASSWORD>'; CREATE USER IF NOT EXISTS 'cafe_admin'@'127.0.0.1' IDENTIFIED BY '<DB_PASSWORD>'; GRANT ALL PRIVILEGES ON cafeteria_itsh.* TO 'cafe_admin'@'localhost'; GRANT ALL PRIVILEGES ON cafeteria_itsh.* TO 'cafe_admin'@'127.0.0.1'; FLUSH PRIVILEGES;"
```

Se otorgan los permisos sobre `cafeteria_itsh.*` aunque la base todavía no exista; la crea el script `001`.

## Paso 2: ejecutar los scripts de migración

**Importante:** ejecutar `001`, luego `002` y por último `003`. El `001` crea la base de datos y las tablas; el `002` inserta los datos base (roles, estados, transiciones, platillos y menú de ejemplo); el `003` agrega la columna `clave_idempotencia` de `pedido` (sprint 3, evita pedidos duplicados).

Desde CMD, redirigiendo la entrada del archivo con `<`:

```cmd
mysql -u cafe_admin -p < migrations\001_crear_esquema_mysql.sql
mysql -u cafe_admin -p < migrations\002_seed_inicial_mysql.sql
mysql -u cafe_admin -p < migrations\003_clave_idempotencia_pedido.sql
```

Desde PowerShell 5.1 (que no admite el operador `<`), invoca CMD con `cmd /c`:

```powershell
cmd /c "mysql -u cafe_admin -p < migrations\001_crear_esquema_mysql.sql"
cmd /c "mysql -u cafe_admin -p < migrations\002_seed_inicial_mysql.sql"
cmd /c "mysql -u cafe_admin -p < migrations\003_clave_idempotencia_pedido.sql"
```

> No uses `mysql -e "source archivo.sql"`: en MySQL 9.6 el comando `source` solo funciona dentro de la sesión interactiva, no con `-e`.

### Alternativa: sesión interactiva de MySQL

Abre el cliente y ejecuta los scripts desde dentro:

```powershell
mysql -u cafe_admin -p
```

Dentro de la sesión `mysql>`:

```sql
source migrations/001_crear_esquema_mysql.sql
source migrations/002_seed_inicial_mysql.sql
source migrations/003_clave_idempotencia_pedido.sql
```

Si `mysql` no está en el PATH, usa la ruta completa desde CMD:

```cmd
"C:\Program Files\MySQL\MySQL Server 9.6\bin\mysql.exe" -u cafe_admin -p < migrations\001_crear_esquema_mysql.sql
```

## Ejecutar con MySQL Workbench

1. Abre MySQL Workbench y crea una conexión con los datos de la tabla de arriba (host `127.0.0.1`, puerto `3306`, usuario `cafe_admin`).
2. Abre el archivo `migrations/001_crear_esquema_mysql.sql` (File → Open SQL Script).
3. Ejecuta todo el script con el botón del rayo (Execute) o Ctrl+Shift+Enter.
4. Repite con `migrations/002_seed_inicial_mysql.sql` y luego con `migrations/003_clave_idempotencia_pedido.sql`.

## Verificar que todo quedó bien

Lista las tablas de la base de datos:

```powershell
mysql -u cafe_admin -p -D cafeteria_itsh -e "SHOW TABLES;"
```

Debe mostrar 11 tablas: `estado_pedido`, `menu_dia`, `notificacion`, `pago`, `pedido`, `pedido_detalle`, `pedido_estado_historial`, `platillo`, `rol`, `transicion_estado` y `usuario`.

Ver la columna de idempotencia del sprint 3:

```powershell
mysql -u cafe_admin -p -D cafeteria_itsh -e "SHOW COLUMNS FROM pedido LIKE 'clave_idempotencia';"
```

Ver el menú de ejemplo del día:

```powershell
mysql -u cafe_admin -p -D cafeteria_itsh -e "SELECT md.fecha, p.nombre, md.precio, md.especial FROM menu_dia md JOIN platillo p ON p.id = md.platillo_id ORDER BY p.nombre;"
```

> Nota: la opción `-D` se coloca antes de `-e`; si se usa `-e` y `-D` juntas en otro orden, MySQL puede interpretar mal los argumentos.

## Notas

- `001` NO es re-ejecutable tal cual: los `CREATE INDEX` y `CREATE TRIGGER` fallan si ya existen (`Duplicate key name` / `Trigger ... already exists`). Para recrear todo desde cero, elimina la base con `DROP DATABASE cafeteria_itsh;` (como `cafe_admin` o `root`) y vuelve a ejecutar `001` y luego `002`.
- Para que `001` pueda crear los triggers cuando el binary log está habilitado (por defecto en MySQL 8+), el servidor debe tener `log_bin_trust_function_creators = 1`. Como administrador (`root`), ejecuta una vez: `SET GLOBAL log_bin_trust_function_creators = 1;`.
- Ejecuta los scripts con el cliente en UTF-8 (`--default-character-set=utf8mb4`) para no corromper los acentos de los catálogos (p. ej. el estado "En preparación"): con cmd sería `mysql --default-character-set=utf8mb4 -u cafe_admin -p < migrations\00X_....sql`. Si un nombre ya quedó corrupto, corrígelo con `UPDATE estado_pedido SET nombre = 'En preparación' WHERE id = 3;` escrito en UTF-8.
- Los disparadores (triggers) de `001` usan `DELIMITER`. El comando `source` y la redirección con `<` conservan esta directiva; al ejecutar desde Workbench, usa el bloque `DELIMITER` tal como está en el archivo.
- El menú de ejemplo se inserta con la fecha actual (`CURRENT_DATE`). Para tener menú en otro día, ejecuta un `INSERT` manual en `menu_dia` con la fecha deseada.
- A diferencia de PostgreSQL, MySQL no requiere un usuario superusuario del proyecto; se recomienda usar siempre **`cafe_admin`** para el trabajo diario.
