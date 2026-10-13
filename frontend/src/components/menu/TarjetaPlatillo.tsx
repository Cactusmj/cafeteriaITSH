import type { Categoria } from '../../lib/categorias'
import { ETIQUETA_CATEGORIA } from '../../lib/categorias'

interface Props {
  platillo: string
  categoria: string | null
  descripcion: string | null
  precio: string
  disponible: boolean
  especial: boolean
}

/** Tarjeta de un platillo del menú para la consulta de clientes. */
export function TarjetaPlatillo({ platillo, categoria, descripcion, precio, disponible, especial }: Props) {
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
    </article>
  )
}
