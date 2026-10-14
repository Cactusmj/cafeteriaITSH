import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useSesion } from '../../lib/useSesion'
import { INICIO_POR_ROL, type Rol } from '../../lib/sesion'

interface Enlace {
  etiqueta: string
  ruta: string
}

const NAVEGACION: Record<Rol, Enlace[]> = {
  administrador: [
    { etiqueta: 'Inicio', ruta: '/admin' },
    { etiqueta: 'Usuarios', ruta: '/admin/usuarios' },
    { etiqueta: 'Platillos', ruta: '/admin/platillos' },
    { etiqueta: 'Menú del día', ruta: '/admin/menu' },
  ],
  cajero: [
    { etiqueta: 'Caja', ruta: '/caja' },
    { etiqueta: 'Entregas', ruta: '/caja/entregas' },
  ],
  cocinero: [{ etiqueta: 'Cocina', ruta: '/cocina' }],
  usuario: [
    { etiqueta: 'Menú', ruta: '/menu' },
    { etiqueta: 'Mis pedidos', ruta: '/mis-pedidos' },
  ],
}

/** Secciones con barra inferior en móvil. */
const CON_BARRA: Rol[] = ['usuario', 'cajero']

const claseEnlace = ({ isActive }: { isActive: boolean }): string =>
  `inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium ${
    isActive
      ? 'bg-primary-container font-semibold text-on-primary-container'
      : 'text-on-surface-variant hover:bg-surface-container'
  }`

const clasePestana = ({ isActive }: { isActive: boolean }): string =>
  `flex min-h-11 flex-1 items-center justify-center gap-1 px-2 py-2 text-sm font-medium ${
    isActive ? 'font-semibold text-primary' : 'text-on-surface-variant'
  }`

/** Insignia con el contador de pendientes de la sección. */
function InsigniaContador({ conteo, etiqueta }: { conteo: number; etiqueta: string }) {
  if (conteo <= 0) {
    return null
  }
  return (
    <span
      aria-label={`${conteo} ${etiqueta}`}
      className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-on-primary"
    >
      {conteo}
    </span>
  )
}

/** Estructura común con drawer lateral, barra inferior y contenido por rol. */
export function LayoutPorRol() {
  const { usuario, token, cerrarSesion } = useSesion()
  const navegar = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [listos, setListos] = useState(0)
  const [entregas, setEntregas] = useState(0)

  const cargarContadores = useCallback(async () => {
    if (!token || !usuario) {
      return
    }
    try {
      if (usuario.rol === 'usuario') {
        const respuesta = await api<{ avisos: Array<{ estado_envio: string }> }>('/api/avisos', {
          token,
        })
        setListos((respuesta.avisos ?? []).filter((aviso) => aviso.estado_envio === 'enviada').length)
      } else if (usuario.rol === 'cajero') {
        const respuesta = await api<{ pendientes: Array<{ estado: string }> }>(
          '/api/caja/pendientes',
          { token },
        )
        setEntregas(
          (respuesta.pendientes ?? []).filter((pendiente) => pendiente.estado === 'Listo').length,
        )
      }
    } catch {
      // Sin red los contadores se ocultan; la pantalla informa su propio error.
    }
  }, [token, usuario])

  useEffect(() => {
    if (!usuario || !CON_BARRA.includes(usuario.rol)) {
      return
    }
    void Promise.resolve().then(cargarContadores)
    const intervalo = setInterval(() => {
      void cargarContadores()
    }, 30000)
    return () => clearInterval(intervalo)
  }, [cargarContadores, usuario])

  if (!usuario) {
    return null
  }

  function salir() {
    cerrarSesion()
    navegar('/login', { replace: true })
  }

  const enlaces = NAVEGACION[usuario.rol]

  function contadorDe(ruta: string): { conteo: number; etiqueta: string } | null {
    if (ruta === '/mis-pedidos') {
      return { conteo: listos, etiqueta: 'listos para recoger' }
    }
    if (ruta === '/caja/entregas') {
      return { conteo: entregas, etiqueta: 'entregas pendientes' }
    }
    return null
  }

  const listaEnlaces = (alPulsar?: () => void) => (
    <>
      {enlaces.map((enlace) => {
        const contador = contadorDe(enlace.ruta)
        return (
          <NavLink key={enlace.ruta} to={enlace.ruta} onClick={alPulsar} className={claseEnlace}>
            {enlace.etiqueta}
            {contador && <InsigniaContador conteo={contador.conteo} etiqueta={contador.etiqueta} />}
          </NavLink>
        )
      })}
    </>
  )

  return (
    <div className="flex min-h-screen">
      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-30 bg-on-surface/40 md:hidden"
        />
      )}

      <aside
        aria-label="Menú lateral"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col gap-1 overflow-y-auto bg-surface-container-lowest p-4 transition-transform md:static md:z-auto md:translate-x-0 ${
          abierto ? 'translate-x-0' : ''
        }`}
      >
        <div className="flex items-center gap-3 border-b border-outline-variant px-2 pb-4">
          <span aria-hidden="true" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-primary-container font-heading text-lg font-bold text-on-primary-container">
            {usuario.nombre.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-on-surface">{usuario.nombre}</p>
            <p className="text-xs capitalize text-on-surface-variant">{usuario.rol}</p>
          </div>
        </div>
        <nav aria-label="Navegación principal" className="flex flex-col gap-1">
          {listaEnlaces(() => setAbierto(false))}
        </nav>
        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={salir}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:brightness-110"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-outline-variant bg-surface-container-lowest px-4 py-3">
          <button
            type="button"
            onClick={() => setAbierto((valor) => !valor)}
            aria-expanded={abierto}
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-on-surface hover:bg-surface-container md:hidden"
          >
            <span aria-hidden="true" className="text-xl">
              ☰
            </span>
          </button>
          <Link
            to={INICIO_POR_ROL[usuario.rol]}
            className="font-heading text-lg font-bold text-on-surface"
          >
            Cafetería ITSH
          </Link>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-24 md:pb-6">
          <Outlet />
        </main>

        {CON_BARRA.includes(usuario.rol) && (
          <nav
            aria-label="Navegación inferior"
            className="fixed inset-x-0 bottom-0 z-20 flex min-h-14 items-stretch border-t border-outline-variant bg-surface-container-lowest px-2 md:hidden"
          >
            {enlaces.map((enlace) => {
              const contador = contadorDe(enlace.ruta)
              return (
                <NavLink key={enlace.ruta} to={enlace.ruta} className={clasePestana}>
                  {enlace.etiqueta}
                  {contador && (
                    <InsigniaContador conteo={contador.conteo} etiqueta={contador.etiqueta} />
                  )}
                </NavLink>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )
}
