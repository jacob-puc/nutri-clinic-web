import type { MedidaAntropometrica } from "@/types/api";

export type ClaveCapturable =
  | "peso"
  | "estatura"
  | "porcentajeGrasa"
  | "porcentajeMasaMuscular"
  | "medidaCintura"
  | "medidaCadera";

export type ClaveMetrica = ClaveCapturable | "imc";

export interface Metrica {
  clave: ClaveMetrica;
  etiqueta: string;
  unidad: string;
}

/* Rangos espejo de CrearMedidaValidator, para avisar antes de enviar. */
export const CAPTURABLES: (Metrica & { clave: ClaveCapturable; min: number; max: number; paso: string })[] = [
  { clave: "peso", etiqueta: "Peso", unidad: "kg", min: 0.1, max: 399, paso: "0.1" },
  { clave: "estatura", etiqueta: "Estatura", unidad: "cm", min: 30, max: 299, paso: "0.5" },
  { clave: "porcentajeGrasa", etiqueta: "Grasa corporal", unidad: "%", min: 0, max: 100, paso: "0.1" },
  { clave: "porcentajeMasaMuscular", etiqueta: "Masa muscular", unidad: "%", min: 0, max: 100, paso: "0.1" },
  { clave: "medidaCintura", etiqueta: "Cintura", unidad: "cm", min: 1, max: 300, paso: "0.5" },
  { clave: "medidaCadera", etiqueta: "Cadera", unidad: "cm", min: 1, max: 300, paso: "0.5" },
];

/** Orden en que se pintan las tarjetas: el IMC va junto al peso. */
export const METRICAS_VISIBLES: Metrica[] = [
  { clave: "peso", etiqueta: "Peso", unidad: "kg" },
  { clave: "imc", etiqueta: "IMC", unidad: "" },
  { clave: "porcentajeGrasa", etiqueta: "Grasa", unidad: "%" },
  { clave: "porcentajeMasaMuscular", etiqueta: "Músculo", unidad: "%" },
  { clave: "medidaCintura", etiqueta: "Cintura", unidad: "cm" },
  { clave: "medidaCadera", etiqueta: "Cadera", unidad: "cm" },
];

const formato = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 });

export function formatearMetrica(valor: number): string {
  return formato.format(valor);
}

export function valorDe(medida: MedidaAntropometrica | undefined, clave: ClaveMetrica): number | null {
  const valor = medida?.[clave];
  return valor === null || valor === undefined ? null : valor;
}
