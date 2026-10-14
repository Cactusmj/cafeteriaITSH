import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface BotonPropiedades extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario'
  children: ReactNode
}

const claseBase =
  'inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60'

const clasePorVariante: Record<'primario' | 'secundario', string> = {
  primario: 'bg-primary text-on-primary hover:brightness-110',
  secundario: 'border border-primary bg-transparent text-primary hover:bg-primary-container',
}

/** Botón del sistema de diseño (primario verde o secundario con borde). */
export function Boton({ variante = 'primario', children, className = '', ...resto }: BotonPropiedades) {
  return (
    <button type="button" className={`${claseBase} ${clasePorVariante[variante]} ${className}`} {...resto}>
      {children}
    </button>
  )
}
