# Contrato de API — Platillos (US2)

Base: `/api/admin/platillos`. Formato JSON. **Todas** las rutas requieren JWT
válido con rol `administrador` (middleware `autenticar` + `autorizarRol`).

Formato de error común idéntico al sprint 1:

```json
{ "error": { "codigo": "string", "mensaje": "texto claro sin detalles internos" } }
```

## Lista fija de categorías

`comidas`, `bebidas`, `postres`, `complementos`. El servidor valida la
categoría contra esta lista; el frontend ofrece un selector con las mismas
opciones.

## GET `/api/admin/platillos`

Lista el catálogo. **Query opcional**: `?incluirInactivos=true` para incluir
los platillos desactivados (por defecto solo activos).

**Respuesta 200**:

```json
{
  "platillos": [
    {
      "id": 1,
      "nombre": "Enchiladas verdes",
      "categoria": "comidas",
      "descripcion": "Porción de dos enchiladas con arroz y frijoles",
      "activo": true
    }
  ]
}
```

## POST `/api/admin/platillos`

**Cuerpo**:

```json
{ "nombre": "string (1-100)", "categoria": "comidas|bebidas|postres|complementos", "descripcion": "string (<=500, opcional)" }
```

**Respuestas**:

| Código | Descripción |
|---|---|
| 201 | Creado (devuelve el platillo con `activo: true`) |
| 400 | Datos inválidos (error `VALIDACION`) |
| 401 | Sin sesión |
| 403 | Rol distinto de administrador |
| 409 | Ya existe un platillo activo con ese nombre (error `NOMBRE_EN_USO`) |

## PUT `/api/admin/platillos/{id}`

Edita nombre, categoría o descripción. **Cuerpo**: campos opcionales
mismos de la creación. El campo `activo` no se edita aquí (véase
`PATCH /estado`).

**Respuestas**: `200` (devuelve el platillo), `400` validación, `403` rol,
`404` no encontrado, `409` nombre duplicado activo de otro platillo.

## PATCH `/api/admin/platillos/{id}/estado`

Baja o alta lógica. **Cuerpo**: `{ "activo": true }`.

**Respuestas**:

| Código | Descripción |
|---|---|
| 200 | Estado actualizado (devuelve el platillo) |
| 400 | Cuerpo inválido |
| 403 | Rol distinto de administrador |
| 404 | No encontrado |

> Un platillo desactivado permanece en los menús de días pasados y, si forma
> parte del menú de hoy, la consulta pública lo muestra como no disponible.

## Códigos HTTP usados

`200` consulta/edición, `201` creación, `400` validación, `401` sin
autenticar, `403` sin permiso, `404` no encontrado, `409` conflicto de
unicidad.
