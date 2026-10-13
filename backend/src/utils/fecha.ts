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
