import { Sparkles } from 'lucide-react'

/** Insignia pill espresso para el especial del día. */
export function InsigniaEspecial() {
  return (
    <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-tertiary px-3 py-1 text-xs font-semibold text-on-tertiary">
      <Sparkles aria-hidden="true" className="size-4" strokeWidth={2.2} />
      Especial
    </span>
  )
}
