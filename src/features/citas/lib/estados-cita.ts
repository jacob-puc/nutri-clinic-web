import type { Cita, EstadoCita } from "@/types/api";

/** Sigue pendiente de atender. La hora no basta: una consulta puede cerrarse antes de su fin. */
export function estaPorAtender(cita: Pick<Cita, "estado">): boolean {
  return cita.estado === "Programada" || cita.estado === "Confirmada";
}

export const ETIQUETA_ESTADO_CITA: Record<EstadoCita, string> = {
  Programada: "Programada",
  Confirmada: "Confirmada",
  EnCurso: "En curso",
  Completada: "Completada",
  Cancelada: "Cancelada",
  NoAsistio: "No asistió",
};

/** Pastilla suave por estado: fondo tenue y texto oscuro del mismo tono. */
export const ESTILO_ESTADO_CITA: Record<EstadoCita, string> = {
  Programada: "bg-info-soft text-info-soft-foreground",
  Confirmada: "bg-primary-soft text-primary-soft-foreground",
  EnCurso: "bg-warning-soft text-warning-soft-foreground",
  Completada: "bg-success-soft text-success-soft-foreground",
  Cancelada: "bg-destructive-soft text-destructive-soft-foreground",
  NoAsistio: "bg-muted text-muted-foreground",
};

/** Color pleno del estado: punto del badge, nodo de la linea del dia y
    segmento de la barra de resumen. Siempre acompaña a la etiqueta. */
export const COLOR_ESTADO_CITA: Record<EstadoCita, string> = {
  Programada: "bg-info",
  Confirmada: "bg-primary",
  EnCurso: "bg-warning",
  Completada: "bg-success",
  Cancelada: "bg-destructive",
  NoAsistio: "bg-muted-foreground",
};

/** Espejo de `TransicionesPermitidas` en CitaService: el backend es la autoridad. */
export const TRANSICIONES_CITA: Record<EstadoCita, EstadoCita[]> = {
  Programada: ["Confirmada", "Cancelada", "NoAsistio"],
  Confirmada: ["EnCurso", "Cancelada", "NoAsistio"],
  EnCurso: ["Cancelada", "NoAsistio"],
  Completada: [],
  Cancelada: [],
  NoAsistio: ["Programada"],
};

/** Accion que ejecuta cada transicion, tal como la veria quien agenda la cita. */
export const ETIQUETA_ACCION_CITA: Record<EstadoCita, string> = {
  Programada: "Reabrir como programada",
  Confirmada: "Confirmar cita",
  EnCurso: "Iniciar atención",
  Completada: "Marcar completada",
  Cancelada: "Cancelar cita",
  NoAsistio: "Marcar que no asistió",
};

/** Cancelada y NoAsistio cierran caminos: se pintan como destructivas. */
const ACCIONES_DESTRUCTIVAS: ReadonlySet<EstadoCita> = new Set([
  "Cancelada",
  "NoAsistio",
]);

export function esAccionDestructiva(estado: EstadoCita): boolean {
  return ACCIONES_DESTRUCTIVAS.has(estado);
}
