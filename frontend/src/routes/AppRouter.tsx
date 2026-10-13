import { Navigate, Route, Routes } from 'react-router-dom'
import { LayoutPorRol } from '../components/layout/LayoutPorRol'
import { usarSesion } from '../lib/ContextoSesion'
import { INICIO_POR_ROL } from '../lib/sesion'
import { Usuarios } from '../pages/admin/Usuarios'
import { Caja } from '../pages/caja/Caja'
import { Login } from '../pages/clientes/Login'
import { Menu } from '../pages/clientes/Menu'
import { MisPedidos } from '../pages/clientes/MisPedidos'
import { Registro } from '../pages/clientes/Registro'
import { Cocina } from '../pages/cocina/Cocina'
import { RutaPorRol } from './RutaPorRol'
import { RutaProtegida } from './RutaProtegida'

/** Redirige a la ruta inicial según la sesión. */
function Inicio() {
  const { usuario } = usarSesion()
  if (!usuario) {
    return <Navigate to="/login" replace />
  }
  return <Navigate to={INICIO_POR_ROL[usuario.rol]} replace />
}

/** Tabla de rutas de la aplicación (sin router propio). */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<RutaProtegida />}>
        <Route element={<LayoutPorRol />}>
          <Route path="/menu" element={<Menu />} />
          <Route path="/mis-pedidos" element={<MisPedidos />} />

          <Route element={<RutaPorRol roles={['administrador']} />}>
            <Route path="/admin/usuarios" element={<Usuarios />} />
          </Route>
          <Route element={<RutaPorRol roles={['cajero']} />}>
            <Route path="/caja" element={<Caja />} />
          </Route>
          <Route element={<RutaPorRol roles={['cocinero']} />}>
            <Route path="/cocina" element={<Cocina />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Inicio />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
