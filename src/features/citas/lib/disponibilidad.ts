import { aValorLocal, horaDe, HORAS_AGENDA } from "@/features/citas/lib/fechas-cita";
import type { Cita, EstadoCita, Guid } from "@/types/api";
import { minutoActualEnClinica } from "@/lib/zona-horaria";

/** Espejo de `estadosBloqueantes` en `CitaService.ValidarDisponibilidadAgendaAsync`. */
const ESTADOS_BLOQUEANTES: ReadonlySet<EstadoCita> = new Set<EstadoCita>([
  "Programada",
  "Confirmada",
  "EnCurso",
]);

export interface Ocupacion {
  citaId: Guid;
  /** Minutos desde las 00:00, hora local. */
  inicio: number;
  fin: number;
  horaInicio: string;
  horaFin: string;
  /** A quien bloquea: el backend valida a los dos por separado. */
  motivo: "nutricionista" | "paciente" | "ambos";
  pacienteNombre: string;
  nutricionistaNombre: string;
}

export function minutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Citas del dia que chocarian con la que se esta agendando, con la misma
 * regla del backend: estados que bloquean, mismo nutricionista o mismo
 * paciente, y sin contar la cita que se edita.
 */
export function ocupacionesDelDia(
  citas: Cita[],
  {
    nutricionistaId,
    pacienteId,
    citaExcluidaId,
  }: { nutricionistaId?: Guid; pacienteId?: Guid; citaExcluidaId?: Guid },
): Ocupacion[] {
  return citas
    .filter((c) => ESTADOS_BLOQUEANTES.has(c.estado) && c.id !== citaExcluidaId)
    .flatMap((c) => {
      const delNutricionista = Boolean(nutricionistaId) && c.nutricionistaId === nutricionistaId;
      const delPaciente = Boolean(pacienteId) && c.pacienteId === pacienteId;
      if (!delNutricionista && !delPaciente) return [];
      const horaInicio = horaDe(aValorLocal(c.fechaInicio));
      const horaFin = horaDe(aValorLocal(c.fechaFin));
      return [
        {
          citaId: c.id,
          inicio: minutos(horaInicio),
          fin: minutos(horaFin),
          horaInicio,
          horaFin,
          motivo: delNutricionista && delPaciente ? "ambos" : delNutricionista ? "nutricionista" : "paciente",
          pacienteNombre: c.pacienteNombre,
          nutricionistaNombre: c.nutricionistaNombre,
        } satisfies Ocupacion,
      ];
    })
    .sort((a, b) => a.inicio - b.inicio);
}

/** Mismo criterio de solape del backend: inicio < finOtra && otraInicio < fin. */
export function choca(inicio: number, fin: number, ocupaciones: Ocupacion[]): Ocupacion | undefined {
  return ocupaciones.find((o) => o.inicio < fin && inicio < o.fin);
}

export function describirOcupacion(o: Ocupacion): string {
  if (o.motivo === "paciente") return `El paciente ya tiene cita de ${o.horaInicio} a ${o.horaFin}`;
  if (o.motivo === "ambos") return `Ya existe esta cita de ${o.horaInicio} a ${o.horaFin}`;
  return `${o.nutricionistaNombre} atiende a ${o.pacienteNombre} de ${o.horaInicio} a ${o.horaFin}`;
}

/**
 * Horas de inicio que chocarian con otra cita usando la duracion elegida,
 * con el motivo para mostrarlo en el selector. Las horas que ya pasaron no
 * entran aqui: el dialogo ni siquiera las ofrece.
 */
export function horasNoDisponibles(
  horas: string[],
  ocupaciones: Ocupacion[],
  duracion: number,
): Map<string, string> {
  const fuera = new Map<string, string>();
  for (const hora of horas) {
    const inicio = minutos(hora);
    const conflicto = choca(inicio, inicio + duracion, ocupaciones);
    if (conflicto) fuera.set(hora, conflicto.motivo === "paciente" ? "Paciente ocupado" : "Ocupado");
  }
  return fuera;
}

/** Horas de fin que dejarian la cita encima de otra. */
export function finesNoDisponibles(
  horas: string[],
  horaInicio: string,
  ocupaciones: Ocupacion[],
): Map<string, string> {
  const fuera = new Map<string, string>();
  const inicio = minutos(horaInicio);
  for (const hora of horas) {
    const conflicto = choca(inicio, minutos(hora), ocupaciones);
    if (conflicto) fuera.set(hora, conflicto.motivo === "paciente" ? "Paciente ocupado" : "Ocupado");
  }
  return fuera;
}

/** Primeros huecos libres del dia para la duracion dada. */
export function huecosLibres(
  horas: string[],
  noDisponibles: Map<string, string>,
  duracion: number,
  limite = 8,
): string[] {
  const ultimoInicio = minutos(HORAS_AGENDA[HORAS_AGENDA.length - 1]!) - duracion;
  return horas.filter(
    (hora) => !noDisponibles.has(hora) && minutos(hora) <= ultimoInicio && minutos(hora) % 30 === 0,
  ).slice(0, limite);
}

/** Minuto actual de la clinica redondeado al siguiente cuarto de hora (para "hoy"). */
export function proximoCuarto(): number {
  return Math.ceil((minutoActualEnClinica() + 1) / 15) * 15;
}
