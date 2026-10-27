import type { TipoConsulta } from "@/types/api";

/** Etiqueta legible de cada tipo de consulta, en tildes. */
export const ETIQUETA_TIPO_CONSULTA: Record<TipoConsulta, string> = {
  Inicial: "Inicial",
  Seguimiento: "Seguimiento",
  Ajuste: "Ajuste",
  Cierre: "Cierre",
};

/**
 * Pastilla suave por tipo, en la misma clave visual que los estados de cita:
 * fondo tenue y texto oscuro del mismo tono.
 */
export const ESTILO_TIPO_CONSULTA: Record<TipoConsulta, string> = {
  Inicial: "bg-info-soft text-info-soft-foreground",
  Seguimiento: "bg-primary-soft text-primary-soft-foreground",
  Ajuste: "bg-warning-soft text-warning-soft-foreground",
  Cierre: "bg-muted text-muted-foreground",
};
