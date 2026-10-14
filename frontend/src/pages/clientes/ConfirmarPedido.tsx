import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ErrorPeticion } from '../../lib/api'
import {
  leerCarrito,
  leerClavePedido,
  limpiarCarrito,
  limpiarClavePedido,
  totalCarrito,
  type LineaCarrito,
} from '../../lib/carrito'
import { useSesion } from '../../lib/useSesion'

const CIERRE_CAFETERIA = 17
const INTERVALO_MINUTOS = 15

interface PagoConfirmacion {
  metodo: string
  monto: string
  referencia: string | null
  fecha: string
}

interface PedidoConfirmacion {
  id: number
  numero: string
  estado: string
  fecha_recoleccion: string | null
  total: string
  detalle: { menu_dia_id: number; platillo: string; cantidad: number; precio_unitario: string; subtotal: string }[]
  pago: PagoConfirmacion | null
}

interface Slot {
  valor: string
  etiqueta: string
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, '0')
}

function formatearSlot(valor: Date): string {
  return `${valor.getFullYear()}-${dosDigitos(valor.getMonth() + 1)}-${dosDigitos(valor.getDate())}T${dosDigitos(valor.getHours())}:${dosDigitos(valor.getMinutes())}`
}

/** Horarios cada 15 minutos desde `ahora + 15` hasta el cierre de la cafetería. */
function generarSlots(ahora: Date): Slot[] {
  const slots: Slot[] = []
  const inicio = new Date(ahora.getTime() + INTERVALO_MINUTOS * 60_000)
  inicio.setSeconds(0, 0)
  const resto = INTERVALO_MINUTOS - (inicio.getMinutes() % INTERVALO_MINUTOS)
  if (resto < INTERVALO_MINUTOS) {
    inicio.setMinutes(inicio.getMinutes() + resto)
  }
  const cierre = new Date(inicio)
  cierre.setHours(CIERRE_CAFETERIA, 0, 0, 0)

  for (const momento = new Date(inicio); momento <= cierre; momento.setMinutes(momento.getMinutes() + INTERVALO_MINUTOS)) {
    if (
      momento.getFullYear() !== ahora.getFullYear() ||
      momento.getMonth() !== ahora.getMonth() ||
      momento.getDate() !== ahora.getDate()
    ) {
      break
    }
    slots.push({
      valor: formatearSlot(momento),
      etiqueta: `${dosDigitos(momento.getHours())}:${dosDigitos(momento.getMinutes())}`,
    })
  }
  return slots
}

const claseBoton =
  'inline-flex min-h-11 items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60'

