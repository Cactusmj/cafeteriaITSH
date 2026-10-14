import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EstadoVacio } from './EstadoVacio'

describe('EstadoVacio', () => {
  it('muestra título y descripción', () => {
    render(<EstadoVacio titulo="Sin resultados" descripcion="Prueba otra búsqueda" />)
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
    expect(screen.getByText('Prueba otra búsqueda')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('llama a reintentar al pulsar el botón', async () => {
    const onReintentar = vi.fn()
    render(<EstadoVacio titulo="Error" onReintentar={onReintentar} />)
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onReintentar).toHaveBeenCalledTimes(1)
  })
})
