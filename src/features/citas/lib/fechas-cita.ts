import {
  claveDia,
  esFechaValida,
  formatearCalendario,
  formatearInstante,
  instanteDesdeValorReloj,
  partesEnClinica,
  valorRelojDesdeInstante,
} from "@/lib/zona-horaria";

/**
 * La API guarda instantes en UTC y valida `FechaInicio` contra `DateTime.UtcNow`,
 * pero quien agenda la cita piensa en hora local. El formulario captura hora local,
 * al enviar se convierte a instante real y al mostrar/editar vuelve a local, para
 * que la hora escrita sea la hora que se ve.
 *
 * "Local" aqui significa hora de Mexico (lib/zona-horaria), no la del
 * navegador: los nombres se conservan para no tocar a quien ya los usa.
 */
export function aInstanteUtc(valorLocal: string): string {
  return valorLocal ? instanteDesdeValorReloj(valorLocal) : "";
}

export function aValorLocal(iso: string | null | undefined): string {
  return valorRelojDesdeInstante(iso);
}

/** Clave de agrupacion por dia (hora de Mexico), para encabezados de la agenda. */
export function claveFechaLocal(iso: string | null | undefined): string {
  return esFechaValida(iso) ? claveDia(iso!) : "";
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, "0");
}

export function formatearFechaHoraLocal(iso: string | null | undefined): string {
  return formatearInstante(iso, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatearFechaLargaLocal(iso: string | null | undefined): string {
  return formatearInstante(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** `clave` es un dia de calendario ("2026-10-28"): no se mueve de dia. */
export function formatearFechaLargaClave(clave: string): string {
  return formatearCalendario(clave, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatearHoraLocal(iso: string | null | undefined): string {
  return formatearInstante(iso, { hour: "2-digit", minute: "2-digit" });
}

/** "2026-10-14T09:30" (hora local del formulario) -> Date local. */
export function fechaDe(valor: string | null | undefined): Date | undefined {
  if (!valor) return undefined;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? undefined : fecha;
}

/** "HH:mm" dentro de un valor local. */
export function horaDe(valor: string | null | undefined): string {
  return valor && valor.length >= 16 ? valor.slice(11, 16) : "";
}

/** Junta el dia elegido en el calendario con la hora del selector. */
export function componerFechaHora(fecha: Date, hora: string): string {
  const [h, m] = hora.split(":");
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}T${h ?? "00"}:${m ?? "00"}`;
}

/** Franjas de 15 minutos para elegir la hora de una cita. */
export const HORAS_15: string[] = Array.from({ length: 96 }, (_, i) =>
  `${dosDigitos(Math.floor(i / 4))}:${dosDigitos((i % 4) * 15)}`,
);

/** Horario de agenda util: de 08:00 a 20:00, en pasos de 15 minutos. */
export const HORAS_AGENDA: string[] = HORAS_15.filter(
  (valor) => valor >= "08:00" && valor <= "20:00",
);

/** "09:15" + 30 -> "09:45" sin pasarse de las 24:00. */
export function sumaMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(":").map(Number);
  const total = Math.min((h || 0) * 60 + (m || 0) + minutos, 24 * 60 - 1);
  return `${dosDigitos(Math.floor(total / 60))}:${dosDigitos(total % 60)}`;
}

/**
 * Franja sugerida al agendar: hoy, en el siguiente cuarto de hora, por una
 * hora. Si ya no cabe una hora antes de las 20:00 (o es antes de las 08:00),
 * pasa a mañana a las 09:00. Todo en hora local: la fecha se arma con los
 * componentes locales y nunca con toISOString, que en Mexico (UTC-6) puede
 * correr el dia.
 */
export function franjaPorDefecto(ahora = new Date()): { inicio: string; fin: string } {
  const reloj = partesEnClinica(ahora);
  const actual = reloj.hora * 60 + reloj.minuto;
  const siguiente = Math.ceil((actual + 1) / 15) * 15;
  const apertura = 8 * 60;
  const ultimoInicio = 19 * 60;

  /* El dia es el de la clinica, como Date de calendario (componentes locales). */
  const dia = new Date(reloj.anio, reloj.mes - 1, reloj.dia);
  let inicio = Math.max(siguiente, apertura);
  if (inicio > ultimoInicio) {
    dia.setDate(dia.getDate() + 1);
    inicio = 9 * 60;
  }
  const hora = `${dosDigitos(Math.floor(inicio / 60))}:${dosDigitos(inicio % 60)}`;

  return { inicio: componerFechaHora(dia, hora), fin: componerFechaHora(dia, sumaMinutos(hora, 60)) };
}
