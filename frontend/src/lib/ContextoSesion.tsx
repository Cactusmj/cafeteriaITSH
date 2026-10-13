import { useState, type ReactNode } from 'react'
import { api } from './api'
import { ContextoSesion, type ValorSesion } from './useSesion'
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
