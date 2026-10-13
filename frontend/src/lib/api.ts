const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface ErrorApi {
  codigo: string
  mensaje: string
}

/** Error con el código HTTP y el código de negocio devuelto por la API. */
export class ErrorPeticion extends Error {
  readonly estado: number
  readonly codigo: string
  readonly mensaje: string

  constructor(estado: number, codigo: string, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorPeticion'
    this.estado = estado
    this.codigo = codigo
    this.mensaje = mensaje
  }
}

interface OpcionesPeticion {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  cuerpo?: unknown
  token?: string | null
}

/** Realiza una petición a la API y devuelve el cuerpo tipado. */
export async function api<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, token } = opciones
  const cabeceras: Record<string, string> = {}

  if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json'
  }
  if (token) {
    cabeceras.Authorization = `Bearer ${token}`
  }

  const respuesta = await fetch(`${BASE_URL}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  })

  if (respuesta.status === 204) {
    return undefined as T
  }

  const datos = (await respuesta.json().catch(() => null)) as { error?: ErrorApi } | null

  if (!respuesta.ok) {
    const error = datos?.error
    throw new ErrorPeticion(
      respuesta.status,
      error?.codigo ?? 'ERROR_DESCONOCIDO',
      error?.mensaje ?? 'Ocurrió un error inesperado',
    )
  }

  return datos as T
}
