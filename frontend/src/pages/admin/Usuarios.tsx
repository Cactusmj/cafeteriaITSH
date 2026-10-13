import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, ErrorPeticion } from '../../lib/api'
import { usarSesion } from '../../lib/ContextoSesion'

type RolOperativo = 'cajero' | 'cocinero'

interface UsuarioOperativo {
  id: number
  nombre: string
  correo: string
  rol: RolOperativo
  activo: boolean
}

const claseCampo =
  'w-full rounded border border-slate-300 px-3 py-2 text-base focus:border-slate-900 focus:outline-none'
const claseBoton =
  'inline-flex min-h-11 items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60'
const claseBotonSecundario =
  'inline-flex min-h-11 items-center justify-center rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100'

/** Panel del administrador para gestionar cuentas operativas. */
export function Usuarios() {
  const { token } = usarSesion()
  const [usuarios, setUsuarios] = useState<UsuarioOperativo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<RolOperativo>('cajero')
  const [creando, setCreando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const datos = await api<{ usuarios: UsuarioOperativo[] }>('/api/admin/usuarios', { token })
      setUsuarios(datos.usuarios)
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo cargar la lista')
    } finally {
      setCargando(false)
    }
  }, [token])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function crear(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setCreando(true)
    try {
      await api('/api/admin/usuarios', {
        metodo: 'POST',
        token,
        cuerpo: { nombre, correo, password, rol },
      })
      setNombre('')
      setCorreo('')
      setPassword('')
      setRol('cajero')
      await cargar()
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo crear el usuario')
    } finally {
      setCreando(false)
    }
  }

  async function cambiarEstado(usuario: UsuarioOperativo) {
    setError(null)
    try {
      await api(`/api/admin/usuarios/${usuario.id}/estado`, {
        metodo: 'PATCH',
        token,
        cuerpo: { activo: !usuario.activo },
      })
      await cargar()
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo actualizar el estado')
    }
  }

  async function cambiarRol(usuario: UsuarioOperativo, nuevoRol: RolOperativo) {
    setError(null)
    try {
      await api(`/api/admin/usuarios/${usuario.id}`, {
        metodo: 'PUT',
        token,
        cuerpo: { rol: nuevoRol },
      })
      await cargar()
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo actualizar el rol')
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Gestión de usuarios</h1>

      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={crear}
        className="grid gap-3 rounded border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-medium text-slate-900">Nueva cuenta operativa</h2>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Nombre
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={claseCampo}
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
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Rol
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as RolOperativo)}
            className={claseCampo}
          >
            <option value="cajero">Cajero</option>
            <option value="cocinero">Cocinero</option>
          </select>
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={creando} className={claseBoton}>
            {creando ? 'Creando…' : 'Crear usuario'}
          </button>
        </div>
      </form>

      {cargando ? (
        <p className="text-slate-600">Cargando usuarios…</p>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{usuario.nombre}</td>
                  <td className="px-4 py-3">{usuario.correo}</td>
                  <td className="px-4 py-3">
                    <select
                      value={usuario.rol}
                      onChange={(e) => void cambiarRol(usuario, e.target.value as RolOperativo)}
                      className={claseCampo}
                      aria-label={`Rol de ${usuario.nombre}`}
                    >
                      <option value="cajero">Cajero</option>
                      <option value="cocinero">Cocinero</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {usuario.activo ? (
                      <span className="text-green-700">Activo</span>
                    ) : (
                      <span className="text-slate-500">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void cambiarEstado(usuario)}
                      className={claseBotonSecundario}
                    >
                      {usuario.activo ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No hay cuentas operativas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
