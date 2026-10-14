import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { InsigniaEspecial } from '../../components/ui/InsigniaEspecial'
import { EstadoVacio } from '../../components/ui/EstadoVacio'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { api, ErrorPeticion } from '../../lib/api'
import { useSesion } from '../../lib/useSesion'

interface EntradaResumen {
  platillo: string
  precio: string
  disponible: boolean
  especial: boolean
}

/** Inicio de administración con accesos rápidos y resumen del menú de hoy. */
export function InicioAdmin() {
  const { token, usuario } = useSesion()
  const [conteos, setConteos] = useState({ usuarios: 0, platillos: 0, menu: 0 })
  const [resumen, setResumen] = useState<EntradaResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const [usuarios, catalogo, menu] = await Promise.all([
        api<{ usuarios: unknown[] }>('/api/admin/usuarios', { token }),
        api<{ platillos: unknown[] }>('/api/admin/platillos', { token }),
        api<{ fecha: string; platillos: EntradaResumen[] }>('/api/menu', { token }),
      ])
      setError(null)
      setConteos({
        usuarios: usuarios.usuarios?.length ?? 0,
        platillos: catalogo.platillos?.length ?? 0,
        menu: menu.platillos?.length ?? 0,
      })
      setResumen(menu.platillos ?? [])
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo cargar el resumen')
    } finally {
      setCargando(false)
    }
  }, [token])

  useEffect(() => {
    void Promise.resolve().then(cargar)
  }, [cargar])

  function refrescar() {
    setCargando(true)
    void cargar()
  }

  const accesos = [
    { etiqueta: 'Usuarios', ruta: '/admin/usuarios', conteo: `${conteos.usuarios} activos` },
    { etiqueta: 'Platillos', ruta: '/admin/platillos', conteo: `${conteos.platillos} en catálogo` },
    { etiqueta: 'Menú del día', ruta: '/admin/menu', conteo: `${conteos.menu} publicados hoy` },
  ]

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-on-surface">Inicio</h1>
        <p className="text-sm text-on-surface-variant">
          Hola{usuario ? `, ${usuario.nombre}` : ''} · Panel de administración de la cafetería.
        </p>
      </div>

      {error && (
        <EstadoVacio titulo="No se pudo cargar el resumen" descripcion={error} onReintentar={refrescar} />
      )}

      {cargando ? (
        <p className="text-on-surface-variant">Cargando resumen…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {accesos.map((acceso) => (
              <Link key={acceso.ruta} to={acceso.ruta}>
                <Tarjeta className="p-4 transition-shadow hover:shadow">
                  <p className="font-heading text-base font-bold text-primary">{acceso.etiqueta}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">{acceso.conteo}</p>
                </Tarjeta>
              </Link>
            ))}
          </div>

          <Tarjeta className="p-4">
            <h2 className="font-heading text-lg font-bold text-on-surface">Menú de hoy</h2>
            {resumen.length === 0 ? (
              <p className="mt-2 text-sm text-on-surface-variant">
                No hay menú publicado hoy. Publícalo desde Menú del día.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {resumen.map((entrada) => (
                  <li
                    key={`${entrada.platillo}-${entrada.precio}`}
                    className={`flex items-center justify-between gap-2 ${entrada.disponible ? '' : 'opacity-70'}`}
                  >
                    <span className="text-sm font-medium text-on-surface">
                      {entrada.platillo}{' '}
                      <span className="font-heading font-bold">${entrada.precio}</span>
                    </span>
                    {entrada.especial ? (
                      <InsigniaEspecial />
                    ) : (
                      !entrada.disponible && (
                        <span className="text-xs text-on-surface-variant">No disponible</span>
                      )
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </>
      )}
    </section>
  )
}
