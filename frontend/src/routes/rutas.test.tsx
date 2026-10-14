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
    vi.fn().mockImplementation((url: string) => {
      let cuerpo: unknown = { usuarios: [] }
      if (url.includes('/api/admin/platillos')) {
        cuerpo = { platillos: [] }
      } else if (url.includes('/api/admin/menu') || url.includes('/api/menu')) {
        cuerpo = { fecha: '2026-10-13', entradas: [], platillos: [] }
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => cuerpo,
      })
    }),
  )
})

describe('guardas de rutas', () => {
  it('redirige a /login cuando no hay sesión', () => {
    renderizar('/menu')
    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('permite al cliente ver el menú', async () => {
    simularSesion('usuario')
    renderizar('/menu')
    expect(await screen.findByRole('heading', { name: /menú del día/i })).toBeInTheDocument()
  })

  it('impide que un cliente acceda al panel de administración', async () => {
    simularSesion('usuario')
    renderizar('/admin/usuarios')
    expect(await screen.findByRole('heading', { name: /menú del día/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /gestión de usuarios/i })).not.toBeInTheDocument()
  })

  it('permite al cliente abrir la confirmación del pedido', async () => {
    simularSesion('usuario')
    renderizar('/confirmar-pedido')
    expect(await screen.findByRole('heading', { name: /confirmar pedido/i })).toBeInTheDocument()
  })

  it('impide a un cajero abrir la confirmación del pedido', async () => {
    simularSesion('cajero')
    renderizar('/confirmar-pedido')
    expect(await screen.findByRole('heading', { name: /pedido de mostrador|caja/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /confirmar pedido/i })).not.toBeInTheDocument()
  })

  it('permite al cajero abrir la caja', async () => {
    simularSesion('cajero')
    renderizar('/caja')
    expect(await screen.findByRole('heading', { name: /^caja$/i })).toBeInTheDocument()
  })

  it('permite al cocinero abrir la cocina', async () => {
    simularSesion('cocinero')
    renderizar('/cocina')
    expect(await screen.findByRole('heading', { name: /^cocina$/i })).toBeInTheDocument()
  })

  it('impide que un cliente abra la caja o la cocina', async () => {
    simularSesion('usuario')
    renderizar('/caja')
    expect(await screen.findByRole('heading', { name: /menú del día/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^caja$/i })).not.toBeInTheDocument()
  })
})
