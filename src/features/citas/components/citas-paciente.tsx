import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, CalendarX, ChevronDown } from "lucide-react";

import { AccionesCita } from "@/features/citas/components/acciones-cita";
import { BadgeEstadoCita } from "@/features/citas/components/badge-estado-cita";
import { DialogoCita } from "@/features/citas/components/dialogo-cita";
import { useCitasDePaciente } from "@/features/citas/hooks/use-citas";
import {
  formatearFechaHoraLocal,
  formatearHoraLocal,
} from "@/features/citas/lib/fechas-cita";
import { HojaCalendario } from "@/components/ficha/hoja-calendario";
import { Seccion } from "@/components/ficha/seccion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Cita, Guid } from "@/types/api";
import { calendarioDeClave, claveDia } from "@/lib/zona-horaria";

/**
 * Citas del paciente dentro de su ficha, presentadas como linea de tiempo:
 * la proxima cita se destaca y el historial queda plegado debajo.
 * Tambien es el punto de entrada para agendar una nueva cita.
 */
export function CitasPaciente({
  pacienteId,
  pacienteNombre,
}: {
  pacienteId: Guid;
  pacienteNombre: string;
}) {
  const { data: citas = [], isPending, isError, refetch } = useCitasDePaciente(pacienteId);
  const [agendando, setAgendando] = useState(false);
  // Instante de referencia capturado al montar: mantenerlo fijo evita que
  // las citas "pasadas/futuras" salten en cada re-render.
  const [ahora] = useState(() => Date.now());
  const esFutura = (cita: Cita) => new Date(cita.fechaInicio).getTime() >= ahora;
  const futuras = citas
    .filter(esFutura)
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
  const pasadas = citas
    .filter((cita) => !esFutura(cita))
    .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));
  const [proxima, ...otrasFuturas] = futuras;

  return (
    <Seccion
      titulo="Citas"
      icono={CalendarPlus}
      meta={citas.length > 0 ? `${citas.length} en total` : undefined}
      cuerpoClassName="p-0 md:p-0"
      acciones={
        <Button variant="outline" size="sm" onClick={() => setAgendando(true)}>
          <CalendarPlus className="size-4" />
          <span className="hidden sm:inline">Agendar cita</span>
          <span className="sm:hidden">Agendar</span>
        </Button>
      }
    >
      {isPending && (
        <div className="space-y-2.5 px-4 py-5 md:px-5">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-10 w-4/5 rounded-lg" />
        </div>
      )}

      {!isPending && isError && (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center md:px-5">
          <p className="text-muted-foreground text-sm">
            No pudimos cargar las citas.
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isPending && !isError && citas.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center md:px-5">
          <CalendarX className="text-muted-foreground size-6" aria-hidden />
          <p className="text-muted-foreground text-sm">
            Sin citas agendadas. Programa la primera desde aqui.
          </p>
        </div>
      )}

      {!isPending && !isError && citas.length > 0 && (
        <div className="px-4 py-4 md:px-5">
          {proxima && <CitaProximal cita={proxima} />}

          {otrasFuturas.length > 0 && <LineaCitas citas={otrasFuturas} />}

          {pasadas.length > 0 && (
            <details className="group border-border/60 mt-4 border-t pt-3">
              <summary className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-md text-xs font-medium transition-colors outline-none focus-visible:ring-2">
                <ChevronDown
                  className="size-3.5 transition-transform group-open:rotate-180"
                  aria-hidden
                />
                Citas anteriores ({pasadas.length})
              </summary>
              <LineaCitas citas={pasadas} pasadas />
            </details>
          )}
        </div>
      )}

      <DialogoCita
        abierto={agendando}
        onOpenChange={setAgendando}
        pacienteId={pacienteId}
        pacienteNombre={pacienteNombre}
      />
    </Seccion>
  );
}

/** La cita que viene: bloque destacado con el dia del calendario a la izquierda. */
function CitaProximal({ cita }: { cita: Cita }) {
  const fecha = calendarioDeClave(claveDia(cita.fechaInicio))!;

  return (
    <article className="border-primary/25 bg-primary-soft/60 rounded-lg border px-3.5 py-3">
      <div className="flex flex-wrap items-start gap-3">
        <HojaCalendario fecha={fecha} />

        <div className="min-w-0 flex-1">
          <p className="text-primary text-xs font-medium">
            Próxima cita
          </p>
          <p className="text-foreground mt-0.5 text-sm font-medium tabular-nums">
            <Link
              to={`/citas/${cita.id}`}
              className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              {formatearFechaHoraLocal(cita.fechaInicio)}
            </Link>
            {" — "}
            {formatearHoraLocal(cita.fechaFin)}
          </p>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {cita.nutricionistaNombre}
            {cita.motivo && ` · ${cita.motivo}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <BadgeEstadoCita estado={cita.estado} />
          <AccionesCita cita={cita} />
        </div>
      </div>
    </article>
  );
}

function LineaCitas({
  citas,
  pasadas = false,
}: {
  citas: Cita[];
  pasadas?: boolean;
}) {
  return (
    <ol className="border-border/60 mt-3 space-y-0 border-l pl-4">
      {citas.map((cita) => (
        <li key={cita.id} className="border-border/50 relative py-2.5 last:pb-0">
          <span
            aria-hidden
            className="bg-border ring-card absolute top-4 -left-[19px] size-2 rounded-full ring-2"
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <div className="min-w-0 flex-1">
              <Link
                to={`/citas/${cita.id}`}
                className={cn(
                  "rounded-sm text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring",
                  pasadas ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {formatearFechaHoraLocal(cita.fechaInicio)}
                {" — "}
                {formatearHoraLocal(cita.fechaFin)}
              </Link>
              <p className="text-muted-foreground truncate text-xs">
                {cita.nutricionistaNombre}
                {cita.motivo && ` · ${cita.motivo}`}
              </p>
            </div>
            <BadgeEstadoCita estado={cita.estado} />
            <AccionesCita cita={cita} />
          </div>
        </li>
      ))}
    </ol>
  );
}
