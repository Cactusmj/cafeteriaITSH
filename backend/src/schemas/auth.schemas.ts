import { z } from 'zod';

/** Longitud mínima de contraseña (FR-008). */
export const MIN_LONGITUD_PASSWORD = 8;

export const esquemaRegistro = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  correo: z.string().trim().email('Correo inválido').max(150),
  password: z.string().min(MIN_LONGITUD_PASSWORD, 'La contraseña debe tener al menos 8 caracteres').max(72),
});

export const esquemaLogin = z.object({
  correo: z.string().trim().email('Correo inválido').max(150),
  password: z.string().min(1, 'La contraseña es obligatoria').max(72),
});

export type RegistroEntrada = z.infer<typeof esquemaRegistro>;
export type LoginEntrada = z.infer<typeof esquemaLogin>;
