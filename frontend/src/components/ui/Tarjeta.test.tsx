import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Tarjeta } from './Tarjeta'

describe('Tarjeta', () => {
  it('muestra el contenido en tarjeta blanca', () => {
    render(
      <Tarjeta>
        <span>Hola</span>
      </Tarjeta>,
    )
    expect(screen.getByText('Hola')).toBeInTheDocument()
  })
})
