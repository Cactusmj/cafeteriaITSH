import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, ErrorPeticion } from '../../lib/api'
import { useSesion } from '../../lib/useSesion'
import { CATEGORIAS, ETIQUETA_CATEGORIA, type Categoria } from '../../lib/categorias'

interface Platillo {
  id: number
  nombre: string
  categoria: string | null
  descripcion: string | null
  activo: boolean
}

const claseCampo =
  'w-full rounded border border-slate-300 px-3 py-2 text-base focus:border-slate-900 focus:outline-none'
const claseBoton =
  'inline-flex min-h-11 items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60'
const claseBotonSecundario =
  'inline-flex min-h-11 items-center justify-center rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100'

/** Catálogo de platillos para el administrador. */
export function Platillos() {
  const { token } = useSesion()
  const [platillos, setPlatillos] = useState<Platillo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('comidas')
  const [descripcion, setDescripcion] = useState('')
  const [creando, setCreando] = useState(false)

  const [editando, setEditando] = useState<Platillo | null>(null)
  const [nombreEdicion, setNombreEdicion] = useState('')
  const [categoriaEdicion, setCategoriaEdicion] = useState<Categoria>('comidas')
  const [descripcionEdicion, setDescripcionEdicion] = useState('')

  const cargar = useCallback(async () => {
    try {
      const datos = await api<{ platillos: Platillo[] }>('/api/admin/platillos', { token })
      setError(null)
      setPlatillos(datos.platillos)
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo cargar el catálogo')
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

  async function crear(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setCreando(true)
    try {
      await api('/api/admin/platillos', {
        metodo: 'POST',
        token,
        cuerpo: { nombre, categoria, descripcion: descripcion || undefined },
      })
      setNombre('')
      setDescripcion('')
      setCategoria('comidas')
      await refrescar()
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo crear el platillo')
    } finally {
      setCreando(false)
    }
  }

  function prepararEdicion(platillo: Platillo) {
    setEditando(platillo)
    setNombreEdicion(platillo.nombre)
    setCategoriaEdicion((platillo.categoria as Categoria) ?? 'comidas')
    setDescripcionEdicion(platillo.descripcion ?? '')
  }

  async function guardarEdicion(evento: FormEvent) {
    evento.preventDefault()
    if (!editando) return
    setError(null)
    try {
      await api(`/api/admin/platillos/${editando.id}`, {
        metodo: 'PUT',
        token,
        cuerpo: {
          nombre: nombreEdicion,
          categoria: categoriaEdicion,
          descripcion: descripcionEdicion || undefined,
        },
      })
      setEditando(null)
      await refrescar()
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo guardar el platillo')
    }
  }

  async function cambiarEstado(platillo: Platillo) {
    setError(null)
    try {
      await api(`/api/admin/platillos/${platillo.id}/estado`, {
        metodo: 'PATCH',
        token,
        cuerpo: { activo: !platillo.activo },
      })
      await refrescar()
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo actualizar el estado')
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Platillos</h1>

      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={crear}
        className="grid gap-3 rounded border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-medium text-slate-900">Nuevo platillo</h2>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Nombre
          <input
            type="text"
            required
            maxLength={100}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={claseCampo}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Categoría
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria)}
            className={claseCampo}
          >
            {CATEGORIAS.map((opcion) => (
              <option key={opcion} value={opcion}>
                {ETIQUETA_CATEGORIA[opcion]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
          Descripción (opcional)
          <input
            type="text"
            maxLength={500}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={claseCampo}
          />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={creando} className={claseBoton}>
            {creando ? 'Creando…' : 'Crear platillo'}
          </button>
        </div>
      </form>

      {editando && (
        <form
          onSubmit={guardarEdicion}
          className="grid gap-3 rounded border border-slate-900 bg-white p-4 sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 text-lg font-medium text-slate-900">
            Editando: {editando.nombre}
          </h2>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Nombre
            <input
              type="text"
              required
              maxLength={100}
              value={nombreEdicion}
              onChange={(e) => setNombreEdicion(e.target.value)}
              className={claseCampo}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Categoría
            <select
              value={categoriaEdicion}
              onChange={(e) => setCategoriaEdicion(e.target.value as Categoria)}
              className={claseCampo}
            >
              {CATEGORIAS.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {ETIQUETA_CATEGORIA[opcion]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
            Descripción (opcional)
            <input
              type="text"
              maxLength={500}
              value={descripcionEdicion}
              onChange={(e) => setDescripcionEdicion(e.target.value)}
              className={claseCampo}
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className={claseBoton}>
              Guardar cambios
            </button>
            <button type="button" onClick={() => setEditando(null)} className={claseBotonSecundario}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <p className="text-slate-600">Cargando platillos…</p>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {platillos.map((platillo) => (
                <tr key={platillo.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{platillo.nombre}</td>
                  <td className="px-4 py-3">
                    {platillo.categoria && platillo.categoria in ETIQUETA_CATEGORIA
                      ? ETIQUETA_CATEGORIA[platillo.categoria as Categoria]
                      : platillo.categoria ?? '—'}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                    {platillo.descripcion ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {platillo.activo ? (
                      <span className="text-green-700">Activo</span>
                    ) : (
                      <span className="text-slate-500">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => prepararEdicion(platillo)}
                        className={claseBotonSecundario}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void cambiarEstado(platillo)}
                        className={claseBotonSecundario}
                      >
                        {platillo.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {platillos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No hay platillos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
