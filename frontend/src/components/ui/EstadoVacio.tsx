import { Boton } from './Boton'

interface EstadoVacioPropiedades {
  titulo: string
  descripcion?: string
  textoReintentar?: string
  onReintentar?: () => void
}

/** Estado centrado de carga/vacío/error con acción de reintento opcional. */
export function EstadoVacio({ titulo, descripcion, textoReintentar = 'Reintentar', onReintentar }: EstadoVacioPropiedades) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-6 text-center">
      <p className="font-heading text-lg font-bold text-on-surface">{titulo}</p>
      {descripcion && <p className="mt-1 text-sm text-on-surface-variant">{descripcion}</p>}
      {onReintentar && (
        <div className="mt-3">
          <Boton variante="secundario" onClick={onReintentar}>
            {textoReintentar}
          </Boton>
        </div>
      )}
    </div>
  )
}
