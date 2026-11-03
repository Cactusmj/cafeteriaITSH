import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Coffee, LogIn } from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campo'
import { Tarjeta } from '../../components/ui/Tarjeta'
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
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span aria-hidden="true" className="inline-flex min-h-16 min-w-16 items-center justify-center rounded-3xl bg-primary text-on-primary shadow-md">
          <Coffee className="size-8" strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-on-surface">Cafetería ITSH</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Pide anticipado y recoge sin filas</p>
        </div>
      </div>
      <Tarjeta className="p-5">
      <h2 className="mb-4 font-heading text-xl font-bold text-on-surface">Iniciar sesión</h2>
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
          <LogIn aria-hidden="true" className="size-4" />
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </Boton>
      </form>
      </Tarjeta>

      <p className="mt-4 text-center text-sm text-on-surface-variant">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-medium text-primary underline">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
