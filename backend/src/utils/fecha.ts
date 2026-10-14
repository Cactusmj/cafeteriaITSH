const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

/** Devuelve la fecha del servidor en formato `YYYY-MM-DD`. */
export function hoyISO(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(ahora.getDate())}`;
}

/** Valida que la cadena tenga formato `YYYY-MM-DD` y sea una fecha real. */
export function esFechaISO(valor: string): boolean {
  if (!FORMATO_FECHA.test(valor)) {
    return false;
  }
  const [anio, mes, dia] = valor.split('-').map(Number) as [number, number, number];
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
}

const FORMATO_FECHA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

/** Minutos de anticipación mínima entre confirmación y recolección (constitución, Principio IV). */
export const MINUTOS_ANTICIPACION = 10;

/** Valida que la cadena tenga formato `YYYY-MM-DDTHH:mm` (o con segundos) y sea real. */
export function esFechaHoraISO(valor: string): boolean {
  if (!FORMATO_FECHA_HORA.test(valor)) {
    return false;
  }
  const [fechaParte, horaParte] = valor.split('T') as [string, string];
  if (!esFechaISO(fechaParte)) {
    return false;
  }
  const [horas, minutos] = horaParte.split(':').map(Number) as [number, number];
  return horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59;
}

/** Convierte `YYYY-MM-DDTHH:mm[:ss]` a Date (hora local del servidor). */
export function aFecha(valor: string): Date {
  const [fechaParte, horaParte] = valor.split('T') as [string, string];
  const [anio, mes, dia] = fechaParte.split('-').map(Number) as [number, number, number];
  const [horas = 0, minutos = 0, segundos = 0] = horaParte.split(':').map(Number);
  return new Date(anio, mes - 1, dia, horas, minutos, segundos);
}

/** Devuelve `true` si la recolección es anterior al mínimo de anticipación. */
export function anticipacionInsuficiente(
  fechaRecoleccionISO: string,
  ahora: Date = new Date(),
): boolean {
  const recoleccion = aFecha(fechaRecoleccionISO);
  const limite = new Date(ahora.getTime() + MINUTOS_ANTICIPACION * 60_000);
  return recoleccion.getTime() < limite.getTime();
}
