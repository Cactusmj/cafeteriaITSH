import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campo'
import { EstadoVacio } from '../../components/ui/EstadoVacio'
import { Tarjeta } from '../../components/ui/Tarjeta'
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
      <h1 className="font-heading text-2xl font-bold text-on-surface">Platillos</h1>

      {error && (
        <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
          {error}
        </p>
      )}

      <Tarjeta className="p-4">
        <form onSubmit={crear} className="grid gap-3 sm:grid-cols-2">
          <h2 className="font-heading text-lg font-bold text-on-surface sm:col-span-2">Nuevo platillo</h2>
          <Campo etiqueta="Nombre" type="text" required maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <label className="flex flex-col gap-1 text-sm font-medium text-on-surface-variant">
            <span>Categoría</span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Categoria)}
              className="min-h-11 w-full rounded-lg border border-outline bg-surface-container-lowest px-3 py-2 text-base text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORIAS.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {ETIQUETA_CATEGORIA[opcion]}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <Campo etiqueta="Descripción (opcional)" type="text" maxLength={500} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Boton type="submit" disabled={creando}>
              {creando ? 'Creando…' : 'Crear platillo'}
            </Boton>
          </div>
        </form>
      </Tarjeta>

      {editando && (
        <Tarjeta className="border-primary p-4">
          <form onSubmit={guardarEdicion} className="grid gap-3 sm:grid-cols-2">
            <h2 className="font-heading text-lg font-bold text-on-surface sm:col-span-2">
              Editando: {editando.nombre}
            </h2>
            <Campo etiqueta="Nombre" type="text" required maxLength={100} value={nombreEdicion} onChange={(e) => setNombreEdicion(e.target.value)} />
            <label className="flex flex-col gap-1 text-sm font-medium text-on-surface-variant">
              <span>Categoría</span>
              <select
                value={categoriaEdicion}
                onChange={(e) => setCategoriaEdicion(e.target.value as Categoria)}
                className="min-h-11 w-full rounded-lg border border-outline bg-surface-container-lowest px-3 py-2 text-base text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CATEGORIAS.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {ETIQUETA_CATEGORIA[opcion]}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <Campo etiqueta="Descripción (opcional)" type="text" maxLength={500} value={descripcionEdicion} onChange={(e) => setDescripcionEdicion(e.target.value)} />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Boton type="submit">Guardar cambios</Boton>
              <Boton type="button" variante="secundario" onClick={() => setEditando(null)}>
                Cancelar
              </Boton>
            </div>
          </form>
        </Tarjeta>
      )}

      {cargando ? (
        <p className="text-on-surface-variant">Cargando platillos…</p>
      ) : platillos.length === 0 ? (
        <EstadoVacio
          titulo="El catálogo está vacío"
          descripcion="Crea el primer platillo con el formulario."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-container text-on-surface-variant">
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
                <tr key={platillo.id} className="border-t border-outline-variant">
                  <td className="px-4 py-4 font-medium text-on-surface">{platillo.nombre}</td>
                  <td className="px-4 py-4 text-on-surface">
                    {platillo.categoria && platillo.categoria in ETIQUETA_CATEGORIA
                      ? ETIQUETA_CATEGORIA[platillo.categoria as Categoria]
                      : platillo.categoria ?? '—'}
                  </td>
                  <td className="max-w-xs truncate px-4 py-4 text-on-surface-variant">
                    {platillo.descripcion ?? '—'}
                  </td>
                  <td className="px-4 py-4">
                    {platillo.activo ? (
                      <span className="font-medium text-primary">Activo</span>
                    ) : (
                      <span className="text-on-surface-variant">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Boton variante="secundario" onClick={() => prepararEdicion(platillo)}>
                        Editar
                      </Boton>
                      <Boton
                        variante="secundario"
                        onClick={() => void cambiarEstado(platillo)}
                      >
                        {platillo.activo ? 'Desactivar' : 'Activar'}
                      </Boton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
