import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeEstado } from '../../components/pedidos/BadgeEstado'
import { Boton } from '../../components/ui/Boton'
import { EstadoVacio } from '../../components/ui/EstadoVacio'
import { Tarjeta } from '../../components/ui/Tarjeta'
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

const ESTADOS_ACTIVOS = ['Pendiente', 'Pagado', 'En preparación', 'Listo']

/** Seguimiento de pedidos y avisos de listo del cliente. */
export function MisPedidos() {
  const { token } = useSesion()
  const navegar = useNavigate()
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

  function refrescar() {
    setCargando(true)
    void cargar()
  }

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
  const activos = pedidos.filter((pedido) => ESTADOS_ACTIVOS.includes(pedido.estado)).length

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-on-surface">Mis pedidos</h1>
        {pedidos.length > 0 && (
          <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
            {activos === 0 ? 'Sin pedidos activos' : `${activos} ${activos === 1 ? 'activo' : 'activos'}`}
          </span>
        )}
      </div>

      {error && (
        <EstadoVacio titulo="No se pudieron cargar tus pedidos" descripcion={error} onReintentar={refrescar} />
      )}

      {pendientes.length > 0 && (
        <div className="rounded-xl border-2 border-status-ready bg-surface-container-lowest p-4 shadow-sm">
          <p className="font-heading text-base font-bold text-on-surface">
            ¡Listo para recoger! Tienes{' '}
            {pendientes.length === 1 ? 'un pedido listo' : `${pendientes.length} pedidos listos`}
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {pendientes.map((aviso) => (
              <li key={aviso.id} className="text-sm text-on-surface">
                Folio <span className="font-semibold">{aviso.numero}</span> — listo para recoger
              </li>
            ))}
          </ul>
          <Boton onClick={() => void marcarVistos()} disabled={marcando} className="mt-3">
            {marcando ? 'Marcando…' : 'Marcar como vistos'}
          </Boton>
        </div>
      )}

      {cargando ? (
        <p className="text-on-surface-variant">Cargando tus pedidos…</p>
      ) : pedidos.length === 0 ? (
        <>
          <EstadoVacio
            titulo="Aún no tienes pedidos"
            descripcion="Explora el menú del día para hacer el primero."
          />
          <div>
            <Boton onClick={() => navegar('/menu')}>Nuevo pedido</Boton>
          </div>
        </>
      ) : (
        <ul className="flex flex-col gap-3">
          {pedidos.map((pedido) => {
            const listo = pedido.estado === 'Listo'
            return (
              <li key={pedido.id}>
                <Tarjeta
                  className={`p-4 ${listo ? 'border-2 border-status-ready' : ''}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-heading text-base font-bold text-on-surface">{pedido.numero}</p>
                      <p className="text-xs text-on-surface-variant">
                        {pedido.lineas} líneas · ${pedido.total}
                        {pedido.fecha_recoleccion ? ` · recoge ${pedido.fecha_recoleccion.replace('T', ' ')}` : ''}
                      </p>
                    </div>
                    <BadgeEstado estado={pedido.estado} />
                  </div>
                  <button
                    type="button"
                    onClick={() => void verDetalle(pedido.id)}
                    className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary underline"
                  >
                    Ver detalle
                  </button>
                  {detalle?.id === pedido.id && (
                    <ul className="mt-2 flex flex-col gap-1 border-t border-outline-variant pt-2">
                      {detalle.detalle.map((linea) => (
                        <li key={linea.menu_dia_id} className="flex justify-between gap-2 text-sm text-on-surface">
                          <span>
                            {linea.cantidad} × {linea.platillo}
                          </span>
                          <span className="font-medium">${linea.subtotal}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Tarjeta>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
