import { InsigniaEspecial } from '../ui/InsigniaEspecial'
import type { Categoria } from '../../lib/categorias'
import { ETIQUETA_CATEGORIA } from '../../lib/categorias'

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
      className={`flex flex-col gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm ${
        disponible ? '' : 'opacity-70'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-on-surface">{platillo}</h3>
        <span className="whitespace-nowrap font-heading text-base font-bold text-on-surface">${precio}</span>
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
          <span className="inline-flex min-h-11 items-center rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
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
              −
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
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:brightness-110 disabled:opacity-60"
          >
            Agregar
          </button>
        </div>
      )}
    </article>
  )
}
