import type { Sexo } from "@/types/api";

export function formatearFechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return "—";

  // Sin recortar, el dia se lleva la hora: 26/09/26T03:24:17.18278Z.
  const [anio, mes, dia] = fecha.slice(0, 10).split("-");
  if (!anio || !mes || !dia) return "—";

  return `${dia}/${mes}/${anio}`;
}

/** La API guarda la estatura en centimetros y por eso el IMC sale de dividir entre 100. */
export function formatearEstatura(centimetros: number | null | undefined): string {
  if (centimetros === null || centimetros === undefined) return "—";
  return `${(centimetros / 100).toFixed(2)} m`;
}

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
