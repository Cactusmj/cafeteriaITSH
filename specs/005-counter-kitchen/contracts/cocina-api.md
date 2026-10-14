# Contrato de API — Cocina (US2 tablero y avance)

Formato de error común: `{ "error": { "codigo": "string", "mensaje": "..." } }`.
Solo rol cocinero (`401` sin token, `403` otro rol).

## GET `/api/cocina/pedidos`

Tablero: pedidos en "Pagado", "En preparación" y "Listo" de ambos orígenes,
ordenados por llegada (`creado_en` ascendente).

**Respuesta 200**:

```json
{
  "pedidos": [
    {
      "id": 9,
      "numero": "PED-3F8K2QZA",
      "tipo": "mostrador",
      "estado": "Pagado",
      "cliente": "Marta",
      "minutos_en_espera": 6,
      "total": "70.00",
      "creado_en": "2026-11-24T13:02:11",
      "detalle": [
        { "platillo": "Gordita de chicharrón", "cantidad": 2 }
      ]
    }
  ]
}
```

- `cliente`: `cliente_nombre` en mostrador; en anticipados, el nombre del
  dueño; `"Mostrador"` si no hay nombre.
- `minutos_en_espera`: minutos desde `creado_en` (reloj del servidor).
- Lista vacía (`pedidos: []`) si no hay pedidos en flujo; el frontend muestra
  mensaje claro.

## Avance de estados

Se usa `PATCH /api/pedidos/{id}/estado` (ver `mostrador-api.md`): el cocinero
solo puede `En preparación` (desde `Pagado`) y `Listo` (desde `En
preparación`). Respuestas `200` / `400` / `403` / `404` / `409` según contrato.

## Sondeo del frontend

`Cocina.tsx` re-consulta `GET /api/cocina/pedidos` cada 4 segundos y tras cada
acción, con indicador de última actualización. Sin websockets en el MVP.
