import { formatearCalendario } from "@/lib/zona-horaria";
import type { Ausencia, BloqueHorario, DiaSemana, Guid, Horarios } from "@/types/api";

export const DIAS: DiaSemana[] = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
export const DIAS_HABILES: DiaSemana[] = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

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

/** Indice de FullCalendar / Date#getDay (0 = domingo). */
export const INDICE_DIA: Record<DiaSemana, number> = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sabado: 6,
};

export function minutosDeHora(hora: string): number {
  const [h = 0, m = 0] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** Dia de la semana de una fecha de calendario "YYYY-MM-DD". */
export function diaDeClave(clave: string): DiaSemana {
  const [a = 1970, m = 1, d = 1] = clave.slice(0, 10).split("-").map(Number);
  const indice = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return DIAS[(indice + 6) % 7]!;
}

export function bloquesDelDia(bloques: BloqueHorario[], dia: DiaSemana): BloqueHorario[] {
  return bloques.filter((b) => b.diaSemana === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
}

export function textoBloques(bloques: BloqueHorario[]): string {
  return bloques.map((b) => `${b.horaInicio}–${b.horaFin}`).join(", ");
}

/**
 * Resumen corto de la semana, juntando dias seguidos con el mismo horario:
 * "Lun–Vie 09:00–14:00, 16:00–19:00 · Sáb 09:00–13:00".
 */
export function resumenSemana(bloques: BloqueHorario[]): string[] {
  const filas: { dias: DiaSemana[]; texto: string }[] = [];
  for (const dia of DIAS) {
    const texto = textoBloques(bloquesDelDia(bloques, dia));
    if (!texto) continue;
    const ultima = filas[filas.length - 1];
    const contiguo = ultima && DIAS.indexOf(ultima.dias[ultima.dias.length - 1]!) === DIAS.indexOf(dia) - 1;
    if (ultima && contiguo && ultima.texto === texto) ultima.dias.push(dia);
    else filas.push({ dias: [dia], texto });
  }
  return filas.map(({ dias, texto }) => {
    const primero = ETIQUETA_DIA_CORTA[dias[0]!];
    const rango = dias.length === 1 ? primero : `${primero}–${ETIQUETA_DIA_CORTA[dias[dias.length - 1]!]}`;
    return `${rango} ${texto}`;
  });
}

/**
 * Lo que la agenda necesita saber de una persona. Sin horario propio y sin
 * horario de clinica configurado no se restringe nada (igual que el backend).
 */
export interface ReglasAgenda {
  restringe: boolean;
  bloques: BloqueHorario[];
  duracion: number;
  ausencias: Ausencia[];
}

export function reglasDe(
  nutricionistaId: Guid | undefined,
  horarios: Horarios | undefined,
  ausencias: Ausencia[] | undefined,
): ReglasAgenda {
  const persona = horarios?.personas.find((p) => p.nutricionistaId === nutricionistaId);
  const propio = persona?.horarioPropio ?? false;
  const bloques = persona?.bloques ?? horarios?.clinica ?? [];
  return {
    restringe: Boolean(horarios) && (propio || (horarios?.clinica.length ?? 0) > 0),
    bloques,
    duracion: persona?.duracionConsultaMinutos ?? 60,
    ausencias: (ausencias ?? []).filter((a) => a.nutricionistaId === nutricionistaId),
  };
}

export function ausenciaEn(ausencias: Ausencia[], clave: string): Ausencia | undefined {
  return ausencias.find((a) => a.fechaInicio <= clave && clave <= a.fechaFin);
}

export function describirAusencia(a: Ausencia): string {
  const fin = formatearCalendario(a.fechaFin, { day: "numeric", month: "short" });
  if (a.fechaInicio === a.fechaFin) return `${a.motivo ?? "Ausente"} el ${fin}`;
  const inicio = formatearCalendario(a.fechaInicio, { day: "numeric", month: "short" });
  return `${a.motivo ?? "Ausente"} del ${inicio} al ${fin}`;
}

/** Motivo para no poder atender ese dia completo, o null. */
export function diaNoDisponible(reglas: ReglasAgenda, clave: string): string | null {
  const ausencia = ausenciaEn(reglas.ausencias, clave);
  if (ausencia) {
    const hasta = formatearCalendario(ausencia.fechaFin, { day: "numeric", month: "long" });
    return `${ausencia.motivo ?? "Ausente"} hasta el ${hasta}`;
  }
  if (reglas.restringe && bloquesDelDia(reglas.bloques, diaDeClave(clave)).length === 0) {
    return `No atiende los ${ETIQUETA_DIA[diaDeClave(clave)].toLowerCase()}`;
  }
  return null;
}

/** ¿La franja [inicio, fin) (minutos) cae completa dentro de un bloque de ese dia? */
export function dentroDeHorario(reglas: ReglasAgenda, clave: string, inicio: number, fin: number): boolean {
  if (!reglas.restringe) return true;
  return bloquesDelDia(reglas.bloques, diaDeClave(clave)).some(
    (b) => minutosDeHora(b.horaInicio) <= inicio && fin <= minutosDeHora(b.horaFin),
  );
}

/** Mismas reglas que el backend al validar un horario. */
export function problemaBloques(bloques: BloqueHorario[]): string | null {
  for (const dia of DIAS) {
    const lista = bloquesDelDia(bloques, dia);
    for (let i = 0; i < lista.length; i++) {
      const b = lista[i]!;
      if (minutosDeHora(b.horaFin) <= minutosDeHora(b.horaInicio))
        return `${ETIQUETA_DIA[dia]}: la hora de fin debe ser posterior a la de inicio.`;
      const anterior = lista[i - 1];
      if (anterior && minutosDeHora(b.horaInicio) < minutosDeHora(anterior.horaFin))
        return `${ETIQUETA_DIA[dia]}: hay bloques que se enciman.`;
    }
    if (lista.length > 6) return `${ETIQUETA_DIA[dia]}: máximo 6 bloques por día.`;
  }
  return null;
}
