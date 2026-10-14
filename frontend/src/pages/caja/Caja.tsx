import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeEstado } from '../../components/pedidos/BadgeEstado'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campo'
import { EstadoVacio } from '../../components/ui/EstadoVacio'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { api, ErrorPeticion } from '../../lib/api'
import { useSesion } from '../../lib/useSesion'

interface PlatilloMenu {
  id: number
  platillo: string
  categoria: string | null
  precio: string
  disponible: boolean
  especial: boolean
}

interface PedidoMostrador {
  id: number
  numero: string
  estado: string
  total: string
}

interface CobroMostrador {
  id: number
  numero: string
  estado: string
  total: string
  monto_recibido: string
  cambio: string
}

const clasePaso =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-outline bg-surface-container-lowest px-3 text-base font-semibold text-on-surface hover:bg-surface-container'

/** Captura de pedidos de mostrador y cobro en efectivo en un solo paso. */
export function Caja() {
  const { token } = useSesion()
  const [platillos, setPlatillos] = useState<PlatilloMenu[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [seleccion, setSeleccion] = useState<Record<number, number>>({})
  const [clienteNombre, setClienteNombre] = useState('')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [clave, setClave] = useState(() => crypto.randomUUID())
  const [pedido, setPedido] = useState<PedidoMostrador | null>(null)
  const [cobro, setCobro] = useState<CobroMostrador | null>(null)
  const [cobrando, setCobrando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const datos = await api<{ fecha: string; platillos: PlatilloMenu[] }>('/api/menu', { token })
      setError(null)
      setPlatillos(datos.platillos)
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo cargar el menú')
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

  const cambiarCantidad = useCallback((id: number, delta: number) => {
    setSeleccion((anterior) => {
      const nueva = { ...anterior }
      const cantidad = (nueva[id] ?? 0) + delta
      if (cantidad <= 0) {
        delete nueva[id]
      } else {
        nueva[id] = cantidad
      }
      return nueva
    })
  }, [])

  const lineas = useMemo(
    () =>
      platillos
        .filter((platillo) => (seleccion[platillo.id] ?? 0) > 0)
        .map((platillo) => ({ ...platillo, cantidad: seleccion[platillo.id] ?? 0 })),
    [platillos, seleccion],
  )
  const total = useMemo(
    () => lineas.reduce((acumulado, linea) => acumulado + Number(linea.precio) * linea.cantidad, 0),
    [lineas],
  )

  const textoBusqueda = busqueda.trim().toLowerCase()
  const disponibles = platillos.filter(
    (platillo) =>
      platillo.disponible &&
      (textoBusqueda === '' || platillo.platillo.toLowerCase().includes(textoBusqueda)),
  )

  const reiniciarVenta = useCallback(() => {
    setSeleccion({})
    setClienteNombre('')
    setMontoRecibido('')
    setClave(crypto.randomUUID())
    setPedido(null)
    setCobro(null)
    setMensaje(null)
  }, [])

  const cobrar = useCallback(async () => {
    if (lineas.length === 0 && !pedido) {
      setMensaje('Agrega al menos un platillo para cobrar')
      return
    }
    if (!montoRecibido) {
      setMensaje('Indica el monto recibido para cobrar')
      return
    }
    setCobrando(true)
    setMensaje(null)
    try {
      let pedidoActual = pedido
      if (!pedidoActual) {
        pedidoActual = await api<PedidoMostrador>('/api/pedidos/mostrador', {
          metodo: 'POST',
          token,
          cuerpo: {
            cliente_nombre: clienteNombre.trim() === '' ? undefined : clienteNombre.trim(),
            clave_idempotencia: clave,
          items: lineas.map((linea) => ({
            menu_dia_id: linea.id,
            cantidad: linea.cantidad,
          })),
          },
        })
        setPedido(pedidoActual)
      }
      const resultado = await api<CobroMostrador>(`/api/pedidos/${pedidoActual.id}/cobro`, {
        metodo: 'POST',
        token,
        cuerpo: { monto_recibido: montoRecibido },
      })
      setCobro(resultado)
    } catch (err) {
      setMensaje(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo completar el cobro')
    } finally {
      setCobrando(false)
    }
  }, [lineas, pedido, montoRecibido, token, clienteNombre, clave])

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-bold text-on-surface">Caja</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <Tarjeta className="p-4">
          <p className="font-heading text-base font-bold text-on-surface">Capturar pedido</p>
          <p className="mt-1 text-sm text-on-surface-variant">Catálogo del menú de hoy con cantidades.</p>
          <a href="#catalogo" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
            Ir al catálogo
          </a>
        </Tarjeta>
        <Tarjeta className="p-4">
          <p className="font-heading text-base font-bold text-on-surface">Entregas</p>
          <p className="mt-1 text-sm text-on-surface-variant">Pedidos listos por entregar.</p>
          <Link to="/caja/entregas" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
            Ver entregas
          </Link>
        </Tarjeta>
      </div>

      {error && (
        <EstadoVacio titulo="No se pudo cargar el menú" descripcion={error} onReintentar={refrescar} />
      )}
      {mensaje && (
        <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
          {mensaje}
        </p>
      )}

      {cobro ? (
        <Tarjeta className="p-4">
          <p className="text-sm text-on-surface-variant">Cobro confirmado: folio {cobro.numero}</p>
          <p className="mt-1 font-mono text-xl font-bold text-on-surface">{cobro.numero}</p>
          <div className="mt-2">
            <BadgeEstado estado={cobro.estado} />
          </div>
          <dl className="mt-3 grid gap-1 text-sm text-on-surface">
            <div className="flex justify-between gap-3">
              <dt>Total</dt>
              <dd className="font-medium">${cobro.total}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Recibido</dt>
              <dd className="font-medium">${cobro.monto_recibido}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Cambio</dt>
              <dd className="font-heading font-bold">${cobro.cambio}</dd>
            </div>
          </dl>
          <Boton onClick={reiniciarVenta} className="mt-4">
            Nuevo pedido
          </Boton>
        </Tarjeta>
      ) : (
        <>
          <div id="catalogo" className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-bold text-on-surface">Nuevo pedido</h2>
            <Campo
              etiqueta="Buscar producto"
              placeholder="Buscar producto…"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
            {cargando ? (
              <p className="text-on-surface-variant">Cargando menú…</p>
            ) : disponibles.length === 0 ? (
              <EstadoVacio
                titulo={textoBusqueda ? `Sin resultados para ‘${busqueda.trim()}’` : 'Sin platillos disponibles'}
                descripcion="No hay platillos disponibles en el menú de hoy."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {disponibles.map((platillo) => (
                  <li
                    key={platillo.id}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-on-surface">{platillo.platillo}</p>
                      <p className="font-heading text-sm font-bold text-on-surface">${platillo.precio} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(platillo.id, -1)}
                        aria-label={`Quitar una porción de ${platillo.platillo}`}
                        className={clasePaso}
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center font-heading text-base font-bold text-on-surface">
                        {seleccion[platillo.id] ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(platillo.id, 1)}
                        aria-label={`Agregar ${platillo.platillo}`}
                        className={clasePaso}
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Tarjeta className="p-4">
            <h2 className="font-heading text-lg font-bold text-on-surface">Cobro</h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              El pedido se registra y cobra en un solo paso.
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <Campo
                etiqueta="Nombre del cliente (opcional)"
                id="cliente"
                value={clienteNombre}
                onChange={(evento) => setClienteNombre(evento.target.value)}
                maxLength={100}
                placeholder="Para identificar la entrega"
              />
              <Campo
                etiqueta="Monto recibido"
                id="monto"
                value={montoRecibido}
                onChange={(evento) => setMontoRecibido(evento.target.value)}
                inputMode="decimal"
                placeholder="0.00"
              />
              <p className="text-right font-heading text-2xl font-extrabold text-primary">
                Total: ${total.toFixed(2)}
              </p>
              <Boton onClick={() => void cobrar()} disabled={cobrando} className="min-h-12 w-full text-base">
                {cobrando ? 'Cobrando…' : pedido ? 'Reintentar cobro' : 'Registrar y cobrar'}
              </Boton>
            </div>
          </Tarjeta>
        </>
      )}
    </section>
  )
}
