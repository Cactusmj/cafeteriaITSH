import { createContext, useContext, useState, type ReactNode } from 'react'
import { api } from './api'
import {
  guardarSesion,
  leerSesion,
  limpiarSesion,
  type UsuarioSesion,
} from './sesion'

interface RespuestaSesion {
  token: string
  usuario: UsuarioSesion
}

export interface ValorSesion {
  usuario: UsuarioSesion | null
  token: string | null
  iniciarSesion: (correo: string, password: string) => Promise<UsuarioSesion>
  registrar: (datos: { nombre: string; correo: string; password: string }) => Promise<UsuarioSesion>
  cerrarSesion: () => void
}

const ContextoSesion = createContext<ValorSesion | null>(null)

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const inicial = leerSesion()
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(inicial?.usuario ?? null)
  const [token, setToken] = useState<string | null>(inicial?.token ?? null)

  function aplicarSesion(respuesta: RespuestaSesion): UsuarioSesion {
    guardarSesion(respuesta.token, respuesta.usuario)
    setToken(respuesta.token)
    setUsuario(respuesta.usuario)
    return respuesta.usuario
  }

  const valor: ValorSesion = {
    usuario,
    token,
    iniciarSesion: async (correo, password) => {
      const respuesta = await api<RespuestaSesion>('/api/auth/login', {
        metodo: 'POST',
        cuerpo: { correo, password },
      })
      return aplicarSesion(respuesta)
    },
    registrar: async (datos) => {
      const respuesta = await api<RespuestaSesion>('/api/auth/register', {
        metodo: 'POST',
        cuerpo: datos,
      })
      return aplicarSesion(respuesta)
    },
    cerrarSesion: () => {
      limpiarSesion()
      setToken(null)
      setUsuario(null)
    },
  }

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>
}

/** Accede al contexto de sesión; falla si se usa fuera del proveedor. */
export function usarSesion(): ValorSesion {
  const contexto = useContext(ContextoSesion)
  if (!contexto) {
    throw new Error('usarSesion debe usarse dentro de ProveedorSesion')
  }
  return contexto
}
