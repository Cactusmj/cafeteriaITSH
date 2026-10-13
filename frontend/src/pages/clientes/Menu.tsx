import { useCallback, useEffect, useState } from 'react'
import { TarjetaPlatillo } from '../../components/menu/TarjetaPlatillo'
import { api, ErrorPeticion } from '../../lib/api'
import { ETIQUETA_CATEGORIA, type Categoria } from '../../lib/categorias'
import { useSesion } from '../../lib/useSesion'

interface PlatilloMenu {
  id: number
  platillo: string
  categoria: string | null
  descripcion: string | null
  precio: string
  disponible: boolean
  especial: boolean
}

const claseBoton =
  'inline-flex min-h-11 items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60'

/** Consulta del menú del día para alumnos y docentes. */
export function Menu() {
  const { token } = useSesion()
  const [platillos, setPlatillos] = useState<PlatilloMenu[]>([])
  const [fecha, setFecha] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const datos = await api<{ fecha: string; platillos: PlatilloMenu[] }>('/api/menu', { token })
      setError(null)
      setPlatillos(datos.platillos)
      setFecha(datos.fecha)
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo cargar el menú')
    } finally {
      setCargando(false)
    }
  }, [token])

  const refrescar = useCallback(() => {
    setCargando(true)
    return cargar()
  }, [cargar])

  useEffect(() => {
    void Promise.resolve().then(cargar)
  }, [cargar])

  const porCategoria = platillos.reduce<Record<string, PlatilloMenu[]>>((acumulado, platillo) => {
    const clave = platillo.categoria ?? 'sin categoria'
    ;(acumulado[clave] ??= []).push(platillo)
    return acumulado
  }, {})

  const categoriasOrdenadas = Object.keys(porCategoria).sort((a, b) => a.localeCompare(b, 'es'))

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Menú del día</h1>
          {fecha && <p className="text-sm text-slate-600">Fecha: {fecha}</p>}
        </div>
        <button type="button" onClick={() => void refrescar()} disabled={cargando} className={claseBoton}>
          {cargando ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-slate-600">Cargando menú…</p>
      ) : platillos.length === 0 ? (
        <p className="rounded border border-slate-200 bg-white px-4 py-6 text-center text-slate-600">
          No hay menú publicado por hoy. Vuelve más tarde.
        </p>
      ) : (
        categoriasOrdenadas.map((categoria) => (
          <div key={categoria} className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-slate-900">
              {categoria in ETIQUETA_CATEGORIA
                ? ETIQUETA_CATEGORIA[categoria as Categoria]
                : categoria}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {porCategoria[categoria].map((platillo) => (
                <TarjetaPlatillo
                  key={platillo.id}
                  platillo={platillo.platillo}
                  categoria={platillo.categoria}
                  descripcion={platillo.descripcion}
                  precio={platillo.precio}
                  disponible={platillo.disponible}
                  especial={platillo.especial}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  )
}
