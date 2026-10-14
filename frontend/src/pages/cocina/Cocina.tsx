import { useCallback, useEffect, useState } from 'react'
import { BadgeEstado } from '../../components/pedidos/BadgeEstado'
import { Boton } from '../../components/ui/Boton'
import { EstadoVacio } from '../../components/ui/EstadoVacio'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { api, ErrorPeticion } from '../../lib/api'
import { useSesion } from '../../lib/useSesion'

const SONDEO_MS = 4000
const UMBRAL_RETRASO_MINUTOS = 30

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

const ORDEN_COLUMNAS = ['Pagado', 'En preparación', 'Listo']

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, '0')
}

/** Tarjeta KDS de un pedido en cocina. */
function TarjetaPedido({
  pedido,
  accionando,
  onAvanzar,
}: {
  pedido: PedidoTablero
  accionando: boolean
  onAvanzar: (destino: string) => void
}) {
  const retrasado = pedido.minutos_en_espera >= UMBRAL_RETRASO_MINUTOS
  const destino = pedido.estado === 'Pagado' ? 'En preparación' : pedido.estado === 'En preparación' ? 'Listo' : null
  return (
    <Tarjeta className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-xl font-extrabold text-primary">{pedido.numero}</p>
          <p className="text-sm text-on-surface-variant">
            {pedido.cliente} ·{' '}
            <span className={retrasado ? 'font-semibold text-error' : ''}>
              hace {pedido.minutos_en_espera} min{retrasado ? ' · ¡Retrasado!' : ''}
            </span>
          </p>
        </div>
        <BadgeEstado estado={pedido.estado} />
      </div>
      <span className="inline-flex min-h-11 w-fit items-center rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
        {pedido.tipo === 'mostrador' ? 'Mostrador' : 'Anticipado'}
      </span>
      <ul className="flex flex-col gap-1 border-t border-outline-variant pt-2">
        {pedido.detalle.map((linea, indice) => (
          <li key={indice} className="flex justify-between gap-2 text-on-surface">
            <span className="text-base">
              <span className="font-heading text-xl font-extrabold">{linea.cantidad}× </span>
              {linea.platillo}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-2">
        {destino ? (
          <Boton
            onClick={() => onAvanzar(destino)}
            disabled={accionando}
            className="min-h-12 w-full text-base"
          >
            {accionando
              ? 'Actualizando…'
              : destino === 'En preparación'
                ? 'Iniciar preparación'
                : 'Marcar listo'}
          </Boton>
        ) : (
          <p className="text-center text-sm text-on-surface-variant">
            Listo — en espera de caja
          </p>
        )}
      </div>
    </Tarjeta>
  )
}

/** Tablero de cocina: pedidos en flujo con avance de estados. */
export function Cocina() {
  const { token } = useSesion()
  const [pedidos, setPedidos] = useState<PedidoTablero[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accionando, setAccionando] = useState<number | null>(null)
  const [actualizado, setActualizado] = useState<Date | null>(null)
  const [fallos, setFallos] = useState(0)

  const cargar = useCallback(async () => {
    try {
      const datos = await api<{ pedidos: PedidoTablero[] }>('/api/cocina/pedidos', { token })
      setError(null)
      setFallos(0)
      setPedidos(datos.pedidos ?? [])
      setActualizado(new Date())
    } catch (err) {
      setFallos((anterior) => anterior + 1)
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

  function refrescar() {
    setCargando(true)
    void cargar()
  }

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

  const columnas = ORDEN_COLUMNAS.map((estado) => ({
    estado,
    pedidos: pedidos.filter((pedido) => pedido.estado === estado),
  })).filter((columna) => columna.pedidos.length > 0)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-on-surface">
          Cocina {pedidos.length > 0 && <span className="text-lg">· {pedidos.length} pedidos</span>}
        </h1>
        <p className="text-xs text-on-surface-variant" aria-live="polite">
          {fallos >= 2 ? (
            <span className="font-semibold text-error">Sin conexión — reintentando…</span>
          ) : actualizado ? (
            `Actualizado ${dosDigitos(actualizado.getHours())}:${dosDigitos(actualizado.getMinutes())}:${dosDigitos(actualizado.getSeconds())}`
          ) : (
            'Cargando…'
          )}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-on-surface-variant">Cargando tablero…</p>
      ) : pedidos.length === 0 ? (
        <EstadoVacio
          titulo="¡Todo está al día!"
          descripcion="No hay pedidos en cocina. Los pedidos pagados aparecen aquí solos."
          onReintentar={refrescar}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {columnas.map((columna) => (
            <div key={columna.estado} className="flex flex-col gap-3">
              <h2 className="hidden font-heading text-lg font-bold text-on-surface lg:block">
                {columna.estado === 'Pagado' ? 'Por preparar' : columna.estado}
              </h2>
              <ul className="flex flex-col gap-3">
                {columna.pedidos.map((pedido) => (
                  <li key={pedido.id}>
                    <TarjetaPedido
                      pedido={pedido}
                      accionando={accionando === pedido.id}
                      onAvanzar={(destino) => void avanzar(pedido, destino)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
