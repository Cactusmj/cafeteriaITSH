import { Navigate, Outlet } from 'react-router-dom'
import { useSesion } from '../lib/useSesion'
import { INICIO_POR_ROL, type Rol } from '../lib/sesion'

/** Permite el acceso solo a los roles indicados; si no, redirige a su inicio. */
export function RutaPorRol({ roles }: { roles: Rol[] }) {
  const { usuario } = useSesion()
  if (!usuario) {
    return <Navigate to="/login" replace />
  }
  if (!roles.includes(usuario.rol)) {
    return <Navigate to={INICIO_POR_ROL[usuario.rol]} replace />
  }
  return <Outlet />
}
