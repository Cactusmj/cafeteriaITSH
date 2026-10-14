import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campo'
import { EstadoVacio } from '../../components/ui/EstadoVacio'
import { Tarjeta } from '../../components/ui/Tarjeta'
import { api, ErrorPeticion } from '../../lib/api'
import { useSesion } from '../../lib/useSesion'

type RolOperativo = 'cajero' | 'cocinero'

interface UsuarioOperativo {
  id: number
  nombre: string
  correo: string
  rol: RolOperativo
  activo: boolean
}

/** Panel del administrador para gestionar cuentas operativas. */
export function Usuarios() {
  const { token } = useSesion()
  const [usuarios, setUsuarios] = useState<UsuarioOperativo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<RolOperativo>('cajero')
  const [creando, setCreando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const datos = await api<{ usuarios: UsuarioOperativo[] }>('/api/admin/usuarios', { token })
      setError(null)
      setUsuarios(datos.usuarios)
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo cargar la lista')
    } finally {
      setCargando(false)
    }
  }, [token])

  const refrescar = useCallback(() => {
    setCargando(true)
    return cargar()
  }, [cargar])

  useEffect(() => {
    void Promise.resolve().then(cargar)
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
      await refrescar()
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
      await refrescar()
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
      await refrescar()
    } catch (err) {
      setError(err instanceof ErrorPeticion ? err.mensaje : 'No se pudo actualizar el rol')
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-on-surface">Gestión de usuarios</h1>

      {error && (
        <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
          {error}
        </p>
      )}

      <Tarjeta className="p-4">
        <form onSubmit={crear} className="grid gap-3 sm:grid-cols-2">
          <h2 className="font-heading text-lg font-bold text-on-surface sm:col-span-2">Nueva cuenta operativa</h2>
          <Campo etiqueta="Nombre" type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Campo etiqueta="Correo" type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
          <Campo etiqueta="Contraseña" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <label className="flex flex-col gap-1 text-sm font-medium text-on-surface-variant">
            <span>Rol</span>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as RolOperativo)}
              className="min-h-11 w-full rounded-lg border border-outline bg-surface-container-lowest px-3 py-2 text-base text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="cajero">Cajero</option>
              <option value="cocinero">Cocinero</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <Boton type="submit" disabled={creando}>
              {creando ? 'Creando…' : 'Crear usuario'}
            </Boton>
          </div>
        </form>
      </Tarjeta>

      {cargando ? (
        <p className="text-on-surface-variant">Cargando usuarios…</p>
      ) : usuarios.length === 0 ? (
        <EstadoVacio
          titulo="Aún no hay usuarios operativos"
          descripcion="Crea la primera cuenta con el formulario."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-container text-on-surface-variant">
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
                <tr key={usuario.id} className="border-t border-outline-variant">
                  <td className="px-4 py-4 font-medium text-on-surface">{usuario.nombre}</td>
                  <td className="px-4 py-4 text-on-surface">{usuario.correo}</td>
                  <td className="px-4 py-4">
                    <select
                      value={usuario.rol}
                      onChange={(e) => void cambiarRol(usuario, e.target.value as RolOperativo)}
                      className="min-h-11 rounded-lg border border-outline bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`Rol de ${usuario.nombre}`}
                    >
                      <option value="cajero">Cajero</option>
                      <option value="cocinero">Cocinero</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    {usuario.activo ? (
                      <span className="font-medium text-primary">Activo</span>
                    ) : (
                      <span className="text-on-surface-variant">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Boton
                      variante="secundario"
                      onClick={() => void cambiarEstado(usuario)}
                    >
                      {usuario.activo ? 'Deshabilitar' : 'Habilitar'}
                    </Boton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
