import { createContext, useContext } from 'react'
import type { UsuarioSesion } from './sesion'

export interface ValorSesion {
  usuario: UsuarioSesion | null
  token: string | null
  iniciarSesion: (correo: string, password: string) => Promise<UsuarioSesion>
  registrar: (datos: { nombre: string; correo: string; password: string }) => Promise<UsuarioSesion>
  cerrarSesion: () => void
}

export const ContextoSesion = createContext<ValorSesion | null>(null)

/** Accede al contexto de sesión; falla si se usa fuera del proveedor. */
export function useSesion(): ValorSesion {
  const contexto = useContext(ContextoSesion)
  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de ProveedorSesion')
  }
  return contexto
}
