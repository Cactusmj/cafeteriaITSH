export type Rol = 'administrador' | 'cajero' | 'cocinero' | 'usuario'

export interface UsuarioSesion {
  id: number
  nombre: string
  correo: string
  rol: Rol
}

export interface SesionGuardada {
  token: string
  usuario: UsuarioSesion
}

const CLAVE_TOKEN = 'cafeteria.token'
const CLAVE_USUARIO = 'cafeteria.usuario'

/** Ruta inicial según el rol del usuario. */
export const INICIO_POR_ROL: Record<Rol, string> = {
  administrador: '/admin/usuarios',
  cajero: '/caja',
  cocinero: '/cocina',
  usuario: '/menu',
}

/** Persiste la sesión en el almacenamiento local. */
export function guardarSesion(token: string, usuario: UsuarioSesion): void {
  localStorage.setItem(CLAVE_TOKEN, token)
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario))
}

/** Recupera la sesión guardada, o null si no hay. */
export function leerSesion(): SesionGuardada | null {
  const token = localStorage.getItem(CLAVE_TOKEN)
  const crudo = localStorage.getItem(CLAVE_USUARIO)
  if (!token || !crudo) {
    return null
  }

  try {
    const usuario = JSON.parse(crudo) as UsuarioSesion
    return { token, usuario }
  } catch {
    return null
  }
}

/** Elimina la sesión del almacenamiento local. */
export function limpiarSesion(): void {
  localStorage.removeItem(CLAVE_TOKEN)
  localStorage.removeItem(CLAVE_USUARIO)
}
