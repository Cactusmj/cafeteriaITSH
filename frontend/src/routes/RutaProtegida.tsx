import { Navigate, Outlet } from 'react-router-dom'
import { usarSesion } from '../lib/ContextoSesion'

/** Permite el acceso solo si hay sesión activa; si no, redirige a /login. */
export function RutaProtegida() {
  const { usuario } = usarSesion()
  if (!usuario) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