/** Confirmación del pedido anticipado y su pago en línea. */
export function ConfirmarPedido() {
  const { token } = useSesion()
  const navegar = useNavigate()
  const [lineas, setLineas] = useState<LineaCarrito[]>(() => leerCarrito())
  const [horario, setHorario] = useState('')
  const [pedido, setPedido] = useState<PedidoConfirmacion | null>(null)
  const [creando, setCreando] = useState(false)
  const [pagando, setPagando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const slots = useMemo(() => generarSlots(new Date()), [])
  const total = totalCarrito(lineas)

  const crearPedido = useCallback(async () => {
    if (!horario) {
      setMensaje('Elige un horario de recolección para continuar')
      return
    }
    setCreando(true)
    setMensaje(null)
    try {
      const resultado = await api<PedidoConfirmacion>('/api/pedidos', {
        metodo: 'POST',
        token,
        cuerpo: {
          fecha_recoleccion: horario,
          clave_idempotencia: leerClavePedido(),
          items: lineas.map((linea) => ({ menu_dia_id: linea.menu_dia_id, cantidad: linea.cantidad })),
        },
      })
      setPedido(resultado)
    } catch (err) {
      setMensaje(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo crear el pedido')
    } finally {
      setCreando(false)
    }
  }, [horario, lineas, token])

  const pagarPedido = useCallback(async () => {
    if (!pedido) {
      return
    }
    setPagando(true)
    setMensaje(null)
    try {
      const confirmacion = await api<{
        id: number
        numero: string
        estado: string
        total: string
        fecha_recoleccion: string | null
        pago: PagoConfirmacion
      }>(`/api/pedidos/${pedido.id}/pago`, { metodo: 'POST', token, cuerpo: {} })
      setPedido({ ...pedido, estado: confirmacion.estado, pago: confirmacion.pago })
      limpiarCarrito()
      limpiarClavePedido()
      setLineas([])
    } catch (err) {
      setMensaje(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo completar el pago')
    } finally {
      setPagando(false)
    }
  }, [pedido, token])

  if (!pedido && lineas.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Confirmar pedido</h1>
        <p className="rounded border border-slate-200 bg-white px-4 py-6 text-center text-slate-600">
          Tu carrito está vacío. Elige platillos del menú para continuar.
        </p>
        <div>
          <Link to="/menu" className={`${claseBoton} no-underline`}>
            Volver al menú
          </Link>
        </div>
      </section>
    )
  }

  if (pedido) {
    const pagado = pedido.estado === 'Pagado'
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          {pagado ? 'Pedido confirmado' : 'Pedido creado'}
        </h1>

        <div className="rounded border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Folio</p>
          <p className="text-lg font-semibold text-slate-900">{pedido.numero}</p>
          <dl className="mt-3 grid gap-1 text-sm text-slate-700">
            <div className="flex justify-between gap-3">
              <dt>Estado</dt>
              <dd className="font-medium">{pedido.estado}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Total</dt>
              <dd className="font-medium">${pedido.total}</dd>
            </div>
            {pedido.fecha_recoleccion && (
              <div className="flex justify-between gap-3">
                <dt>Recolección</dt>
                <dd className="font-medium">{pedido.fecha_recoleccion.replace('T', ' ')}</dd>
              </div>
            )}
            {pedido.pago && (
              <div className="flex justify-between gap-3">
                <dt>Referencia de pago</dt>
                <dd className="font-medium">{pedido.pago.referencia}</dd>
              </div>
            )}
          </dl>
        </div>

        {mensaje && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {mensaje}
          </p>
        )}

        {pagado ? (
          <p className="text-sm text-slate-600">
            Tu pedido ya está en la cocina. Te avisaremos cuando esté listo para recoger.
          </p>
        ) : (
          <button type="button" onClick={() => void pagarPedido()} disabled={pagando} className={claseBoton}>
            {pagando ? 'Procesando pago…' : `Pagar $${pedido.total}`}
          </button>
        )}

        <div>
          <Link to="/menu" className="text-sm font-medium text-slate-700 underline">
            Volver al menú
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-slate-900">Confirmar pedido</h1>

      <ul className="flex flex-col gap-2">
        {lineas.map((linea) => (
          <li
            key={linea.menu_dia_id}
            className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{linea.platillo}</p>
              <p className="text-xs text-slate-600">
                {linea.cantidad} × ${linea.precio}
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              ${(Number(linea.precio) * linea.cantidad).toFixed(2)}
            </p>
          </li>
        ))}
      </ul>

      <p className="text-right text-base font-semibold text-slate-900">Total: ${total}</p>

      <div className="flex flex-col gap-2">
        <label htmlFor="horario" className="text-sm font-medium text-slate-700">
          Horario de recolección (mínimo 10 minutos)
        </label>
        <select
          id="horario"
          value={horario}
          onChange={(evento) => setHorario(evento.target.value)}
          className="min-h-11 rounded border border-slate-300 bg-white px-3 text-sm text-slate-900"
        >
          <option value="">Elige un horario</option>
          {slots.map((slot) => (
            <option key={slot.valor} value={slot.valor}>
              {slot.etiqueta}
            </option>
          ))}
        </select>
        {slots.length === 0 && (
          <p className="text-sm text-slate-600">
            Ya no hay horarios disponibles hoy. Vuelve mañana.
          </p>
        )}
      </div>

      {mensaje && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {mensaje}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void crearPedido()} disabled={creando || slots.length === 0} className={claseBoton}>
          {creando ? 'Creando pedido…' : 'Confirmar y pagar'}
        </button>
        <Link to="/menu" className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-slate-700 underline">
          Seguir eligiendo
        </Link>
      </div>

      <button
        type="button"
        onClick={() => {
          limpiarCarrito()
          limpiarClavePedido()
          setLineas([])
          navegar('/menu')
        }}
        className="self-start text-sm font-medium text-red-700 underline"
      >
        Vaciar carrito
      </button>
    </section>
  )
}
