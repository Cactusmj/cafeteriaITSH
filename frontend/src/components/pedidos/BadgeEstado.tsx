/** Colores de estado según design/DESIGN.md (badges pill, texto blanco). */
const COLOR_POR_ESTADO: Record<string, string> = {
  Pendiente: '#9A3412',
  Pagado: '#1E7A46',
  'En preparación': '#B45309',
  Listo: '#0369A1',
  Entregado: '#166534',
  Cancelado: '#B91C1C',
}

/** Badge pill del estado de un pedido. */
export function BadgeEstado({ estado }: { estado: string }) {
  const color = COLOR_POR_ESTADO[estado] ?? '#44403C'
  return (
    <span
      className="inline-flex min-h-11 items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {estado}
    </span>
  )
}
