import type { ReactNode } from 'react'

interface TarjetaPropiedades {
  children: ReactNode
  className?: string
}

/** Tarjeta blanca del sistema de diseño. */
export function Tarjeta({ children, className = '' }: TarjetaPropiedades) {
  return (
    <div
      className={`rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}
