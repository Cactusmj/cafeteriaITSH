import type { ReactNode } from 'react'

interface TarjetaPropiedades {
  children: ReactNode
  className?: string
}

/** Tarjeta blanca del sistema de diseño, con sombra sutil y transición. */
export function Tarjeta({ children, className = '' }: TarjetaPropiedades) {
  return (
    <div
      className={`rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {children}
    </div>
  )
}
