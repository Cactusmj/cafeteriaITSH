/** Roles del sistema. El cliente (alumno/docente) se llama `usuario` en la BD. */
export const ROL = {
  ADMINISTRADOR: 'administrador',
  CAJERO: 'cajero',
  COCINERO: 'cocinero',
  CLIENTE: 'usuario',
} as const;

export type Rol = (typeof ROL)[keyof typeof ROL];

/** Roles que el administrador puede gestionar. */
export const ROLES_OPERATIVOS = [ROL.CAJERO, ROL.COCINERO] as const;
export type RolOperativo = (typeof ROLES_OPERATIVOS)[number];
