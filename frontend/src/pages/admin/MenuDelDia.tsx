import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campo'
import { EstadoVacio } from '../../components/ui/EstadoVacio'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { api, ErrorPeticion } from '../../lib/api'
import { useSesion } from '../../lib/useSesion'

interface EntradaMenu {
  id: number
  fecha: string
  platillo_id: number
  platillo: string
  categoria: string | null
  precio: string
  disponible: boolean
  especial: boolean
  platillo_activo: boolean
}

interface PlatilloCatalogo {
  id: number
  nombre: string
  categoria: string | null
  activo: boolean
}

/** Gestión del menú del día para el administrador. */
export function MenuDelDia() {
  const { token } = useSesion()
  const [entradas, setEntradas] = useState<EntradaMenu[]>([])
  const [fecha, setFecha] = useState<string | null>(null)
  const [platillos, setPlatillos] = useState<PlatilloCatalogo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [platilloId, setPlatilloId] = useState('')
  const [precio, setPrecio] = useState('')
  const [especial, setEspecial] = useState(false)
  const [agregando, setAgregando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const [menu, catalogo] = await Promise.all([
        api<{ fecha: string; entradas: EntradaMenu[] }>('/api/admin/menu', { token }),
        api<{ platillos: PlatilloCatalogo[] }>('/api/admin/platillos', { token }),
      ])
      setError(null)
      setEntradas(menu.entradas)
      setFecha(menu.fecha)
      setPlatillos(catalogo.platillos)
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo cargar el menú del día')
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

  async function agregar(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setAgregando(true)
    try {
      await api('/api/admin/menu', {
        metodo: 'POST',
        token,
        cuerpo: {
          platillo_id: Number(platilloId),
          precio,
          especial,
        },
      })
      setPlatilloId('')
      setPrecio('')
      setEspecial(false)
      await refrescar()
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo agregar el platillo')
    } finally {
      setAgregando(false)
    }
  }

  async function actualizar(id: number, cambios: { precio?: string; disponible?: boolean; especial?: boolean }) {
    setError(null)
    try {
      await api(`/api/admin/menu/${id}`, { metodo: 'PUT', token, cuerpo: cambios })
      await refrescar()
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo actualizar la entrada')
    }
  }

  async function eliminar(id: number) {
    setError(null)
    try {
      await api(`/api/admin/menu/${id}`, { metodo: 'DELETE', token })
      await refrescar()
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo eliminar la entrada')
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-on-surface">Menú del día</h1>
        {fecha && <p className="text-sm text-on-surface-variant">Fecha: {fecha}</p>}
      </div>

      {error && (
        <EstadoVacio titulo="No se pudo cargar el menú del día" descripcion={error} onReintentar={refrescar} />
      )}

      <Tarjeta className="p-4">
        <form onSubmit={agregar} className="grid gap-3 sm:grid-cols-3">
          <h2 className="font-heading text-lg font-bold text-on-surface sm:col-span-3">Agregar platillo al menú</h2>
          <label className="flex flex-col gap-1 text-sm font-medium text-on-surface-variant">
            <span>Platillo</span>
            <select
              required
              value={platilloId}
              onChange={(e) => setPlatilloId(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-outline bg-surface-container-lowest px-3 py-2 text-base text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecciona un platillo…</option>
              {platillos.map((platillo) => (
                <option key={platillo.id} value={platillo.id}>
                  {platillo.nombre}
                </option>
              ))}
            </select>
          </label>
          <Campo
            etiqueta="Precio"
            type="number"
            required
            min="0.01"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          <label className="flex min-h-11 flex-row items-center gap-2 text-sm font-medium text-on-surface-variant sm:pt-6">
            <input
              type="checkbox"
              checked={especial}
              onChange={(e) => setEspecial(e.target.checked)}
              className="size-5 accent-primary"
            />
            Especial del día
          </label>
          <div className="sm:col-span-3">
            <Boton type="submit" disabled={agregando}>
              {agregando ? 'Agregando…' : 'Agregar al menú'}
            </Boton>
          </div>
        </form>
      </Tarjeta>

      {cargando ? (
        <p className="text-on-surface-variant">Cargando menú del día…</p>
      ) : entradas.length === 0 ? (
        <EstadoVacio
          titulo="No hay menú publicado para esta fecha"
          descripcion="Agrega platillos con el formulario."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-container text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-medium">Platillo</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Disponible</th>
                <th className="px-4 py-3 font-medium">Especial</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {entradas.map((entrada) => (
                <tr key={entrada.id} className="border-t border-outline-variant">
                  <td className="px-4 py-4 font-medium text-on-surface">
                    {entrada.platillo}
                    {!entrada.platillo_activo && (
                      <span className="ml-2 rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">
                        Platillo desactivado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      defaultValue={entrada.precio}
                      onBlur={(e) => {
                        const valor = e.target.value
                        if (valor && valor !== entrada.precio) {
                          void actualizar(entrada.id, { precio: valor })
                        }
                      }}
                      className="min-h-11 w-full max-w-28 rounded-lg border border-outline bg-surface-container-lowest px-3 py-2 text-base text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`Precio de ${entrada.platillo}`}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <Boton
                      variante="secundario"
                      onClick={() => void actualizar(entrada.id, { disponible: !entrada.disponible })}
                    >
                      {entrada.disponible ? 'Disponible' : 'No disponible'}
                    </Boton>
                  </td>
                  <td className="px-4 py-4">
                    <Boton
                      variante="secundario"
                      onClick={() => void actualizar(entrada.id, { especial: !entrada.especial })}
                    >
                      {entrada.especial ? 'Sí' : 'No'}
                    </Boton>
                  </td>
                  <td className="px-4 py-4">
                    <Boton
                      variante="secundario"
                      onClick={() => void eliminar(entrada.id)}
                    >
                      Quitar del menú
                    </Boton>
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
