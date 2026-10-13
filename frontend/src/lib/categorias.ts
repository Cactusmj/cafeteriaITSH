/** Lista fija de categorías (espejo de backend/src/config/categorias.ts). */
export const CATEGORIAS = ['comidas', 'bebidas', 'postres', 'complementos'] as const

export type Categoria = (typeof CATEGORIAS)[number]

export const ETIQUETA_CATEGORIA: Record<Categoria, string> = {
  comidas: 'Comidas',
  bebidas: 'Bebidas',
  postres: 'Postres',
  complementos: 'Complementos',
}
