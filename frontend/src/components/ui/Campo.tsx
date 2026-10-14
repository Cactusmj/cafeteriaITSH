import type { InputHTMLAttributes } from 'react'

interface CampoPropiedades extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string
  error?: string
}

/** Campo de formulario con etiqueta visible y error en línea. */
export function Campo({ etiqueta, error, id, className = '', ...resto }: CampoPropiedades) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-on-surface-variant">
      <span>{etiqueta}</span>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-lg border border-outline bg-surface-container-lowest px-3 py-2 text-base text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
        {...resto}
      />
      {error && (
        <span role="alert" className="text-sm font-normal text-error">
          {error}
        </span>
      )}
    </label>
  )
}
