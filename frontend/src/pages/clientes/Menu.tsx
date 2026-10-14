import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TarjetaPlatillo } from '../../components/menu/TarjetaPlatillo'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campo'
import { EstadoVacio } from '../../components/ui/EstadoVacio'
import { api, ErrorPeticion } from '../../lib/api'
import {
  guardarCarrito,
  leerCarrito,
  totalCarrito,
  type LineaCarrito,
} from '../../lib/carrito'
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

const claseChip = (activa: boolean): string =>
  `inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium ${
    activa
      ? 'bg-primary font-semibold text-on-primary'
      : 'border border-outline bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
  }`

/** Consulta del menú del día para alumnos y docentes. */
export function Menu() {
  const { token } = useSesion()
  const navegar = useNavigate()
  const [platillos, setPlatillos] = useState<PlatilloMenu[]>([])
  const [fecha, setFecha] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [carrito, setCarrito] = useState<LineaCarrito[]>(() => leerCarrito())

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

  const actualizarCarrito = useCallback((lineas: LineaCarrito[]) => {
    setCarrito(lineas)
    guardarCarrito(lineas)
  }, [])

  const agregarAlCarrito = useCallback(
    (platillo: PlatilloMenu) => {
      const existente = carrito.find((linea) => linea.menu_dia_id === platillo.id)
      if (existente) {
        actualizarCarrito(
          carrito.map((linea) =>
            linea.menu_dia_id === platillo.id ? { ...linea, cantidad: linea.cantidad + 1 } : linea,
          ),
        )
        return
      }
      actualizarCarrito([
        ...carrito,
        { menu_dia_id: platillo.id, platillo: platillo.platillo, precio: platillo.precio, cantidad: 1 },
      ])
    },
    [carrito, actualizarCarrito],
  )

  const quitarDelCarrito = useCallback(
    (platillo: PlatilloMenu) => {
      const existente = carrito.find((linea) => linea.menu_dia_id === platillo.id)
      if (!existente) {
        return
      }
      if (existente.cantidad <= 1) {
        actualizarCarrito(carrito.filter((linea) => linea.menu_dia_id !== platillo.id))
        return
      }
      actualizarCarrito(
        carrito.map((linea) =>
          linea.menu_dia_id === platillo.id ? { ...linea, cantidad: linea.cantidad - 1 } : linea,
        ),
      )
    },
    [carrito, actualizarCarrito],
  )

  const categoriasOrdenadas = useMemo(() => {
    const claves = new Set<string>()
    for (const platillo of platillos) {
      claves.add(platillo.categoria ?? 'sin categoria')
    }
    return [...claves].sort((a, b) => a.localeCompare(b, 'es'))
  }, [platillos])

  const textoBusqueda = busqueda.trim().toLowerCase()
  const filtrados = platillos.filter((platillo) => {
    if (categoria && (platillo.categoria ?? 'sin categoria') !== categoria) {
      return false
    }
    if (!textoBusqueda) {
      return true
    }
    return (
      platillo.platillo.toLowerCase().includes(textoBusqueda) ||
      (platillo.descripcion ?? '').toLowerCase().includes(textoBusqueda)
    )
  })

  const grupos = filtrados.reduce<Record<string, PlatilloMenu[]>>((acumulado, platillo) => {
    const clave = platillo.categoria ?? 'sin categoria'
    ;(acumulado[clave] ??= []).push(platillo)
    return acumulado
  }, {})

  const unidades = carrito.reduce((total, linea) => total + linea.cantidad, 0)

  const etiquetaCategoria = (clave: string): string =>
    clave in ETIQUETA_CATEGORIA ? ETIQUETA_CATEGORIA[clave as Categoria] : clave

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-on-surface">Menú del día</h1>
          {fecha && <p className="text-sm text-on-surface-variant">Fecha: {fecha}</p>}
        </div>
        <Boton variante="secundario" onClick={() => void refrescar()} disabled={cargando}>
          {cargando ? 'Actualizando…' : 'Actualizar'}
        </Boton>
      </div>

      <Campo
        etiqueta="Buscar producto"
        placeholder="Buscar producto…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {categoriasOrdenadas.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            aria-pressed={categoria === null}
            onClick={() => setCategoria(null)}
            className={claseChip(categoria === null)}
          >
            Todos
          </button>
          {categoriasOrdenadas.map((clave) => (
            <button
              key={clave}
              type="button"
              aria-pressed={categoria === clave}
              onClick={() => setCategoria(clave)}
              className={claseChip(categoria === clave)}
            >
              {etiquetaCategoria(clave)}
            </button>
          ))}
        </div>
      )}

      {cargando ? (
        <p className="text-on-surface-variant">Cargando menú…</p>
      ) : error && platillos.length === 0 ? (
        <EstadoVacio titulo="No se pudo cargar el menú" descripcion={error} onReintentar={() => void refrescar()} />
      ) : platillos.length === 0 ? (
        <EstadoVacio titulo="Menú no disponible hoy" descripcion="No hay menú publicado por hoy. Vuelve más tarde." />
      ) : filtrados.length === 0 ? (
        <EstadoVacio
          titulo={textoBusqueda ? `Sin resultados para ‘${busqueda.trim()}’` : 'Sin resultados en esta categoría'}
          descripcion="Prueba otra búsqueda o categoría."
        />
      ) : (
        Object.keys(grupos)
          .sort((a, b) => a.localeCompare(b, 'es'))
          .map((clave) => (
            <div key={clave} className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-bold text-on-surface">
                {etiquetaCategoria(clave)}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grupos[clave].map((platillo) => (
                  <TarjetaPlatillo
                    key={platillo.id}
                    platillo={platillo.platillo}
                    categoria={platillo.categoria}
                    descripcion={platillo.descripcion}
                    precio={platillo.precio}
                    disponible={platillo.disponible}
                    especial={platillo.especial}
                    cantidad={carrito.find((linea) => linea.menu_dia_id === platillo.id)?.cantidad ?? 0}
                    onAgregar={() => agregarAlCarrito(platillo)}
                    onQuitar={() => quitarDelCarrito(platillo)}
                  />
                ))}
              </div>
            </div>
          ))
      )}

      {unidades > 0 && (
        <div className="sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 shadow md:bottom-4">
          <p className="text-sm text-on-surface">
            <span className="font-heading font-bold">{unidades}</span>{' '}
            {unidades === 1 ? 'producto' : 'productos'} ·{' '}
            <span className="font-heading font-bold text-primary">${totalCarrito(carrito)}</span>
          </p>
          <Boton onClick={() => navegar('/confirmar-pedido')}>Ver pedido</Boton>
        </div>
      )}
    </section>
  )
}
