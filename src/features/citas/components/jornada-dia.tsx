import { Fragment } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CalendarPlus, Coffee } from "lucide-react";

import { BotonesEstadoCita } from "@/features/citas/components/acciones-cita";
import { BadgeEstadoCita } from "@/features/citas/components/badge-estado-cita";
import { COLOR_ESTADO_CITA } from "@/features/citas/lib/estados-cita";
import { formatearHoraLocal } from "@/features/citas/lib/fechas-cita";
import { AvatarPaciente } from "@/features/pacientes/components/avatar-paciente";
import { HojaCalendario } from "@/components/ficha/hoja-calendario";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Cita } from "@/types/api";
import { formatearInstante } from "@/lib/zona-horaria";

/** "2026-10-26" -> Date local, sin correr el dia por zona horaria. */
function fechaDeClave(clave: string): Date {
  const [anio, mes, dia] = clave.split("-").map(Number);
  return new Date(anio ?? 1970, (mes ?? 1) - 1, dia ?? 1);
}

const FORMATO_DIA = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

interface JornadaDiaProps {
  esHoy: boolean;
  clave: string;
  cargando: boolean;
  citas: Cita[];
  /** Instante actual en ms, para colocar la marca de "ahora". */
  ahora: number;
  /** En la columna estrecha del calendario se compactan las filas. */
  compacta?: boolean;
  /** Usa solo la lista dentro de un panel lateral con encabezado propio. */
  enSheet?: boolean;
  onVerHoy?: () => void;
  onAbrirCita: (citaId: string) => void;
  onAgendar: () => void;
  onVerCalendario?: () => void;
}

/**
 * La jornada del consultorio como una agenda de papel: hora en el margen,
 * una linea vertical que recorre el dia y cada cita colgada de ella con el
 * color de su estado. La marca de "ahora" parte la jornada en lo que ya
 * paso y lo que viene.
 */
export function JornadaDia({
  esHoy,
  clave,
  cargando,
  citas,
  ahora,
  compacta = false,
  enSheet = false,
  onVerHoy,
  onAbrirCita,
  onAgendar,
  onVerCalendario,
}: JornadaDiaProps) {
  const fecha = fechaDeClave(clave);
  const siguiente = citas.find((c) => new Date(c.fechaInicio).getTime() >= ahora);
  /* La marca va justo antes de la primera cita que aun no empieza. Si todas
     estan en curso, va al final. */
  const indiceAhora = esHoy
    ? (() => {
        const i = citas.findIndex((c) => new Date(c.fechaInicio).getTime() >= ahora);
        return i === -1 ? citas.length : i;
      })()
    : -1;

  return (
    <section className={cn("overflow-hidden", enSheet ? "" : "hoja rounded-xl")}>
      {!enSheet && <header className="flex items-center gap-4 px-4 pt-4 pb-4 md:px-5">
        <HojaCalendario fecha={fecha} tamano={compacta ? "md" : "lg"} />

        <div className="min-w-0 flex-1">
          <p className="text-primary text-xs font-semibold">
            {esHoy ? "Hoy" : "Día seleccionado"}
          </p>
          <h2
            className={cn(
              "text-foreground font-semibold tracking-tight first-letter:uppercase",
              compacta ? "text-base" : "text-xl",
            )}
          >
            {FORMATO_DIA.format(fecha)}
          </h2>
          {!cargando && (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {citas.length === 0
                ? esHoy
                  ? "Sin citas pendientes"
                  : "Sin citas"
                : `${citas.length} ${citas.length === 1 ? "cita" : "citas"}${esHoy ? " por atender" : ""}`}
              {esHoy && siguiente && (
                <>
                  , la siguiente a las{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {formatearHoraLocal(siguiente.fechaInicio)}
                  </span>
                </>
              )}
            </p>
          )}
        </div>

        {!esHoy && (
          <Button variant="outline" size="sm" onClick={onVerHoy} className="shrink-0">
            Ver hoy
          </Button>
        )}
      </header>}

      {!enSheet && <div aria-hidden className="border-border-strong mx-4 border-t border-dashed md:mx-5" />}

      <div className={cn("px-4 py-4 md:px-5", enSheet && "md:px-4")}>
        {cargando ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <span className="sr-only">Cargando citas del día...</span>
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-16 flex-1 rounded-lg" />
              </div>
            ))}
          </div>
        ) : citas.length === 0 ? (
          <JornadaLibre
            esHoy={esHoy}
            onAgendar={onAgendar}
            onVerCalendario={onVerCalendario}
          />
        ) : (
          <ol className="relative">
            {citas.map((cita, indice) => (
              <Fragment key={cita.id}>
                {indice === indiceAhora && <MarcaAhora ahora={ahora} />}
                <FilaCita
                  cita={cita}
                  ultima={indice === citas.length - 1 && indiceAhora !== citas.length}
                  compacta={compacta}
                  onAbrir={() => onAbrirCita(cita.id)}
                />
              </Fragment>
            ))}
            {indiceAhora === citas.length && <MarcaAhora ahora={ahora} ultima />}
          </ol>
        )}
      </div>
    </section>
  );
}

