import { z } from 'zod';
import { ROLES_OPERATIVOS } from '../config/roles.js';
import { MIN_LONGITUD_PASSWORD } from './auth.schemas.js';

const password = z
  .string()
  .min(MIN_LONGITUD_PASSWORD, 'La contraseña debe tener al menos 8 caracteres')
  .max(72);
const correo = z.string().trim().email('Correo inválido').max(150);
const nombre = z.string().trim().min(1, 'El nombre es obligatorio').max(100);

export const esquemaCrearUsuario = z.object({
  nombre,
  correo,
  password,
  rol: z.enum(ROLES_OPERATIVOS, {
    errorMap: () => ({ message: 'El rol debe ser cajero o cocinero' }),
  }),
});

export const esquemaEditarUsuario = z
  .object({
    nombre: nombre.optional(),
    correo: correo.optional(),
    password: password.optional(),
    rol: z
      .enum(ROLES_OPERATIVOS, {
        errorMap: () => ({ message: 'El rol debe ser cajero o cocinero' }),
      })
      .optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'No hay campos para actualizar',
  });

export const esquemaCambiarEstado = z.object({
  activo: z.boolean({ invalid_type_error: 'El campo activo debe ser booleano' }),
});

export type CrearUsuarioEntrada = z.infer<typeof esquemaCrearUsuario>;
export type EditarUsuarioEntrada = z.infer<typeof esquemaEditarUsuario>;
