import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorPeticion } from '../../lib/api'
import { usarSesion } from '../../lib/ContextoSesion'
import { INICIO_POR_ROL } from '../../lib/sesion'

const claseCampo =
  'w-full rounded border border-slate-300 px-3 py-2 text-base focus:border-slate-900 focus:outline-none'
const claseBoton =
  'inline-flex min-h-11 w-full items-center justify-center rounded bg-slate-900 px-4 py-2 text-base font-medium text-white hover:bg-slate-700 disabled:opacity-60'

/** Pantalla de registro de clientes. */
export function Registro() {
  const { registrar } = usarSesion()
  const navegar = useNavigate()
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const usuario = await registrar({ nombre, correo, password })
      navegar(INICIO_POR_ROL[usuario.rol], { replace: true })
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo completar el registro')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Crear cuenta</h1>
      <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Nombre
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={claseCampo}
            autoComplete="name"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Correo
          <input
            type="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className={claseCampo}
            autoComplete="email"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Contraseña
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={claseCampo}
            autoComplete="new-password"
          />
        </label>

        {error && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={enviando} className={claseBoton}>
          {enviando ? 'Creando…' : 'Registrarme'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-slate-900 underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
