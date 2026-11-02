import { normalizar } from "@/lib/formatters";
import type { HistorialClinico, Sexo, TiempoComida } from "@/types/api";

/* ---------- Perfil alimentario del paciente ---------- */

/** Lo que el expediente sabe de los gustos y alergias del paciente. */
export interface PerfilAlimentario {
  alergias: string[];
  favoritos: string[];
  noFavoritos: string[];
}

export function perfilDesdeHistorial(historial: HistorialClinico | null | undefined): PerfilAlimentario | undefined {
  if (!historial) return undefined;
  const limpiar = (lista: string[]) => lista.map(normalizar).filter(Boolean);
  const perfil = {
    alergias: limpiar(historial.alergias),
    favoritos: limpiar(historial.alimentosFavoritos),
    noFavoritos: limpiar(historial.alimentosNoFavoritos),
  };
  const vacio = perfil.alergias.length + perfil.favoritos.length + perfil.noFavoritos.length === 0;
  return vacio ? undefined : perfil;
}

export interface EvaluacionPlato {
  alergenos: string[];
  noGusta: string[];
  gusta: string[];
}

/**
 * Cruza el nombre del plato y de sus ingredientes con el perfil. Es una
 * coincidencia de texto ("maní" encuentra "Crema de maní"), no un registro
 * de alergenos: sirve de aviso, la decision la toma el nutricionista.
 */
export function evaluarPlato(
  plato: { nombre: string; detalles: { alimentoNombre: string }[] },
  perfil?: PerfilAlimentario,
): EvaluacionPlato {
  if (!perfil) return { alergenos: [], noGusta: [], gusta: [] };
  const textos = [plato.nombre, ...plato.detalles.map((d) => d.alimentoNombre)].map(normalizar);
  const presentes = (lista: string[]) => lista.filter((termino) => textos.some((t) => t.includes(termino)));
  return {
    alergenos: presentes(perfil.alergias),
    noGusta: presentes(perfil.noFavoritos),
    gusta: presentes(perfil.favoritos),
  };
}

/* ---------- Presupuesto calorico por tiempo de comida ---------- */

/**
 * Reparto habitual de la energia diaria. La colacion queda fuera: es un
 * extra que no tiene presupuesto propio.
 */
export const REPARTO_TIEMPO: Record<TiempoComida, number> = {
  Desayuno: 0.25,
  MediaManana: 0.1,
  Almuerzo: 0.35,
  Merienda: 0.1,
  Cena: 0.2,
  Colacion: 0,
};

export function objetivoDelTiempo(objetivoDiario: number | null | undefined, tiempo: TiempoComida): number | null {
  if (!objetivoDiario || REPARTO_TIEMPO[tiempo] === 0) return null;
  return objetivoDiario * REPARTO_TIEMPO[tiempo];
}

/** Un plato "encaja" si no se pasa mas de un 25 % de lo que falta en esa comida. */
export function encaja(calorias: number, presupuesto: number | null): boolean {
  return presupuesto !== null && presupuesto > 0 && calorias <= presupuesto * 1.25;
}

/* ---------- Requerimiento energetico estimado ---------- */

/**
 * Gasto energetico diario estimado con Mifflin-St Jeor y un factor de
 * actividad ligera (1.375). Es una referencia para elegir plantilla, no una
 * prescripcion: el objetivo final lo fija el nutricionista.
 */
export function estimarRequerimiento({
  sexo,
  edad,
  peso,
  estatura,
}: {
  sexo: Sexo | null | undefined;
  edad: number | null | undefined;
  peso: number | null | undefined;
  estatura: number | null | undefined;
}): number | null {
  if (!edad || !peso || !estatura) return null;
  const base = 10 * peso + 6.25 * estatura - 5 * edad;
  /* Sin sexo binario registrado se usa el punto medio de las dos formulas. */
  const ajuste = sexo === "M" ? 5 : sexo === "F" ? -161 : -78;
  const total = (base + ajuste) * 1.375;
  return Math.round(total / 50) * 50;
}
