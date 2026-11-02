import type { Macros } from "@/features/menus/lib/menus";
import type { Guid, Plato } from "@/types/api";

/**
 * Variantes de plato por paciente.
 *
 * Cada comida del plan apunta a un plato del catalogo y los ingredientes
 * viven en el plato, asi que editarlo cambiaria el plato para todos. Para
 * ajustar un plato solo en el plan de un paciente se crea una copia
 * ("variante") con los cambios y la comida apunta a ella; el original no se
 * toca. El backend no tiene un campo para esto, asi que la variante se marca
 * en la descripcion con un prefijo fijo y el nombre del paciente.
 */
const MARCA = "Variante del plan de ";

export function descripcionVariante(pacienteNombre: string): string {
  return `${MARCA}${pacienteNombre}`;
}

export function esVariante(plato: Pick<Plato, "descripcion">): boolean {
  return plato.descripcion?.startsWith(MARCA) ?? false;
}

export function esVarianteDe(plato: Pick<Plato, "descripcion">, pacienteNombre: string): boolean {
  return plato.descripcion === descripcionVariante(pacienteNombre);
}

/** Platos que se ofrecen al armar: el catalogo general mas, en un plan, las variantes de ese paciente. */
export function platosParaElegir(platos: Plato[], pacienteNombre?: string): Plato[] {
  return platos.filter((p) => !esVariante(p) || (pacienteNombre !== undefined && esVarianteDe(p, pacienteNombre)));
}

function primerNombre(pacienteNombre: string): string {
  return pacienteNombre.trim().split(/\s+/)[0] ?? pacienteNombre;
}

export function nombreVariante(nombreBase: string, pacienteNombre: string): string {
  return `${nombreBase} (${primerNombre(pacienteNombre)})`;
}

/** "Pollo con arroz (Ana)" -> "Pollo con arroz", si la variante era de Ana. */
export function nombreBaseDeVariante(nombre: string, pacienteNombre: string): string {
  const sufijo = ` (${primerNombre(pacienteNombre)})`;
  return nombre.endsWith(sufijo) ? nombre.slice(0, -sufijo.length) : nombre;
}

export interface IngredienteVariante {
  alimentoId: Guid;
  alimentoNombre: string;
  racionGramos: number;
}

/** Ajuste pendiente de guardar sobre una o varias comidas del plan. */
export interface VarianteLinea {
  /** Agrupa las comidas que comparten el mismo ajuste: se crea un solo plato. */
  clave: string;
  nombre: string;
  platoBaseId: Guid;
  /** Si el plato ya era variante de este paciente, se actualiza en lugar de crear otro. */
  platoVarianteId?: Guid;
  ingredientes: IngredienteVariante[];
  /** Por porcion, calculadas con los alimentos del catalogo. */
  macros: Macros;
}
