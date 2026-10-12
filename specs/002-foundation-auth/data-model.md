# Phase 1 — Data Model: Sprint 1 — Fundamentos y autenticación

Entidades del sprint, mapeadas a las tablas ya creadas por
`migrations/001_crear_esquema_mysql.sql`. Este sprint **no** modifica el esquema;
documenta las entidades que consume.

## Entidad: Rol (`rol`)

Tipo de usuario que determina permisos y ruta de acceso.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `nombre` | VARCHAR(30) | NOT NULL, UNIQUE |
| `creado_en` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

**Valores sembrados** (`002_seed_inicial_mysql.sql`): `administrador`, `cajero`,
`cocinero`, `usuario`.

> **Mapeo de roles**: la spec habla de "alumno/docente"; en la base de datos el rol
> de cliente se denomina `usuario`. El registro público crea cuentas con rol
> `usuario`; el administrador puede crear cuentas con rol `cajero` o `cocinero`.
> El rol `administrador` se siembra y no se crea desde la API pública ni desde la
> gestión de operativos.
>
> **Constante de rol**: en el código define una única constante
> (p. ej. `ROL_CLIENTE = 'usuario'`) y reutilízala tanto en backend como en
> frontend; no repitas el literal del rol en varios lugares.

## Entidad: Usuario (`usuario`)

Persona que accede al sistema.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT |
| `nombre` | VARCHAR(100) | NOT NULL |
| `correo` | VARCHAR(150) | NOT NULL, UNIQUE |
| `password_hash` | VARCHAR(255) | NOT NULL (nunca texto plano) |
| `activo` | BOOLEAN | NOT NULL, DEFAULT TRUE |
| `rol_id` | INT | NOT NULL, FOREIGN KEY → `rol(id)` |
| `creado_en` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `actualizado_en` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP (trigger `trg_usuario_actualizado`) |

**Relaciones**:
- `usuario.rol_id` → `rol.id` (muchos a uno). Cada usuario tiene exactamente un rol.

**Reglas de validación** (derivadas de FR-001, FR-002, FR-005, FR-008):
- `nombre`: obligatorio, texto no vacío, longitud ≤ 100.
- `correo`: obligatorio, formato de correo válido, único, longitud ≤ 150.
- `password`: obligatorio en el registro/alta, longitud mínima definida por la
  implementación (≥ 8), nunca se almacena ni se registra en claro.
- `rol_id`: obligatorio; debe existir en `rol`.
- `activo`: por defecto `true`; una cuenta inactiva no puede iniciar sesión.

## Entidad: Sesión (JWT, no persistida)

Credencial emitida tras un inicio de sesión válido.

- **Contenido (payload)**: `id` de usuario, `rol` (nombre del rol), y metadatos
  estándar (`iat`, `exp`).
- **Firma**: HS256 con `JWT_SECRET` desde variables de entorno.
- **Transporte**: encabezado `Authorization: Bearer <token>`.
- **Persistencia**: no se guarda en base de datos; el frontend conserva el token
  en `localStorage` y lo limpia al cerrar sesión.

## Repositorios / entidades afectadas por historia

| Historia | Entidades que usa |
|---|---|
| US1 (Autenticación y acceso por rol) | Usuario, Rol, Sesión |
| US8 (Gestión de usuarios operativos) | Usuario, Rol |
| Infraestructura | Rol, Usuario (seed) |

## Fuera de alcance del modelo (otros sprints)

`platillo`, `menu_dia`, `pedido`, `pedido_detalle`, `estado_pedido`,
`transicion_estado`, `pedido_estado_historial`, `pago`, `notificacion` existen en
el esquema pero pertenecen a los sprints 2–5.
