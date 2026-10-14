import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Campo } from './Campo'

describe('Campo', () => {
  it('muestra etiqueta visible y asocia el input', async () => {
    const onChange = vi.fn()
    render(<Campo etiqueta="Correo" placeholder="tu@correo" onChange={onChange} />)
    const input = screen.getByLabelText('Correo')
    expect(input).toBeInTheDocument()
    await userEvent.type(input, 'a')
    expect(onChange).toHaveBeenCalled()
  })

  it('muestra el error en línea con alerta', () => {
    render(<Campo etiqueta="Correo" error="Correo inválido" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Correo inválido')
  })
})
