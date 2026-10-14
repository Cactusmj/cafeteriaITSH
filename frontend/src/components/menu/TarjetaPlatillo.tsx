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
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-slate-300 bg-white px-3 text-base font-semibold text-slate-900 hover:bg-slate-100'

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
      className={`flex flex-col gap-2 rounded border bg-white p-4 ${
        disponible ? 'border-slate-200' : 'border-slate-200 opacity-70'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">{platillo}</h3>
        <span className="whitespace-nowrap text-base font-semibold text-slate-900">${precio}</span>
      </div>

      {etiquetaCategoria && (
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {etiquetaCategoria}
        </span>
      )}

      {descripcion && <p className="text-sm text-slate-600">{descripcion}</p>}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {especial && (
          <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
            Especial del día
          </span>
        )}
        {!disponible && (
          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
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
            <span aria-label={`Cantidad de ${platillo}`} className="min-w-6 text-center text-base font-semibold text-slate-900">
              {cantidad}
            </span>
          )}
          <button
            type="button"
            onClick={onAgregar}
            disabled={!disponible}
            aria-label={`Agregar ${platillo} al carrito`}
            className="inline-flex min-h-11 items-center justify-center rounded bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            Agregar
          </button>
        </div>
      )}
    </article>
  )
}
