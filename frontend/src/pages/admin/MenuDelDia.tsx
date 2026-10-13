import { useCallback, useEffect, useState, type FormEvent } from 'react'
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

const claseCampo =
  'w-full rounded border border-slate-300 px-3 py-2 text-base focus:border-slate-900 focus:outline-none'
const claseBoton =
  'inline-flex min-h-11 items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60'
const claseBotonSecundario =
  'inline-flex min-h-11 items-center justify-center rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100'

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
        <h1 className="text-2xl font-semibold text-slate-900">Menú del día</h1>
        {fecha && <p className="text-sm text-slate-600">Fecha: {fecha}</p>}
      </div>

      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={agregar}
        className="grid gap-3 rounded border border-slate-200 bg-white p-4 sm:grid-cols-3"
      >
        <h2 className="sm:col-span-3 text-lg font-medium text-slate-900">Agregar platillo al menú</h2>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Platillo
          <select
            required
            value={platilloId}
            onChange={(e) => setPlatilloId(e.target.value)}
            className={claseCampo}
          >
            <option value="">Selecciona un platillo…</option>
            {platillos.map((platillo) => (
              <option key={platillo.id} value={platillo.id}>
                {platillo.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Precio
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className={claseCampo}
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={especial}
            onChange={(e) => setEspecial(e.target.checked)}
            className="size-5"
          />
          Especial del día
        </label>
        <div className="sm:col-span-3">
          <button type="submit" disabled={agregando} className={claseBoton}>
            {agregando ? 'Agregando…' : 'Agregar al menú'}
          </button>
        </div>
      </form>

      {cargando ? (
        <p className="text-slate-600">Cargando menú del día…</p>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
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
                <tr key={entrada.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    {entrada.platillo}
                    {!entrada.platillo_activo && (
                      <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        Platillo desactivado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
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
                      className={`${claseCampo} max-w-28`}
                      aria-label={`Precio de ${entrada.platillo}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void actualizar(entrada.id, { disponible: !entrada.disponible })}
                      className={claseBotonSecundario}
                    >
                      {entrada.disponible ? 'Disponible' : 'No disponible'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void actualizar(entrada.id, { especial: !entrada.especial })}
                      className={claseBotonSecundario}
                    >
                      {entrada.especial ? 'Sí' : 'No'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void eliminar(entrada.id)}
                      className={claseBotonSecundario}
                    >
                      Quitar del menú
                    </button>
                  </td>
                </tr>
              ))}
              {entradas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No hay platillos en el menú de hoy.
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
