import { useCallback, useEffect, useState } from 'react'
import { BadgeEstado } from '../../components/pedidos/BadgeEstado'
import { Boton } from '../../components/ui/Boton'
import { EstadoVacio } from '../../components/ui/EstadoVacio'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { api, ErrorPeticion } from '../../lib/api'
import { useSesion } from '../../lib/useSesion'

interface PendienteCaja {
  id: number
  numero: string
  tipo: string
  estado: string
  total: string
  cliente_nombre: string | null
  lineas: number
}

/** Pedidos listos por entregar, por orden de llegada. */
export function Entregas() {
  const { token } = useSesion()
  const [pendientes, setPendientes] = useState<PendienteCaja[]>([])
  const [cargando, setCargando] = useState(true)
  const [accion, setAccion] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const datos = await api<{ pendientes: PendienteCaja[] }>('/api/caja/pendientes', { token })
      setMensaje(null)
      setPendientes(datos.pendientes ?? [])
    } catch (err) {
      setMensaje(err instanceof ErrorPeticion ? err.mensaje : 'No se pudieron cargar las entregas')
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

  const cambiarEstado = useCallback(
    async (id: number, estado: string) => {
      setAccion(id)
      setMensaje(null)
      try {
        await api(`/api/pedidos/${id}/estado`, {
          metodo: 'PATCH',
          token,
          cuerpo: { estado },
        })
        await cargar()
      } catch (err) {
        setMensaje(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo actualizar el pedido')
      } finally {
        setAccion(null)
      }
    },
    [token, cargar],
  )

  const cobrarPendiente = useCallback(
    async (pendiente: PendienteCaja) => {
      setAccion(pendiente.id)
      setMensaje(null)
      try {
        await api(`/api/pedidos/${pendiente.id}/cobro`, {
          metodo: 'POST',
          token,
          cuerpo: { monto_recibido: pendiente.total },
        })
        await cargar()
      } catch (err) {
        setMensaje(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo completar el cobro')
      } finally {
        setAccion(null)
      }
    },
    [token, cargar],
  )

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-on-surface">Entregas</h1>
        {pendientes.length > 0 && (
          <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
            {pendientes.length} {pendientes.length === 1 ? 'pendiente' : 'pendientes'}
          </span>
        )}
      </div>

      {mensaje && (
        <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
          {mensaje}
        </p>
      )}

      {cargando ? (
        <p className="text-on-surface-variant">Cargando entregas…</p>
      ) : pendientes.length === 0 ? (
        <EstadoVacio
          titulo="¡Todo está al día!"
          descripcion="No hay pedidos listos por entregar."
          onReintentar={refrescar}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {pendientes.map((pendiente) => (
            <li key={pendiente.id}>
              <Tarjeta className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-xl font-bold text-on-surface">{pendiente.numero}</p>
                    <p className="text-xs text-on-surface-variant">
                      {pendiente.cliente_nombre ?? (pendiente.tipo === 'mostrador' ? 'Sin nombre' : '')} ·{' '}
                      {pendiente.lineas} líneas · ${pendiente.total}
                    </p>
                  </div>
                  <BadgeEstado estado={pendiente.estado} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pendiente.estado === 'Pendiente' && (
                    <Boton
                      onClick={() => void cobrarPendiente(pendiente)}
                      disabled={accion === pendiente.id}
                    >
                      Cobrar ${pendiente.total}
                    </Boton>
                  )}
                  {pendiente.estado === 'Listo' && (
                    <Boton
                      onClick={() => void cambiarEstado(pendiente.id, 'Entregado')}
                      disabled={accion === pendiente.id}
                    >
                      Entregar
                    </Boton>
                  )}
                  {pendiente.estado !== 'Entregado' && (
                    <Boton
                      variante="secundario"
                      onClick={() => void cambiarEstado(pendiente.id, 'Cancelado')}
                      disabled={accion === pendiente.id}
                    >
                      Cancelar
                    </Boton>
                  )}
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}

      <div>
        <Boton variante="secundario" onClick={refrescar} disabled={cargando}>
          {cargando ? 'Actualizando…' : 'Actualizar'}
        </Boton>
      </div>
    </section>
  )
}
