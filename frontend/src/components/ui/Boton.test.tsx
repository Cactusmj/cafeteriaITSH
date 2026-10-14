import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Boton } from './Boton'

describe('Boton', () => {
  it('muestra la variante primaria verde por defecto', () => {
    render(<Boton>Entrar</Boton>)
    const boton = screen.getByRole('button', { name: 'Entrar' })
    expect(boton).toHaveClass('bg-primary', 'text-on-primary', 'min-h-11')
  })

  it('muestra la variante secundaria con borde verde', () => {
    render(<Boton variante="secundario">Cancelar</Boton>)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveClass('border-primary')
  })

  it('propaga deshabilitado y onClick', () => {
    render(
      <Boton disabled>
        Espera
      </Boton>,
    )
    expect(screen.getByRole('button', { name: 'Espera' })).toBeDisabled()
  })
})
