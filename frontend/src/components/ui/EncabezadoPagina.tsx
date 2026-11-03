import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EncabezadoPaginaPropiedades {
  icono: LucideIcon
  titulo: string
  descripcion?: string
  accion?: ReactNode
}

/** Encabezado consistente: icono en contenedor cálido + título + descripción. */
export function EncabezadoPagina({ icono: Icono, titulo, descripcion, accion }: EncabezadoPaginaPropiedades) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container shadow-sm"
        >
          <Icono className="size-6" strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-on-surface">{titulo}</h1>
          {descripcion && <p className="text-sm text-on-surface-variant">{descripcion}</p>}
        </div>
      </div>
      {accion && <div className="flex items-center gap-2">{accion}</div>}
    </div>
  )
}
