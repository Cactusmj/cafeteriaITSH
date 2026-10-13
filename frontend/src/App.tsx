import { BrowserRouter } from 'react-router-dom'
import { ProveedorSesion } from './lib/ContextoSesion'
import { AppRouter } from './routes/AppRouter'

function App() {
  return (
    <BrowserRouter>
      <ProveedorSesion>
        <AppRouter />
      </ProveedorSesion>
    </BrowserRouter>
  )
}

export default App
