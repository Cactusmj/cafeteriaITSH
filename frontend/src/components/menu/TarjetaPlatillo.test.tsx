import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TarjetaPlatillo } from './TarjetaPlatillo'

const base = {
  platillo: 'Café americano',
  categoria: 'bebidas',
  descripcion: 'Recién hecho',
  precio: '25.00',
}

describe('TarjetaPlatillo identidad y stepper', () => {
  it('usa tokens del sistema (tarjeta blanca, precio con tipografía de títulos)', () => {
    const { container } = render(<TarjetaPlatillo {...base} disponible especial={false} />)
    expect(container.querySelector('article')).toHaveClass('bg-surface-container-lowest')
    expect(screen.getByText('$25.00')).toHaveClass('font-heading')
  })

  it('muestra Especial con acento espresso', () => {
    render(<TarjetaPlatillo {...base} disponible especial />)
    expect(screen.getByText('Especial')).toHaveClass('bg-tertiary', 'text-on-tertiary')
  })

  it('atenúa el no disponible y deshabilita el stepper', async () => {
    const onAgregar = vi.fn()
    const { container } = render(
      <TarjetaPlatillo {...base} disponible={false} especial={false} cantidad={0} onAgregar={onAgregar} />,
    )
    expect(container.querySelector('article')).toHaveClass('opacity-70')
    expect(screen.getByText('No disponible')).toBeInTheDocument()
    const agregar = screen.getByRole('button', { name: /agregar café/i })
    expect(agregar).toBeDisabled()
    expect(agregar).toHaveClass('min-h-11')
    await userEvent.click(agregar)
    expect(onAgregar).not.toHaveBeenCalled()
  })

  it('el stepper suma y resta en áreas de 44 px', async () => {
    const onAgregar = vi.fn()
    const onQuitar = vi.fn()
    render(
      <TarjetaPlatillo
        {...base}
        disponible
        especial={false}
        cantidad={2}
        onAgregar={onAgregar}
        onQuitar={onQuitar}
      />,
    )
    expect(screen.getByLabelText(/cantidad de café/i)).toHaveTextContent('2')
    const quitar = screen.getByRole('button', { name: /quitar una porción/i })
    expect(quitar).toHaveClass('min-h-11', 'min-w-11')
    await userEvent.click(quitar)
    expect(onQuitar).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: /agregar café/i }))
    expect(onAgregar).toHaveBeenCalledTimes(1)
  })
})
