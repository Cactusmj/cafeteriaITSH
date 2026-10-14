import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProveedorSesion } from '../../lib/ContextoSesion'
import { Login } from './Login'

describe('Login identidad institucional', () => {
  it('usa tipografía de títulos, botón primario verde y campos del sistema', () => {
    render(
      <MemoryRouter>
        <ProveedorSesion>
          <Login />
        </ProveedorSesion>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toHaveClass('font-heading')
    expect(screen.getByRole('button', { name: 'Ingresar' })).toHaveClass('bg-primary', 'text-on-primary')
    expect(screen.getByLabelText('Correo')).toHaveClass('border-outline')
  })
})
