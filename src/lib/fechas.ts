/** Fechas "planas" (anio-mes-dia) sin zona horaria: siempre hora local. */

export function dosDigitos(valor: number): string {
  return String(valor).padStart(2, "0");
}

/** "2026-10-14" -> Date a medianoche local, sin correr un dia por la zona UTC. */
export function fechaDeDateOnly(valor: string | null | undefined): Date | undefined {
  if (!valor) return undefined;
  const [anio, mes, dia] = valor.split("-").map(Number);
  if (!anio || !mes || !dia) return undefined;
  const fecha = new Date(anio, mes - 1, dia);
  return Number.isNaN(fecha.getTime()) ? undefined : fecha;
}

/** Date -> "2026-10-14" en hora local. */
export function dateOnlyDe(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

/** Cualquier instante -> Date a medianoche local de su dia. */
export function soloFecha(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}
