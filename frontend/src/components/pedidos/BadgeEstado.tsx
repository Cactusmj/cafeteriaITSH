import { BellRing, CircleX, Clock, CookingPot, PackageCheck, Wallet, type LucideIcon } from 'lucide-react'

/** Colores de estado según design/DESIGN.md (badges pill, texto blanco). */
const COLOR_POR_ESTADO: Record<string, string> = {
  Pendiente: '#9A3412',
  Pagado: '#1E7A46',
  'En preparación': '#B45309',
  Listo: '#0369A1',
  Entregado: '#166534',
  Cancelado: '#B91C1C',
}

const ICONO_POR_ESTADO: Record<string, LucideIcon> = {
  Pendiente: Clock,
  Pagado: Wallet,
  'En preparación': CookingPot,
  Listo: BellRing,
  Entregado: PackageCheck,
  Cancelado: CircleX,
}

/** Badge pill del estado de un pedido, con icono representativo. */
export function BadgeEstado({ estado }: { estado: string }) {
  const color = COLOR_POR_ESTADO[estado] ?? '#44403C'
  const Icono = ICONO_POR_ESTADO[estado] ?? Clock
  return (
    <span
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      <Icono aria-hidden="true" className="size-4" strokeWidth={2.2} />
      {estado}
    </span>
  )
}
