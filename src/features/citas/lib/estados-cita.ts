import type { EstadoCita } from "@/types/api";

export const ETIQUETA_ESTADO_CITA: Record<EstadoCita, string> = {
  Programada: "Programada",
  Confirmada: "Confirmada",
  EnCurso: "En curso",
  Completada: "Completada",
  Cancelada: "Cancelada",
  NoAsistio: "No asistio",
};

/** Colores sobre variante outline: el estado se lee de un vistazo en la tabla. */
export const ESTILO_ESTADO_CITA: Record<EstadoCita, string> = {
  Programada: "border-info/40 text-info",
  Confirmada: "border-primary/40 text-primary",
  EnCurso: "border-warning/40 text-warning",
  Completada: "border-success/40 text-success",
  Cancelada: "border-destructive/40 text-destructive",
  NoAsistio: "border-border text-muted-foreground",
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
  EnCurso: "Iniciar atencion",
  Completada: "Marcar completada",
  Cancelada: "Cancelar cita",
  NoAsistio: "Marcar que no asistio",
};

/** Cancelada y NoAsistio cierran caminos: se pintan como destructivas. */
const ACCIONES_DESTRUCTIVAS: ReadonlySet<EstadoCita> = new Set([
  "Cancelada",
  "NoAsistio",
]);

export function esAccionDestructiva(estado: EstadoCita): boolean {
  return ACCIONES_DESTRUCTIVAS.has(estado);
}
