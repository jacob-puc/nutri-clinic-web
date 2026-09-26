import type { Sexo } from "@/types/api";

/* -------------------------------------------------------------------------- */
/* Fechas                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Formatea un "YYYY-MM-DD" (C# DateOnly) sin pasar por `new Date(string)`.
 *
 * `new Date("1990-05-14")` se interpreta como UTC y en zonas horarias
 * negativas se muestra como el dia anterior. Se parsea a mano para que la
 * fecha de nacimiento siempre sea la que el usuario eligio.
 */
export function formatearFechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return "—";

  const [anio, mes, dia] = fecha.split("-");
  if (!anio || !mes || !dia) return "—";

  return `${dia}/${mes}/${anio}`;
}

/** Formatea un ISO-8601 UTC como dd/mm/aaaa. */
export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatearFechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/** "hace 3 dias", "en 2 horas". Caido en valor si la fecha no parsea. */
export function formatearTiempoRelativo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";

  const segundos = (fecha.getTime() - Date.now()) / 1000;
  const unidades: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  const formatter = new Intl.RelativeTimeFormat("es-MX", { numeric: "auto" });

  for (const [unidad, divisor] of unidades) {
    if (Math.abs(segundos) >= divisor) {
      return formatter.format(Math.round(segundos / divisor), unidad);
    }
  }
  return formatter.format(Math.round(segundos), "second");
}

/* -------------------------------------------------------------------------- */
/* Texto                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Quita acentos y pasa a minusculas para que la busqueda tolere
 * "jose" -> "Jose" y "Munoz" -> "munoz".
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
/**
 * Iniciales para el avatar. Con nombres compuestos toma la decision de usar
 * el primer nombre y el ULTIMO token como apellido, para que
 * "Maria de los Angeles Lopez" rinda "ML" y no "MA" como haria un
 * first+second ingenuo.
 */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return (partes[0]?.slice(0, 2) ?? "?").toUpperCase();

  const nombrePropio = partes[0]?.[0] ?? "";
  // "Maria de los Angeles Lopez" -> el ultimo token es el apellido real.
  const apellido = partes[partes.length - 1]?.[0] ?? "";
  return (nombrePropio + apellido).toUpperCase();
}

/* -------------------------------------------------------------------------- */
/* Dominio                                                                     */
/* -------------------------------------------------------------------------- */

export const ETIQUETA_SEXO: Record<Sexo, string> = {
  M: "Masculino",
  F: "Femenino",
  Otro: "Otro",
};

export function etiquetaSexo(sexo: Sexo | null | undefined): string {
  if (!sexo) return "—";
  return ETIQUETA_SEXO[sexo] ?? sexo;
}

/** IMC: OMS pondera por rango. El backend lo calcula, esto solo etiqueta. */
export function categoriaImc(imc: number): {
  etiqueta: string;
  tono: "success" | "info" | "warning" | "destructive";
} {
  if (imc < 18.5) return { etiqueta: "Bajo peso", tono: "info" };
  if (imc < 25) return { etiqueta: "Peso normal", tono: "success" };
  if (imc < 30) return { etiqueta: "Sobrepeso", tono: "warning" };
  return { etiqueta: "Obesidad", tono: "destructive" };
}

/**
 * Color de avatar estable derivado del id. El mismo paciente conserva su
 * color entre recargas, lo que ayuda a reconocerlo en una lista larga.
 */
export function tonoDesdeId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 6;
}
