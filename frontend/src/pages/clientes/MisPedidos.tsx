import { useCallback, useEffect, useState } from 'react'
import { BadgeEstado } from '../../components/pedidos/BadgeEstado'
import { api, ErrorPeticion } from '../../lib/api'
import { useSesion } from '../../lib/useSesion'

interface PedidoPropio {
  id: number
  numero: string
  tipo: string
  estado: string
  total: string
  fecha_recoleccion: string | null
  creado_en: string
  lineas: number
}

interface LineaDetalle {
  menu_dia_id: number
  platillo: string
  cantidad: number
  precio_unitario: string
  subtotal: string
}

interface DetallePedido {
  id: number
  numero: string
  estado: string
  total: string
  fecha_recoleccion: string | null
  detalle: LineaDetalle[]
}

interface Aviso {
  id: number
  pedido_id: number
  numero: string
  tipo: string
  canal: string
  estado_envio: string
  fecha: string
}

const claseBoton =
  'inline-flex min-h-11 items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60'

/** Seguimiento de pedidos y avisos de listo del cliente. */
export function MisPedidos() {
  const { token } = useSesion()
  const [pedidos, setPedidos] = useState<PedidoPropio[]>([])
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [detalle, setDetalle] = useState<DetallePedido | null>(null)
  const [cargando, setCargando] = useState(true)
  const [marcando, setMarcando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const [respuestaPedidos, respuestaAvisos] = await Promise.all([
        api<{ pedidos: PedidoPropio[] }>('/api/mis-pedidos', { token }),
        api<{ avisos: Aviso[] }>('/api/avisos', { token }),
      ])
      setError(null)
      setPedidos(respuestaPedidos.pedidos ?? [])
      setAvisos(respuestaAvisos.avisos ?? [])
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudieron cargar tus pedidos')
    } finally {
      setCargando(false)
    }
  }, [token])

  useEffect(() => {
    void Promise.resolve().then(cargar)
  }, [cargar])

  const verDetalle = useCallback(
    async (id: number) => {
      setError(null)
      try {
        const pedido = await api<DetallePedido>(`/api/pedidos/${id}`, { token })
        setDetalle(pedido)
      } catch (err) {
        setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo cargar el detalle')
      }
    },
    [token],
  )

  const marcarVistos = useCallback(async () => {
    setMarcando(true)
    setError(null)
    try {
      await api('/api/avisos/vistos', { metodo: 'PATCH', token })
      await cargar()
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudieron marcar los avisos')
    } finally {
      setMarcando(false)
    }
  }, [token, cargar])

  const pendientes = avisos.filter((aviso) => aviso.estado_envio === 'enviada')

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Mis pedidos</h1>

      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {pendientes.length > 0 && (
        <div className="rounded border-2 border-slate-900 bg-white p-4">
          <p className="text-base font-semibold text-slate-900">
            Tienes {pendientes.length === 1 ? 'un pedido listo' : `${pendientes.length} pedidos listos`} para recoger
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {pendientes.map((aviso) => (
              <li key={aviso.id} className="text-sm text-slate-700">
                Folio <span className="font-semibold">{aviso.numero}</span> — listo para recoger
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => void marcarVistos()} disabled={marcando} className={`${claseBoton} mt-3`}>
            {marcando ? 'Marcando…' : 'Marcar como vistos'}
          </button>
        </div>
      )}

      {cargando ? (
        <p className="text-slate-600">Cargando tus pedidos…</p>
      ) : pedidos.length === 0 ? (
        <p className="rounded border border-slate-200 bg-white px-4 py-6 text-center text-slate-600">
          Aún no tienes pedidos. Explora el menú del día para hacer el primero.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pedidos.map((pedido) => (
            <li key={pedido.id} className="rounded border border-slate-200 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-slate-900">{pedido.numero}</p>
                  <p className="text-xs text-slate-600">
                    {pedido.lineas} líneas · ${pedido.total}
                    {pedido.fecha_recoleccion ? ` · recoge ${pedido.fecha_recoleccion.replace('T', ' ')}` : ''}
                  </p>
                </div>
                <BadgeEstado estado={pedido.estado} />
              </div>
              <button
                type="button"
                onClick={() => void verDetalle(pedido.id)}
                className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-slate-700 underline"
              >
                Ver detalle
              </button>
              {detalle?.id === pedido.id && (
                <ul className="mt-2 flex flex-col gap-1 border-t border-slate-200 pt-2">
                  {detalle.detalle.map((linea) => (
                    <li key={linea.menu_dia_id} className="flex justify-between gap-2 text-sm text-slate-700">
                      <span>
                        {linea.cantidad} × {linea.platillo}
                      </span>
                      <span className="font-medium">${linea.subtotal}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
