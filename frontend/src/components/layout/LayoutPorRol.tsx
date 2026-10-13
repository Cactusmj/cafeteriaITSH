import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useSesion } from '../../lib/useSesion'
import { INICIO_POR_ROL, type Rol } from '../../lib/sesion'

interface Enlace {
  etiqueta: string
  ruta: string
}

const NAVEGACION: Record<Rol, Enlace[]> = {
  administrador: [
    { etiqueta: 'Usuarios', ruta: '/admin/usuarios' },
    { etiqueta: 'Platillos', ruta: '/admin/platillos' },
    { etiqueta: 'Menú del día', ruta: '/admin/menu' },
  ],
  cajero: [{ etiqueta: 'Caja', ruta: '/caja' }],
  cocinero: [{ etiqueta: 'Cocina', ruta: '/cocina' }],
  usuario: [
    { etiqueta: 'Menú', ruta: '/menu' },
    { etiqueta: 'Mis pedidos', ruta: '/mis-pedidos' },
  ],
}

const claseEnlace =
  'inline-flex min-h-11 items-center rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100'

/** Estructura común con encabezado, navegación por rol y contenido. */
export function LayoutPorRol() {
  const { usuario, cerrarSesion } = useSesion()
  const navegar = useNavigate()

  if (!usuario) {
    return null
  }

  function salir() {
    cerrarSesion()
    navegar('/login', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <Link to={INICIO_POR_ROL[usuario.rol]} className="text-lg font-semibold text-slate-900">
          Cafetería ITSH
        </Link>

        <nav className="flex flex-wrap items-center gap-1" aria-label="Navegación principal">
          {NAVEGACION[usuario.rol].map((enlace) => (
            <Link key={enlace.ruta} to={enlace.ruta} className={claseEnlace}>
              {enlace.etiqueta}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">
            {usuario.nombre} · {usuario.rol}
          </span>
          <button
            type="button"
            onClick={salir}
            className="inline-flex min-h-11 items-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
