import { Navigate, Outlet } from 'react-router-dom'
import { useSesion } from '../lib/useSesion'

/** Permite el acceso solo si hay sesión activa; si no, redirige a /login. */
export function RutaProtegida() {
  const { usuario } = useSesion()
  if (!usuario) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
