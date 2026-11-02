/**
 * Hora de la clinica: toda la app muestra y calcula fechas en hora de Mexico,
 * sin importar la zona del navegador (una computadora mal configurada o un
 * servidor en UTC no deben correr citas ni pagos de dia).
 *
 * Hay dos clases de fechas y no se mezclan:
 *  - INSTANTES (`2026-10-28T03:16:21Z`): momentos reales que guarda el
 *    backend en UTC. Se muestran convertidos a la zona de la clinica.
 *  - FECHAS DE CALENDARIO (`2026-10-27`, `DateOnly` en el backend: nacimiento,
 *    inicio de un plan). No tienen hora ni zona; se muestran tal cual.
 *
 * Los selectores de fecha devuelven un `Date` a medianoche local: de ellos
 * solo se usan anio, mes y dia (`claveDeCalendario`), que son los del dia
 * que el usuario eligio.
 */
export const ZONA_CLINICA = "America/Mexico_City";
export const LOCALE = "es-MX";

/** "YYYY-MM-DD": un dia de calendario. */
export type ClaveDia = string;

const dos = (n: number) => String(n).padStart(2, "0");

/* Un solo formateador de partes, reutilizado: crear Intl.DateTimeFormat es caro. */
const PARTES = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA_CLINICA,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export interface PartesFecha {
  anio: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
  segundo: number;
}

function aDate(instante: string | number | Date): Date {
  return instante instanceof Date ? instante : new Date(instante);
}

export function esFechaValida(instante: string | number | Date | null | undefined): boolean {
  if (instante === null || instante === undefined || instante === "") return false;
  return !Number.isNaN(aDate(instante).getTime());
}

/** Anio, mes, dia, hora... de un instante, vistos en la zona de la clinica. */
export function partesEnClinica(instante: string | number | Date): PartesFecha {
  const valores = Object.fromEntries(
    PARTES.formatToParts(aDate(instante)).map((p) => [p.type, Number(p.value)]),
  ) as Record<string, number>;
  return {
    anio: valores.year!,
    mes: valores.month!,
    dia: valores.day!,
    hora: valores.hour!,
    minuto: valores.minute!,
    segundo: valores.second!,
  };
}

/** Diferencia (ms) entre la hora de la clinica y UTC en ese instante. */
function desfaseMs(instante: Date): number {
  const p = partesEnClinica(instante);
  const comoUtc = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo);
  return comoUtc - Math.floor(instante.getTime() / 1000) * 1000;
}

/**
 * Hora de reloj de la clinica -> instante real. Se calcula el desfase en vez
 * de fijar "-06:00", asi sigue siendo correcto si Mexico vuelve a cambiar de
 * horario.
 */
export function instanteDesdeClinica(
  anio: number,
  mes: number,
  dia: number,
  hora = 0,
  minuto = 0,
  segundo = 0,
  ms = 0,
): Date {
  const reloj = Date.UTC(anio, mes - 1, dia, hora, minuto, segundo, ms);
  let instante = new Date(reloj - desfaseMs(new Date(reloj)));
  /* Segunda pasada por si el desfase cambia justo en esa fecha. */
  instante = new Date(reloj - desfaseMs(instante));
  return instante;
}

/* ---------- Dias ---------- */

/** El dia (en la clinica) al que pertenece un instante. */
export function claveDia(instante: string | number | Date): ClaveDia {
  const p = partesEnClinica(instante);
  return `${p.anio}-${dos(p.mes)}-${dos(p.dia)}`;
}

/** El dia de hoy en la clinica. */
export function hoyEnClinica(): ClaveDia {
  return claveDia(new Date());
}

/** El dia que se eligio en un selector (sus componentes locales). */
export function claveDeCalendario(fecha: Date): ClaveDia {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** Clave -> Date a medianoche local, para alimentar selectores de fecha. */
export function calendarioDeClave(clave: ClaveDia | null | undefined): Date | undefined {
  if (!clave) return undefined;
  const [anio, mes, dia] = clave.slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return undefined;
  return new Date(anio, mes - 1, dia);
}

/** Hoy de la clinica como Date de calendario (para "desde hoy" en selectores). */
export function hoyCalendario(): Date {
  return calendarioDeClave(hoyEnClinica())!;
}

export function sumarDias(clave: ClaveDia, dias: number): ClaveDia {
  const [anio, mes, dia] = clave.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio!, mes! - 1, dia! + dias));
  return fecha.toISOString().slice(0, 10);
}

/** Un dia completo de la clinica como instantes, para filtrar en la API. */
export function rangoDelDia(dia: ClaveDia | Date): { desde: string; hasta: string } {
  const clave = typeof dia === "string" ? dia : claveDeCalendario(dia);
  const [anio, mes, d] = clave.split("-").map(Number);
  return {
    desde: instanteDesdeClinica(anio!, mes!, d!).toISOString(),
    hasta: instanteDesdeClinica(anio!, mes!, d!, 23, 59, 59, 999).toISOString(),
  };
}

/* ---------- Hora de reloj (formularios de cita) ---------- */

/** Instante -> "YYYY-MM-DDTHH:mm" en hora de la clinica. */
export function valorRelojDesdeInstante(instante: string | null | undefined): string {
  if (!esFechaValida(instante)) return "";
  const p = partesEnClinica(instante!);
  return `${p.anio}-${dos(p.mes)}-${dos(p.dia)}T${dos(p.hora)}:${dos(p.minuto)}`;
}

/** "YYYY-MM-DDTHH:mm" (hora de la clinica) -> instante ISO para la API. */
export function instanteDesdeValorReloj(valor: string): string {
  const coincide = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(valor);
  if (!coincide) return "";
  const [, a, m, d, h, mi] = coincide.map(Number);
  return instanteDesdeClinica(a!, m!, d!, h!, mi!).toISOString();
}

/** Minutos desde las 00:00 de la clinica en este momento. */
export function minutoActualEnClinica(): number {
  const p = partesEnClinica(new Date());
  return p.hora * 60 + p.minuto;
}

/* ---------- Formato ---------- */

const cacheFormatos = new Map<string, Intl.DateTimeFormat>();

function formato(opciones: Intl.DateTimeFormatOptions, zona = ZONA_CLINICA): Intl.DateTimeFormat {
  const clave = zona + JSON.stringify(opciones);
  let f = cacheFormatos.get(clave);
  if (!f) {
    f = new Intl.DateTimeFormat(LOCALE, { ...opciones, timeZone: zona });
    cacheFormatos.set(clave, f);
  }
  return f;
}

/** Formatea un instante en hora de la clinica. */
export function formatearInstante(
  instante: string | number | Date | null | undefined,
  opciones: Intl.DateTimeFormatOptions,
): string {
  if (!esFechaValida(instante)) return "—";
  return formato(opciones).format(aDate(instante!));
}

/** Formatea una fecha de calendario ("2026-10-27") sin moverla de dia. */
export function formatearCalendario(clave: string | null | undefined, opciones: Intl.DateTimeFormatOptions): string {
  if (!clave) return "—";
  const [anio, mes, dia] = clave.slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return "—";
  return formato(opciones, "UTC").format(new Date(Date.UTC(anio, mes - 1, dia)));
}
