import type { TipoConsulta } from "@/types/api";

/**
 * El tipo de consulta se deduce del historial, sin preguntarlo: a la primera
 * atencion de un paciente le corresponde `Inicial`; a partir de ahi, cada
 * nueva cita es un `Seguimiento`.
 *
 * El backend sigue siendo la autoridad sobre el dato guardado; esto solo
 * evita que quien atiende tenga que elegir un tipo en plena consulta.
 */
export function deducirTipoConsulta(consultasPrevias: number): TipoConsulta {
  return consultasPrevias === 0 ? "Inicial" : "Seguimiento";
}
