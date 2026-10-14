import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campo'
import { ErrorPeticion } from '../../lib/api'
import { useSesion } from '../../lib/useSesion'
import { INICIO_POR_ROL } from '../../lib/sesion'

/** Pantalla de inicio de sesión. */
export function Login() {
  const { iniciarSesion } = useSesion()
  const navegar = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const usuario = await iniciarSesion(correo, password)
      navegar(INICIO_POR_ROL[usuario.rol], { replace: true })
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo iniciar sesión')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 font-heading text-2xl font-bold text-on-surface">Iniciar sesión</h1>
      <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
        <Campo
          etiqueta="Correo"
          type="email"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          autoComplete="email"
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && (
          <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
            {error}
          </p>
        )}

        <Boton type="submit" disabled={enviando} className="w-full text-base">
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </Boton>
      </form>

      <p className="mt-4 text-sm text-on-surface-variant">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-medium text-primary underline">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
