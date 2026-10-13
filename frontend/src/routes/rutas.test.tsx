import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProveedorSesion } from '../lib/ContextoSesion'
import { AppRouter } from './AppRouter'

function simularSesion(rol: 'administrador' | 'cajero' | 'cocinero' | 'usuario') {
  localStorage.setItem('cafeteria.token', 'token-de-prueba')
  localStorage.setItem(
    'cafeteria.usuario',
    JSON.stringify({ id: 1, nombre: 'Prueba', correo: 'prueba@itssh.edu.mx', rol }),
  )
}

function renderizar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ProveedorSesion>
        <AppRouter />
      </ProveedorSesion>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ usuarios: [] }),
    }),
  )
})

describe('guardas de rutas', () => {
  it('redirige a /login cuando no hay sesión', () => {
    renderizar('/menu')
    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('permite al cliente ver el menú', () => {
    simularSesion('usuario')
    renderizar('/menu')
    expect(screen.getByRole('heading', { name: /^menú$/i })).toBeInTheDocument()
  })

  it('impide que un cliente acceda al panel de administración', () => {
    simularSesion('usuario')
    renderizar('/admin/usuarios')
    expect(screen.getByRole('heading', { name: /^menú$/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /gestión de usuarios/i })).not.toBeInTheDocument()
  })
})
