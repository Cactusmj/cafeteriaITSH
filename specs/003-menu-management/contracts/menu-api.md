# Contrato de API — Menú del día (US2 gestión, US3 consulta)

Dos grupos: gestión (`/api/admin/menu`, solo administrador) y consulta
pública (`/api/menu`, sin autenticación). Formato de error común idéntico al
sprint 1:

```json
{ "error": { "codigo": "string", "mensaje": "texto claro sin detalles internos" } }
```

## Consulta pública

### GET `/api/menu`

Devuelve el menú de la fecha actual del servidor.

**Autenticación**: ninguna.

**Query opcional**: `?fecha=YYYY-MM-DD` (principalmente para pruebas y
administración; la app de clientes usa la fecha actual).

**Respuesta 200** (siempre, aunque el menú esté vacío):

```json
{
  "fecha": "2026-10-13",
  "platillos": [
    {
      "id": 10,
      "platillo": "Enchiladas verdes",
      "categoria": "comidas",
      "descripcion": "Porción de dos enchiladas con arroz y frijoles",
      "precio": "65.00",
      "disponible": true,
      "especial": false
    }
  ]
}
```

- `disponible` es la disponibilidad **efectiva**: `menu_dia.disponible` y
  `platillo.activo` (FR-005). Un platillo desactivado que sigue en el menú se
  muestra con `disponible: false`.
- `id` es el identificador de la entrada del menú (`menu_dia.id`), el que se
  usará en el sprint 3 para pedir.
- Orden: por categoría, especiales primero, luego por nombre.
- `platillos: []` cuando no hay menú publicado ese día; el frontend muestra un
  mensaje claro (FR-011).

## Gestión (solo administrador)

### GET `/api/admin/menu`

Lista las entradas del menú de una fecha.

**Query**: `?fecha=YYYY-MM-DD` (opcional; por defecto la fecha actual).

**Respuesta 200**:

```json
{
  "fecha": "2026-10-13",
  "entradas": [
    {
      "id": 10,
      "fecha": "2026-10-13",
      "platillo_id": 1,
      "platillo": "Enchiladas verdes",
      "categoria": "comidas",
      "precio": "65.00",
      "disponible": true,
      "especial": false,
      "platillo_activo": true
    }
  ]
}
```

### POST `/api/admin/menu`

Agrega un platillo al menú de una fecha.

**Cuerpo**:

```json
{ "fecha": "YYYY-MM-DD", "platillo_id": 1, "precio": "65.00", "especial": false }
```

`fecha` opcional (por defecto la fecha actual). `disponible` nace en `true`.

**Respuestas**:

| Código | Descripción |
|---|---|
| 201 | Entrada creada (devuelve la entrada con `id`) |
| 400 | Datos inválidos: fecha mal formada, precio no numérico o ≤ 0 (error `VALIDACION`) |
| 401 | Sin sesión |
| 403 | Rol distinto de administrador |
| 404 | `platillo_id` inexistente (error `NO_ENCONTRADO`) |
| 409 | El platillo ya está en el menú de esa fecha (error `DUPLICADO`) o está inactivo (error `PLATILLO_INACTIVO`) |

### PUT `/api/admin/menu/{id}`

Actualiza precio, disponibilidad o marca de especial de una entrada del menú.

**Cuerpo** (campos opcionales): `{ "precio": "70.00", "disponible": false, "especial": true }`

**Respuestas**: `200` (devuelve la entrada), `400` validación, `403` rol,
`404` no encontrado.

> Cambiar `disponible` no requiere que el platillo siga activo; la
> disponibilidad efectiva para el cliente sigue exigiendo ambos.

### DELETE `/api/admin/menu/{id}`

Elimina la entrada del menú de un día (corrección de altas equivocadas).

**Respuestas**:

| Código | Descripción |
|---|---|
| 200 | Entrada eliminada (devuelve `{ "eliminado": true }`) |
| 401 | Sin sesión |
| 403 | Rol distinto de administrador |
| 404 | No encontrado |
| 409 | La entrada está referenciada por pedidos existentes (error `REFERENCIADO`; mensaje: "No se puede eliminar: existen pedidos con este platillo") |

## Códigos HTTP usados

`200` consulta/edición, `201` creación, `400` validación, `401` sin
autenticar, `403` sin permiso, `404` no encontrado, `409` conflicto
(duplicado, platillo inactivo o referenciado por pedidos).
