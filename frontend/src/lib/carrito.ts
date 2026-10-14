const CLAVE_CARRITO = 'cafeteria.carrito'
const CLAVE_PEDIDO = 'cafeteria.clavePedido'

export interface LineaCarrito {
  menu_dia_id: number
  platillo: string
  precio: string
  cantidad: number
}

/** Lee el carrito persistido (vacío si no hay o está corrupto). */
export function leerCarrito(): LineaCarrito[] {
  const crudo = localStorage.getItem(CLAVE_CARRITO)
  if (!crudo) {
    return []
  }
  try {
    const lineas = JSON.parse(crudo) as LineaCarrito[]
    return Array.isArray(lineas) ? lineas : []
  } catch {
    return []
  }
}

/** Persiste el carrito completo. */
export function guardarCarrito(lineas: LineaCarrito[]): void {
  if (lineas.length === 0) {
    localStorage.removeItem(CLAVE_CARRITO)
    return
  }
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(lineas))
}

/** Vacía el carrito. */
export function limpiarCarrito(): void {
  localStorage.removeItem(CLAVE_CARRITO)
}

/** Suma del carrito con dos decimales. */
export function totalCarrito(lineas: LineaCarrito[]): string {
  const total = lineas.reduce((acumulado, linea) => acumulado + Number(linea.precio) * linea.cantidad, 0)
  return total.toFixed(2)
}

/**
 * Clave de idempotencia del pedido en curso: se reutiliza en los reintentos
 * para que el servidor no cree pedidos duplicados (FR-010).
 */
export function leerClavePedido(): string {
  const existente = localStorage.getItem(CLAVE_PEDIDO)
  if (existente) {
    return existente
  }
  const nueva = crypto.randomUUID()
  localStorage.setItem(CLAVE_PEDIDO, nueva)
  return nueva
}

/** Elimina la clave de idempotencia (tras un pago exitoso). */
export function limpiarClavePedido(): void {
  localStorage.removeItem(CLAVE_PEDIDO)
}
