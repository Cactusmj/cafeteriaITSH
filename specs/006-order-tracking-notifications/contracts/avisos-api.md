# Contrato de API — Seguimiento y avisos (US1, US2)

Formato de error común: `{ "error": { "codigo": "string", "mensaje": "..." } }`.
Todos exigen sesión. Mis pedidos y avisos: dueño o administrador (`401` sin
token; `403` otro cliente en recurso ajeno; ver permisos abajo).

## GET `/api/mis-pedidos`

Lista los pedidos del cliente en sesión, del más reciente al más antiguo.

**Autenticación**: `autenticar` + `autorizarRol('usuario')` (`403` otros
roles; el administrador usa `GET /api/pedidos/{id}` y tableros existentes).

**Respuesta 200**:

```json
{
  "pedidos": [
    {
      "id": 4,
      "numero": "PED-ANTICIPADO",
      "tipo": "anticipado",
      "estado": "Listo",
      "total": "95.00",
      "fecha_recoleccion": "2026-12-10T13:45:00",
      "creado_en": "2026-12-10T12:30:11",
      "lineas": 2
    }
  ]
}
```

Lista vacía (`pedidos: []`) si no tiene pedidos.

## GET `/api/avisos`

Avisos del cliente en sesión (dueño o admin), pendientes primero.

**Respuesta 200**:

```json
{
  "avisos": [
    {
      "id": 3,
      "pedido_id": 4,
      "numero": "PED-ANTICIPADO",
      "tipo": "pedido_listo",
      "canal": "app",
      "estado_envio": "enviada",
      "fecha": "2026-12-10T13:02:00"
    }
  ]
}
```

## PATCH `/api/avisos/vistos`

Marca como `vista` todos los avisos `enviada` del cliente en sesión.

**Respuesta 200**: `{ "actualizados": 2 }` (0 si no había pendientes).

## Detalle del pedido

Se reutiliza `GET /api/pedidos/{id}` (sprint 3, dueño o admin) sin cambios.

## Disparo del aviso

Al confirmar `PATCH /api/pedidos/{id}/estado` con destino `"Listo"` (sprint
4, cocinero), el servidor genera el aviso en-app al dueño (si tiene). La
respuesta del PATCH no cambia. Sin dueño no se genera fila.

## Códigos

`200` todo; `401` sin sesión; `403` rol indebido o recurso ajeno; `404`
`PEDIDO_NO_ENCONTRADO` (heredado donde aplique).