/* Columnas fijas de la linea: margen de hora y carril del nodo. */
const MARGEN_HORA = "w-12 shrink-0";
const CARRIL = "relative flex w-5 shrink-0 justify-center";

function FilaCita({
  cita,
  ultima,
  compacta,
  onAbrir,
}: {
  cita: Cita;
  ultima: boolean;
  compacta: boolean;
  onAbrir: () => void;
}) {
  const cerrada = cita.estado === "Cancelada" || cita.estado === "NoAsistio";

  return (
    <li className="flex gap-2">
      <div className={cn(MARGEN_HORA, "pt-3 text-right")}>
        <p className="text-foreground text-sm font-semibold tabular-nums">
          {formatearHoraLocal(cita.fechaInicio)}
        </p>
        <p className="text-muted-foreground-subtle text-xs tabular-nums">
          {formatearHoraLocal(cita.fechaFin)}
        </p>
      </div>

      {/* Carril: el hilo vertical une las citas; el nodo lleva el color del
          estado con un anillo del color de la hoja para recortarse. */}
      <div className={CARRIL} aria-hidden>
        <span
          className={cn(
            "bg-border-strong absolute top-0 w-px",
            ultima ? "h-5" : "bottom-0",
          )}
        />
        <span
          className={cn(
            "ring-card relative mt-4 size-2.5 rounded-full ring-4",
            COLOR_ESTADO_CITA[cita.estado],
          )}
        />
      </div>

      <div className={cn("min-w-0 flex-1", ultima ? "pb-0" : "pb-3")}>
        <article
          className={cn(
            "group/cita border-border hover:border-border-strong hover:bg-accent/50 rounded-lg border p-3 transition-colors duration-150",
            cerrada && "opacity-70",
          )}
        >
          <div className="flex items-start gap-3">
            {!compacta && (
              <AvatarPaciente
                nombre={cita.pacienteNombre}
                id={cita.pacienteId}
                className="size-9 shrink-0"
              />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link
                  to={`/pacientes/${cita.pacienteId}`}
                  className={cn(
                    "text-foreground min-w-0 truncate rounded-sm text-sm font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring",
                    cerrada && "line-through decoration-1",
                  )}
                >
                  {cita.pacienteNombre}
                </Link>
                <BadgeEstadoCita estado={cita.estado} />
              </div>
              <p className="text-muted-foreground mt-0.5 truncate text-xs">
                {cita.motivo ?? "Sin motivo registrado"}
              </p>
              <p className="text-muted-foreground-subtle truncate text-xs">
                Con {cita.nutricionistaNombre}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onAbrir}
              className="text-muted-foreground -mt-1 -mr-1 h-7 shrink-0 px-2 text-xs"
            >
              Detalle
            </Button>
          </div>

          <div className="mt-2.5 empty:hidden">
            <BotonesEstadoCita cita={cita} />
          </div>
        </article>
      </div>
    </li>
  );
}

function MarcaAhora({ ahora, ultima = false }: { ahora: number; ultima?: boolean }) {
  return (
    <li className="flex items-center gap-2" aria-label="Hora actual">
      <div className={cn(MARGEN_HORA, "text-right")}>
        <span className="text-destructive text-xs font-semibold tabular-nums">
          {formatearInstante(ahora, { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div className={cn(CARRIL, "self-stretch")} aria-hidden>
        {!ultima && <span className="bg-border-strong absolute inset-y-0 w-px" />}
        <span className="bg-destructive ring-card relative my-2 size-2 rounded-full ring-4" />
      </div>
      <div className="flex flex-1 items-center gap-2 py-2" aria-hidden>
        <span className="bg-destructive/60 h-px flex-1" />
        <span className="text-destructive text-xs font-medium">Ahora</span>
      </div>
    </li>
  );
}

function JornadaLibre({
  esHoy,
  onAgendar,
  onVerCalendario,
}: {
  esHoy: boolean;
  onAgendar: () => void;
  onVerCalendario?: () => void;
}) {
  return (
    <div className="hoja-vacia flex flex-col items-center gap-3 rounded-lg px-4 py-8 text-center">
      <span className="text-primary bg-primary-soft grid size-11 place-items-center rounded-full">
        <Coffee className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-foreground text-sm font-semibold">
          {esHoy ? "Agenda libre por hoy" : "Día sin citas"}
        </p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-xs text-sm">
          {esHoy
            ? "No quedan citas pendientes. Aprovecha para agendar el seguimiento de algún paciente."
            : "No hay citas registradas para este día con el filtro actual."}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" onClick={onAgendar}>
          <CalendarPlus className="size-4" />
          Agendar cita
        </Button>
        {onVerCalendario && (
          <Button size="sm" variant="ghost" onClick={onVerCalendario}>
            <CalendarDays className="size-4" />
            Ver calendario
          </Button>
        )}
      </div>
    </div>
  );
}
