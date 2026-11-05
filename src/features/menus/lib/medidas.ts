import type { DetallePlato, MedidaCasera } from "@/types/api";

/**
 * Racion de un ingrediente tal como se captura. Los gramos mandan (de ellos
 * salen calorias y macros); la medida casera es una forma opcional de escribirla.
 * Sin `medida`, la fila se capturo en gramos.
 */
export interface Racion {
  gramos: number | undefined;
  medida: string | null;
  cantidad: number | undefined;
  /** Peso de una unidad de la medida. */
  gramosUnidad: number | undefined;
}

export type OpcionMedida = Pick<MedidaCasera, "nombre" | "gramos">;

export const MEDIDAS_SUGERIDAS = ["pieza", "rebanada", "taza", "cucharada", "cucharadita"];

const redondear = (valor: number) => Math.round(valor * 100) / 100;

export function racionEnGramos(gramos: number | undefined): Racion {
  return { gramos, medida: null, cantidad: undefined, gramosUnidad: undefined };
}

export function racionDeDetalle(
  detalle: Pick<DetallePlato, "racionGramos" | "medidaCantidad" | "medidaNombre">,
): Racion {
  const { racionGramos, medidaCantidad, medidaNombre } = detalle;
  if (!medidaNombre || !medidaCantidad) return racionEnGramos(racionGramos);
  return {
    gramos: racionGramos,
    medida: medidaNombre,
    cantidad: medidaCantidad,
    gramosUnidad: racionGramos / medidaCantidad,
  };
}

/**
 * Medidas que ofrece el selector. Si la fila usa una que el alimento ya no
 * tiene (se edito el catalogo), se conserva: el plato guarda su propia copia.
 */
export function opcionesDeMedida(medidas: OpcionMedida[] | undefined, racion: Racion): OpcionMedida[] {
  const lista = medidas ?? [];
  if (!racion.medida || !racion.gramosUnidad) return lista;
  if (lista.some((m) => m.nombre === racion.medida)) return lista;
  return [...lista, { nombre: racion.medida, gramos: redondear(racion.gramosUnidad) }];
}

/** Al pasar a una medida se conserva la cantidad parecida, en cuartos: 100 g de huevo son 2 piezas. */
export function cambiarAMedida(racion: Racion, opcion: OpcionMedida): Racion {
  const cuartos = racion.gramos ? Math.round((racion.gramos / opcion.gramos) * 4) / 4 : 0;
  const cantidad = cuartos > 0 ? cuartos : 1;
  return {
    gramos: redondear(cantidad * opcion.gramos),
    medida: opcion.nombre,
    cantidad,
    gramosUnidad: opcion.gramos,
  };
}

export function cambiarCantidad(racion: Racion, cantidad: number | undefined): Racion {
  return {
    ...racion,
    cantidad,
    gramos: cantidad !== undefined && racion.gramosUnidad ? redondear(cantidad * racion.gramosUnidad) : undefined,
  };
}

/** Campos de la racion para enviar al backend. */
export function camposDeMedida(racion: Racion) {
  return racion.medida && racion.cantidad
    ? { medidaCantidad: racion.cantidad, medidaNombre: racion.medida }
    : { medidaCantidad: null, medidaNombre: null };
}
