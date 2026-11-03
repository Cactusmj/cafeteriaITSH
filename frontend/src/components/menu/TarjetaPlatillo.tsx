import { Ban, Minus, ShoppingCart } from 'lucide-react'
import { InsigniaEspecial } from '../ui/InsigniaEspecial'
import type { Categoria } from '../../lib/categorias'
import { ETIQUETA_CATEGORIA } from '../../lib/categorias'
import { IconoCategoria } from '../ui/iconos'

interface Props {
  platillo: string
  categoria: string | null
  descripcion: string | null
  precio: string
  disponible: boolean
  especial: boolean
  cantidad?: number
  onAgregar?: () => void
  onQuitar?: () => void
}

const claseBotonCantidad =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-outline bg-surface-container-lowest px-3 text-base font-semibold text-on-surface hover:bg-surface-container'

/** Tarjeta de un platillo del menú para la consulta de clientes. */
export function TarjetaPlatillo({
  platillo,
  categoria,
  descripcion,
  precio,
  disponible,
  especial,
  cantidad = 0,
  onAgregar,
  onQuitar,
}: Props) {
  const etiquetaCategoria = categoria && categoria in ETIQUETA_CATEGORIA
    ? ETIQUETA_CATEGORIA[categoria as Categoria]
    : categoria

  return (
    <article
      className={`group flex flex-col gap-2 rounded-xl border bg-surface-container-lowest p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        disponible ? 'border-outline-variant' : 'border-outline-variant opacity-70'
      } ${especial ? 'ring-1 ring-tertiary/40' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className={`mt-0.5 inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl ${
              especial ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-secondary-container text-on-secondary-container'
            }`}
          >
            <IconoCategoria categoria={categoria} />
          </span>
          <h3 className="text-base font-semibold text-on-surface">{platillo}</h3>
        </div>
        <span className="whitespace-nowrap rounded-full bg-primary-container px-2.5 py-1 font-heading text-base font-bold text-on-primary-container">${precio}</span>
      </div>

      {etiquetaCategoria && (
        <span className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
          {etiquetaCategoria}
        </span>
      )}

      {descripcion && <p className="text-sm text-on-surface-variant">{descripcion}</p>}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {especial && <InsigniaEspecial />}
        {!disponible && (
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
            <Ban aria-hidden="true" className="size-4" />
            No disponible
          </span>
        )}
      </div>

      {onAgregar && (
        <div className="flex items-center gap-3 pt-2">
          {onQuitar && cantidad > 0 && (
            <button
              type="button"
              onClick={onQuitar}
              aria-label={`Quitar una porción de ${platillo}`}
              className={claseBotonCantidad}
            >
              <Minus aria-hidden="true" className="size-4" strokeWidth={2.4} />
            </button>
          )}
          {cantidad > 0 && (
            <span aria-label={`Cantidad de ${platillo}`} className="min-w-6 text-center font-heading text-base font-bold text-on-surface">
              {cantidad}
            </span>
          )}
          <button
            type="button"
            onClick={onAgregar}
            disabled={!disponible}
            aria-label={`Agregar ${platillo} al carrito`}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            <ShoppingCart aria-hidden="true" className="size-4" strokeWidth={2.2} />
            Agregar
          </button>
        </div>
      )}
    </article>
  )
}
