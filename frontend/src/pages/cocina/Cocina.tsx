import { useCallback, useEffect, useState } from 'react'
import { api, ErrorPeticion } from '../../lib/api'
import { useSesion } from '../../lib/useSesion'

const SONDEO_MS = 4000

interface LineaTablero {
  platillo: string
  cantidad: number
}

interface PedidoTablero {
  id: number
  numero: string
  tipo: string
  estado: string
  cliente: string
  minutos_en_espera: number
  total: string
  creado_en: string
  detalle: LineaTablero[]
}

const claseBoton =
  'inline-flex min-h-11 items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60'

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, '0')
}

/** Tablero de cocina: pedidos en flujo con avance de estados. */
export function Cocina() {
  const { token } = useSesion()
  const [pedidos, setPedidos] = useState<PedidoTablero[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accionando, setAccionando] = useState<number | null>(null)
  const [actualizado, setActualizado] = useState<Date | null>(null)

  const cargar = useCallback(async () => {
    try {
      const datos = await api<{ pedidos: PedidoTablero[] }>('/api/cocina/pedidos', { token })
      setError(null)
      setPedidos(datos.pedidos ?? [])
      setActualizado(new Date())
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo cargar el tablero')
    } finally {
      setCargando(false)
    }
  }, [token])

  useEffect(() => {
    void Promise.resolve().then(cargar)
    const intervalo = setInterval(() => {
      void cargar()
    }, SONDEO_MS)
    return () => clearInterval(intervalo)
  }, [cargar])

  const avanzar = useCallback(
    async (pedido: PedidoTablero, destino: string) => {
      setAccionando(pedido.id)
      setError(null)
      try {
        await api(`/api/pedidos/${pedido.id}/estado`, {
          metodo: 'PATCH',
          token,
          cuerpo: { estado: destino },
        })
        await cargar()
      } catch (err) {
        setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo actualizar el pedido')
      } finally {
        setAccionando(null)
      }
    },
    [token, cargar],
  )

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Cocina</h1>
        <p className="text-xs text-slate-500" aria-live="polite">
          {actualizado
            ? `Actualizado ${dosDigitos(actualizado.getHours())}:${dosDigitos(actualizado.getMinutes())}:${dosDigitos(actualizado.getSeconds())}`
            : 'Cargando…'}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-slate-600">Cargando tablero…</p>
      ) : pedidos.length === 0 ? (
        <p className="rounded border border-slate-200 bg-white px-4 py-6 text-center text-slate-600">
          Sin pedidos en cocina. Los pedidos pagados aparecerán aquí.
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {pedidos.map((pedido) => (
            <li
              key={pedido.id}
              className="flex flex-col gap-2 rounded border-2 border-slate-900 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xl font-extrabold text-slate-900">{pedido.numero}</p>
                  <p className="text-sm text-slate-600">
                    {pedido.cliente} · hace {pedido.minutos_en_espera} min ·{' '}
                    {pedido.tipo === 'mostrador' ? 'Mostrador' : 'Anticipado'}
                  </p>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  {pedido.estado}
                </span>
              </div>
              <ul className="flex flex-col gap-1 border-t border-slate-200 pt-2">
                {pedido.detalle.map((linea, indice) => (
                  <li key={indice} className="flex justify-between gap-2 text-base text-slate-900">
                    <span>
                      <span className="font-bold">{linea.cantidad} × </span>
                      {linea.platillo}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                {pedido.estado === 'Pagado' && (
                  <button
                    type="button"
                    onClick={() => void avanzar(pedido, 'En preparación')}
                    disabled={accionando === pedido.id}
                    className={`${claseBoton} w-full text-base`}
                  >
                    {accionando === pedido.id ? 'Actualizando…' : 'Iniciar preparación'}
                  </button>
                )}
                {pedido.estado === 'En preparación' && (
                  <button
                    type="button"
                    onClick={() => void avanzar(pedido, 'Listo')}
                    disabled={accionando === pedido.id}
                    className={`${claseBoton} w-full text-base`}
                  >
                    {accionando === pedido.id ? 'Actualizando…' : 'Marcar listo'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
