import type {
  DetalleSemanal,
  DetalleSemanalDto,
  DiaSemana,
  Guid,
  MenuAsignadoEstado,
  TiempoComida,
} from "@/types/api";
import type { VarianteLinea } from "@/features/menus/lib/variantes";

export const DIAS_SEMANA: DiaSemana[] = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

/* El enum del backend va sin tildes; la interfaz no. */
export const ETIQUETA_DIA: Record<DiaSemana, string> = {
  Lunes: "Lunes",
  Martes: "Martes",
  Miercoles: "Miércoles",
  Jueves: "Jueves",
  Viernes: "Viernes",
  Sabado: "Sábado",
  Domingo: "Domingo",
};

export const ETIQUETA_DIA_CORTA: Record<DiaSemana, string> = {
  Lunes: "Lun",
  Martes: "Mar",
  Miercoles: "Mié",
  Jueves: "Jue",
  Viernes: "Vie",
  Sabado: "Sáb",
  Domingo: "Dom",
};

/* Orden cronologico del dia: es el orden en que se pintan las comidas. */
export const TIEMPOS_COMIDA: TiempoComida[] = [
  "Desayuno",
  "MediaManana",
  "Almuerzo",
  "Merienda",
  "Cena",
  "Colacion",
];

export const ETIQUETA_TIEMPO: Record<TiempoComida, string> = {
  Desayuno: "Desayuno",
  MediaManana: "Media mañana",
  Almuerzo: "Almuerzo",
  Merienda: "Merienda",
  Cena: "Cena",
  Colacion: "Colación",
};

export const ESTADOS_PLAN: MenuAsignadoEstado[] = ["Borrador", "Activo", "Finalizado"];

export const DESCRIPCION_ESTADO: Record<MenuAsignadoEstado, string> = {
  Borrador: "Se puede ajustar todo, incluida la fecha de inicio.",
  Activo: "El paciente lo está siguiendo. No se puede eliminar.",
  Finalizado: "Queda de solo lectura; duplícalo para hacer cambios.",
};

/* Topes de los validadores del backend, para avisar antes de enviar. */
export const LIMITES = {
  objetivoCalorico: 10000,
  porciones: 20,
  racionGramos: 2000,
  caloriasPor100g: 900,
  gramosPor100g: 100,
} as const;

export interface Macros {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

export const MACROS_CERO: Macros = { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 };

export function sumarMacros(a: Macros, b: Macros, factor = 1): Macros {
  return {
    calorias: a.calorias + b.calorias * factor,
    proteinas: a.proteinas + b.proteinas * factor,
    carbohidratos: a.carbohidratos + b.carbohidratos * factor,
    grasas: a.grasas + b.grasas * factor,
  };
}

const formatoEntero = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
const formatoDecimal = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 });

export function formatearKcal(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return `${formatoEntero.format(valor)} kcal`;
}

export function formatearGramos(valor: number): string {
  return `${formatoDecimal.format(valor)} g`;
}

export function formatearNumero(valor: number): string {
  return formatoDecimal.format(valor);
}

/* ---------- Editor semanal ---------- */

/**
 * Una fila del editor semanal: un plato en un dia y tiempo de comida. La
 * `clave` es local (para las keys de React); `id` solo existe si la fila ya
 * estaba guardada, y se reenvia para que el backend la actualice en lugar
 * de borrarla y crearla otra vez.
 */
export interface LineaSemana {
  clave: string;
  id?: Guid;
  platoId: Guid;
  diaSemana: DiaSemana;
  tiempoComida: TiempoComida;
  cantidad: number;
  indicaciones: string;
  /** Ingredientes ajustados solo para este plan; se guarda como plato variante. */
  variante?: VarianteLinea;
}

let contadorClaves = 0;
export function nuevaClave(): string {
  contadorClaves += 1;
  return `linea-${contadorClaves}`;
}

export function lineasDesdeDetalles(detalles: DetalleSemanal[]): LineaSemana[] {
  return [...detalles]
    .sort((a, b) => a.orden - b.orden)
    .map((detalle) => ({
      clave: nuevaClave(),
      id: detalle.id,
      platoId: detalle.platoId,
      diaSemana: detalle.diaSemana,
      tiempoComida: detalle.tiempoComida,
      cantidad: detalle.cantidad,
      indicaciones: detalle.indicaciones ?? "",
    }));
}

/** El orden se numera dentro de cada celda (dia + tiempo de comida). */
export function lineasADetallesDto(lineas: LineaSemana[]): DetalleSemanalDto[] {
  const ordenPorCelda = new Map<string, number>();
  return lineas.map((linea) => {
    const celda = `${linea.diaSemana}-${linea.tiempoComida}`;
    const orden = ordenPorCelda.get(celda) ?? 0;
    ordenPorCelda.set(celda, orden + 1);
    return {
      id: linea.id ?? null,
      platoId: linea.platoId,
      diaSemana: linea.diaSemana,
      tiempoComida: linea.tiempoComida,
      cantidad: linea.cantidad,
      indicaciones: linea.indicaciones.trim() === "" ? null : linea.indicaciones.trim(),
      orden,
    };
  });
}

/** Lineas con porciones fuera de rango; bloquea el guardado antes de llamar al backend. */
export function hayPorcionesInvalidas(lineas: LineaSemana[]): boolean {
  return lineas.some((l) => !(l.cantidad > 0) || l.cantidad > LIMITES.porciones);
}

/** Calorias por dia, en el orden de `DIAS_SEMANA`. */
export function caloriasPorDia(detalles: DetalleSemanal[]): Record<DiaSemana, number> {
  const totales = Object.fromEntries(DIAS_SEMANA.map((dia) => [dia, 0])) as Record<
    DiaSemana,
    number
  >;
  for (const detalle of detalles) {
    totales[detalle.diaSemana] += detalle.calorias;
  }
  return totales;
}

/** Promedio diario sobre los dias que tienen al menos un plato. */
export function promedioDiario(detalles: DetalleSemanal[]): number | null {
  const porDia = caloriasPorDia(detalles);
  const conPlatos = DIAS_SEMANA.filter((dia) =>
    detalles.some((detalle) => detalle.diaSemana === dia),
  );
  if (conPlatos.length === 0) return null;
  return conPlatos.reduce((suma, dia) => suma + porDia[dia], 0) / conPlatos.length;
}
