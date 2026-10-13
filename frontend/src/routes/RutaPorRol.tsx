import { Navigate, Outlet } from 'react-router-dom'
import { usarSesion } from '../lib/ContextoSesion'
import { INICIO_POR_ROL, type Rol } from '../lib/sesion'

/** Permite el acceso solo a los roles indicados; si no, redirige a su inicio. */
export function RutaPorRol({ roles }: { roles: Rol[] }) {
  const { usuario } = usarSesion()
  if (!usuario) {
    return <Navigate to="/login" replace />
  }
  if (!roles.includes(usuario.rol)) {
    return <Navigate to={INICIO_POR_ROL[usuario.rol]} replace />
  }
  return <Outlet />
}
