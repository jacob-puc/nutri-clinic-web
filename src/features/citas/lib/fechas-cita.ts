/**
 * La API guarda instantes en UTC y valida `FechaInicio` contra `DateTime.UtcNow`,
 * pero quien agenda la cita piensa en hora local. El formulario captura hora local,
 * al enviar se convierte a instante real y al mostrar/editar vuelve a local, para
 * que la hora escrita sea la hora que se ve.
 */
export function aInstanteUtc(valorLocal: string): string {
  if (!valorLocal) return "";
  const fecha = new Date(valorLocal);
  return Number.isNaN(fecha.getTime()) ? "" : fecha.toISOString();
}

export function aValorLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

/** Clave de agrupacion por dia (hora local), para encabezados de la agenda. */
export function claveFechaLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, "0");
}

export function formatearFechaHoraLocal(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatearFechaLargaLocal(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** `clave` viene de `claveFechaLocal` (fecha local): se arma con el ctor local para no correr el dia. */
export function formatearFechaLargaClave(clave: string): string {
  const [anio, mes, dia] = clave.split("-").map(Number);
  if (!anio || !mes || !dia) return "—";
  const fecha = new Date(anio, mes - 1, dia);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatearHoraLocal(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
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

/** Franja sugerida al agendar: manana de 09:00 a 10:00, hora local. */
export function franjaPorDefecto(): { inicio: string; fin: string } {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() + 1);
  inicio.setHours(9, 0, 0, 0);

  const fin = new Date(inicio);
  fin.setHours(fin.getHours() + 1);

  return { inicio: aValorLocal(inicio.toISOString()), fin: aValorLocal(fin.toISOString()) };
}
