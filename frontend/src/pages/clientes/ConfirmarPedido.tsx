import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeEstado } from '../../components/pedidos/BadgeEstado'
import { Boton } from '../../components/ui/Boton'
import { EstadoVacio } from '../../components/ui/EstadoVacio'
import { Tarjeta } from '../../components/ui/Tarjeta'
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
const ANTICIPACION_MINIMA_MINUTOS = 10

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
  const [horaMinima, setHoraMinima] = useState('')
  const [horarioCorto, setHorarioCorto] = useState(false)

  const slots = useMemo(() => generarSlots(new Date()), [])
  const total = totalCarrito(lineas)

  useEffect(() => {
    void Promise.resolve().then(() => {
      const minima = new Date(Date.now() + ANTICIPACION_MINIMA_MINUTOS * 60_000)
      setHoraMinima(`${dosDigitos(minima.getHours())}:${dosDigitos(minima.getMinutes())}`)
    })
  }, [])

  function elegirHorario(valor: string) {
    setHorario(valor)
    setHorarioCorto(
      valor !== '' && new Date(valor).getTime() - Date.now() < ANTICIPACION_MINIMA_MINUTOS * 60_000,
    )
  }

  const crearPedido = useCallback(async () => {
    if (!horario) {
      setMensaje('Elige un horario de recolección para continuar')
      return
    }
    if (new Date(horario).getTime() - Date.now() < ANTICIPACION_MINIMA_MINUTOS * 60_000) {
      setMensaje(`El pedido debe hacerse con al menos 10 minutos de anticipación${horaMinima ? ` (a partir de las ${horaMinima})` : ''}`)
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
  }, [horario, horaMinima, lineas, token])

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
        <h1 className="font-heading text-2xl font-bold text-on-surface">Confirmar pedido</h1>
        <EstadoVacio
          titulo="Tu carrito está vacío"
          descripcion="Elige platillos del menú para continuar."
        />
        <div>
          <Boton onClick={() => navegar('/menu')}>Volver al menú</Boton>
        </div>
      </section>
    )
  }

  if (pedido) {
    const pagado = pedido.estado === 'Pagado'
    return (
      <section className="flex flex-col gap-4">
        <h1 className="font-heading text-2xl font-bold text-on-surface">
          {pagado ? 'Confirmación de pedido' : 'Pagar pedido'}
        </h1>

        <Tarjeta className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-on-surface-variant">Folio</p>
              <p className="font-mono text-2xl font-bold text-on-surface">{pedido.numero}</p>
            </div>
            <BadgeEstado estado={pedido.estado} />
          </div>
          <dl className="mt-3 grid gap-1 text-sm text-on-surface">
            <div className="flex justify-between gap-3">
              <dt>Total</dt>
              <dd className="font-heading font-bold">${pedido.total}</dd>
            </div>
            {pedido.fecha_recoleccion && (
              <div className="flex justify-between gap-3">
                <dt>Recolección</dt>
                <dd className="font-medium">{pedido.fecha_recoleccion.replace('T', ' ')}</dd>
              </div>
            )}
            {pedido.pago?.referencia && (
              <div className="flex justify-between gap-3">
                <dt>Referencia de pago</dt>
                <dd className="font-medium">{pedido.pago.referencia}</dd>
              </div>
            )}
          </dl>
        </Tarjeta>

        {mensaje && (
          <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
            {mensaje}
          </p>
        )}

        {pagado ? (
          <p className="text-sm text-on-surface-variant">
            Tu pedido ya está en la cocina. Te avisaremos cuando esté listo para recoger.
          </p>
        ) : (
          <>
            <p className="rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface-variant">
              Este proceso no captura datos de tarjeta.
            </p>
            <Boton onClick={() => void pagarPedido()} disabled={pagando} className="min-h-12 w-full text-base">
              {pagando ? 'Procesando…' : `Pagar $${pedido.total}`}
            </Boton>
          </>
        )}

        <div className="flex flex-wrap gap-3">
          <Boton onClick={() => navegar('/mis-pedidos')}>Ver mis pedidos</Boton>
          <Boton variante="secundario" onClick={() => navegar('/menu')}>
            Volver al menú
          </Boton>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Boton variante="secundario" onClick={() => navegar('/menu')}>
          Regresar
        </Boton>
        <h1 className="font-heading text-2xl font-bold text-on-surface">Revisa tu pedido</h1>
      </div>

      <Tarjeta className="p-4">
        <ul className="flex flex-col gap-2">
          {lineas.map((linea) => (
            <li key={linea.menu_dia_id} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-on-surface">{linea.platillo}</p>
                <p className="text-xs text-on-surface-variant">
                  {linea.cantidad} × ${linea.precio}
                </p>
              </div>
              <p className="font-heading text-sm font-bold text-on-surface">
                ${(Number(linea.precio) * linea.cantidad).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right font-heading text-2xl font-extrabold text-primary">
          Total: ${total}
        </p>
      </Tarjeta>

      <div className="flex flex-col gap-2">
        <label htmlFor="horario" className="text-sm font-medium text-on-surface-variant">
          Hora de recolección
        </label>
        <select
          id="horario"
          value={horario}
          onChange={(evento) => elegirHorario(evento.target.value)}
          className="min-h-11 rounded-lg border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Elige un horario</option>
          {slots.map((slot) => (
            <option key={slot.valor} value={slot.valor}>
              {slot.etiqueta}
            </option>
          ))}
        </select>
        <p className="text-xs text-on-surface-variant">
          El pedido debe hacerse con al menos 10 minutos de anticipación.
        </p>
        {horarioCorto && (
          <p role="alert" className="text-sm font-medium text-error">
            Esa hora ya no alcanza la anticipación mínima{horaMinima ? ` (a partir de las ${horaMinima})` : ''}.
          </p>
        )}
        {slots.length === 0 && (
          <p className="text-sm text-on-surface-variant">
            Ya no hay horarios disponibles hoy. Vuelve mañana.
          </p>
        )}
      </div>

      {mensaje && (
        <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
          {mensaje}
        </p>
      )}

      <Boton
        onClick={() => void crearPedido()}
        disabled={creando || slots.length === 0}
        className="min-h-12 w-full text-base"
      >
        {creando ? 'Creando pedido…' : 'Continuar al pago'}
      </Boton>
      <p className="text-center text-xs text-on-surface-variant">
        Recogida presencial en la cafetería.
      </p>

      <button
        type="button"
        onClick={() => {
          limpiarCarrito()
          limpiarClavePedido()
          setLineas([])
          navegar('/menu')
        }}
        className="self-start text-sm font-medium text-error underline"
      >
        Vaciar carrito
      </button>
    </section>
  )
}
