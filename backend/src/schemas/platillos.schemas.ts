import { z } from 'zod';
import { CATEGORIAS } from '../config/categorias.js';

const nombre = z.string().trim().min(1, 'El nombre es obligatorio').max(100);
const categoria = z.enum(CATEGORIAS, {
  errorMap: () => ({ message: 'La categoría debe ser comidas, bebidas, postres o complementos' }),
});
const descripcion = z.string().trim().max(500, 'La descripción no puede exceder 500 caracteres');

export const esquemaCrearPlatillo = z.object({
  nombre,
  categoria,
  descripcion: descripcion.optional(),
});

export const esquemaEditarPlatillo = z
  .object({
    nombre: nombre.optional(),
    categoria: categoria.optional(),
    descripcion: descripcion.optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'No hay campos para actualizar',
  });

export const esquemaCambiarActivoPlatillo = z.object({
  activo: z.boolean({ invalid_type_error: 'El campo activo debe ser booleano' }),
});

export type CrearPlatilloEntrada = z.infer<typeof esquemaCrearPlatillo>;
export type EditarPlatilloEntrada = z.infer<typeof esquemaEditarPlatillo>;
