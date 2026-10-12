# Contrato de API — Autenticación (US1)

Base: `/api`. Formato JSON. El token se transporta en `Authorization: Bearer <token>`.

## Formato de error común

```json
{ "error": { "codigo": "string", "mensaje": "texto claro sin detalles internos" } }
```

## POST `/api/auth/register`

Registro público. Solo crea cuentas con rol `usuario` (cliente).

**Autenticación**: ninguna.

**Cuerpo**:

```json
{ "nombre": "string (1-100)", "correo": "string (email, <=150)", "password": "string (>=8)" }
```

**Respuestas**:

| Código | Descripción | Cuerpo |
|---|---|---|
| 201 | Cuenta creada | `{ "token": "jwt", "usuario": { "id": 1, "nombre": "...", "correo": "...", "rol": "usuario" } }` |
| 400 | Datos inválidos | error `VALIDACION` (detalle de campos, sin datos sensibles) |
| 409 | Correo ya registrado | error `CORREO_EN_USO` |

**Notas**: el rol se fuerza a `usuario`; cualquier `rol` enviado se ignora (FR-006a).

## POST `/api/auth/login`

**Autenticación**: ninguna.

**Cuerpo**:

```json
{ "correo": "string", "password": "string" }
```

**Respuestas**:

| Código | Descripción | Cuerpo |
|---|---|---|
| 200 | Sesión iniciada | `{ "token": "jwt", "usuario": { "id": 1, "nombre": "...", "correo": "...", "rol": "administrador" } }` |
| 400 | Datos inválidos | error `VALIDACION` |
| 401 | Credenciales incorrectas | error `CREDENCIALES_INVALIDAS` (mismo mensaje si la cuenta no existe o está inactiva, para no revelar su existencia) |

**Notas**: contraseña verificada con bcrypt; cuenta con `activo = false` no inicia sesión.

## GET `/api/auth/me`

Devuelve la identidad de la sesión actual.

**Autenticación**: requerida (JWT válido).

**Respuestas**:

| Código | Descripción | Cuerpo |
|---|---|---|
| 200 | Sesión válida | `{ "usuario": { "id": 1, "nombre": "...", "correo": "...", "rol": "cocinero" } }` |
| 401 | Token ausente, expirado o inválido | error `NO_AUTORIZADO` |

## POST `/api/auth/logout` (opcional)

**Autenticación**: requerida. Respuesta: `204`. El descarte del token ocurre en el
cliente; el endpoint existe para simetría y auditoría si se requiere.
