import { formatearCalendario, formatearInstante } from "@/lib/zona-horaria";
import type { Sexo } from "@/types/api";

const FECHA_NUMERICA: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };

/**
 * dd/mm/aaaa. Acepta las dos clases de fecha: una de calendario
 * ("2026-10-27", se muestra tal cual) o un instante ("…T03:16Z", se muestra
 * el dia que era en Mexico; antes se recortaba el texto UTC y una hora de la
 * noche salia con el dia siguiente).
 */
export function formatearFechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  return fecha.length <= 10
    ? formatearCalendario(fecha, FECHA_NUMERICA)
    : formatearInstante(fecha, FECHA_NUMERICA);
}

/** La API guarda la estatura en centimetros y por eso el IMC sale de dividir entre 100. */
export function formatearEstatura(centimetros: number | null | undefined): string {
  if (centimetros === null || centimetros === undefined) return "—";
  return `${(centimetros / 100).toFixed(2)} m`;
}

/** Instante -> dd/mm/aaaa en hora de Mexico (antes se mostraba en UTC). */
export function formatearFecha(iso: string | null | undefined): string {
  return formatearInstante(iso, FECHA_NUMERICA);
}

/** Instante -> dd/mm/aaaa, hh:mm en hora de Mexico (antes, en UTC: 6 h de mas). */
export function formatearFechaHora(iso: string | null | undefined): string {
  return formatearInstante(iso, { ...FECHA_NUMERICA, hour: "2-digit", minute: "2-digit" });
}

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

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return (partes[0]?.slice(0, 2) ?? "?").toUpperCase();

  const nombrePropio = partes[0]?.[0] ?? "";
  const apellido = partes[partes.length - 1]?.[0] ?? "";
  return (nombrePropio + apellido).toUpperCase();
}

export const ETIQUETA_SEXO: Record<Sexo, string> = {
  M: "Masculino",
  F: "Femenino",
  Otro: "Otro",
};

export function etiquetaSexo(sexo: Sexo | null | undefined): string {
  if (!sexo) return "—";
  return ETIQUETA_SEXO[sexo] ?? sexo;
}

/** La API guarda la estatura en centimetros y por eso el IMC sale de dividir entre 100. */
export function calcularImc(
  peso: number,
  centimetros: number,
): number | null {
  if (!centimetros || centimetros <= 0) return null;
  return peso / Math.pow(centimetros / 100, 2);
}

export function categoriaImc(imc: number): {
  etiqueta: string;
  tono: "success" | "info" | "warning" | "destructive";
} {
  if (imc < 18.5) return { etiqueta: "Bajo peso", tono: "info" };
  if (imc < 25) return { etiqueta: "Peso normal", tono: "success" };
  if (imc < 30) return { etiqueta: "Sobrepeso", tono: "warning" };
  return { etiqueta: "Obesidad", tono: "destructive" };
}

export function tonoDesdeId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 6;
}
