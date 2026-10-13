/** Lista fija de categorías de platillos (research R5). */
export const CATEGORIAS = ['comidas', 'bebidas', 'postres', 'complementos'] as const;

export type Categoria = (typeof CATEGORIAS)[number];
