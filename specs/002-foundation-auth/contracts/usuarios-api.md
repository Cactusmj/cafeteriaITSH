# Contrato de API — Gestión de usuarios operativos (US8)

Base: `/api/admin/usuarios`. Formato JSON. **Todas** las rutas requieren JWT válido
con rol `administrador` (middleware de autorización por rol).

## GET `/api/admin/usuarios`

Lista cuentas operativas.

**Query opcional**: `?rol=cajero|cocinero` para filtrar.

**Respuesta 200**:

```json
{ "usuarios": [ { "id": 3, "nombre": "...", "correo": "...", "rol": "cajero", "activo": true } ] }
```

## POST `/api/admin/usuarios`

Crea una cuenta operativa.

**Cuerpo**:

```json
{ "nombre": "string (1-100)", "correo": "string (email, <=150)", "password": "string (>=8)", "rol": "cajero|cocinero" }
```

**Respuestas**:

| Código | Descripción | Cuerpo |
|---|---|---|
| 201 | Cuenta creada | `{ "usuario": { "id": 3, "nombre": "...", "correo": "...", "rol": "cajero", "activo": true } }` |
| 400 | Datos inválidos o rol no permitido | error `VALIDACION` |
| 401 | Sin sesión | error `NO_AUTORIZADO` |
| 403 | Rol distinto de administrador | error `PROHIBIDO` |
| 409 | Correo ya registrado | error `CORREO_EN_USO` |

**Notas**: solo se permiten los roles `cajero` y `cocinero`. Intentar crear
`administrador` o `usuario` responde 400.

## PUT `/api/admin/usuarios/{id}`

Edita una cuenta operativa.

**Cuerpo** (campos opcionales):

```json
{ "nombre": "string", "correo": "string", "password": "string", "rol": "cajero|cocinero" }
```

**Respuestas**:

| Código | Descripción |
|---|---|
| 200 | Cuenta actualizada (devuelve el usuario) |
| 400 | Datos inválidos |
| 403 | Rol distinto de administrador |
| 404 | Usuario no encontrado |
| 409 | Correo ya registrado por otro usuario |

## PATCH `/api/admin/usuarios/{id}/estado`

Habilita o deshabilita una cuenta (baja lógica; no se elimina físicamente).

**Cuerpo**:

```json
{ "activo": true }
```

**Respuestas**:

| Código | Descripción |
|---|---|
| 200 | Estado actualizado |
| 400 | Cuerpo inválido |
| 403 | Rol distinto de administrador |
| 404 | Usuario no encontrado |
| 409 | Intento de deshabilitar la propia cuenta del administrador |

## Códigos de estado HTTP usados

- `200` consulta/edición correcta, `201` creación, `204` sin contenido.
- `400` validación, `401` sin autenticar, `403` sin permiso, `404` no encontrado,
  `409` conflicto de unicidad, `500` error interno (mensaje genérico, sin stack).
