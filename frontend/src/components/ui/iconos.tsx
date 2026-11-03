/* eslint-disable react-refresh/only-export-components */
import {
  CakeSlice,
  ChefHat,
  Coffee,
  Cookie,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import type { Categoria } from '../../lib/categorias'

/** Icono representativo por categoría del menú, con la paleta del proyecto. */
export const ICONO_CATEGORIA: Record<Categoria | 'sin categoria', LucideIcon> = {
  comidas: UtensilsCrossed,
  bebidas: Coffee,
  postres: CakeSlice,
  complementos: Cookie,
  'sin categoria': ChefHat,
}

/** Devuelve el icono de una categoría (con respaldo para claves desconocidas). */
export function iconoCategoria(categoria: string | null): LucideIcon {
  if (categoria && categoria in ICONO_CATEGORIA) {
    return ICONO_CATEGORIA[categoria as Categoria | 'sin categoria']
  }
  return ChefHat
}

interface IconoCategoriaPropiedades {
  categoria: string | null
  className?: string
}

/** Icono de categoría como componente estable (iconos Lucide sin estado). */
export function IconoCategoria({ categoria, className = 'size-5' }: IconoCategoriaPropiedades) {
  // Los iconos Lucide son estáticos y sin estado; es seguro resolverlos en render.
  const Icono = iconoCategoria(categoria)
  // eslint-disable-next-line react-hooks/static-components -- Icono Lucide estático, sin estado que reiniciar.
  return <Icono aria-hidden="true" className={className} strokeWidth={2.2} />
}
