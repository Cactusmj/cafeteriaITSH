import { Inbox, type LucideIcon } from 'lucide-react'
import { Boton } from './Boton'

interface EstadoVacioPropiedades {
  titulo: string
  descripcion?: string
  textoReintentar?: string
  onReintentar?: () => void
  icono?: LucideIcon
}

/** Estado centrado de carga/vacío/error con icono cálido y acción opcional. */
export function EstadoVacio({ titulo, descripcion, textoReintentar = 'Reintentar', onReintentar, icono: Icono = Inbox }: EstadoVacioPropiedades) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-8 text-center shadow-sm">
      <span
        aria-hidden="true"
        className="inline-flex min-h-14 min-w-14 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container"
      >
        <Icono className="size-7" strokeWidth={2} />
      </span>
      <p className="mt-3 font-heading text-lg font-bold text-on-surface">{titulo}</p>
      {descripcion && <p className="mt-1 max-w-md text-sm text-on-surface-variant">{descripcion}</p>}
      {onReintentar && (
        <div className="mt-4">
          <Boton variante="secundario" onClick={onReintentar}>
            {textoReintentar}
          </Boton>
        </div>
      )}
    </div>
  )
}
