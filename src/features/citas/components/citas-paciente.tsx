import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, CalendarX } from "lucide-react";

import { AccionesCita } from "@/features/citas/components/acciones-cita";
import { BadgeEstadoCita } from "@/features/citas/components/badge-estado-cita";
import { DialogoCita } from "@/features/citas/components/dialogo-cita";
import { useCitasDePaciente } from "@/features/citas/hooks/use-citas";
import { formatearFechaHoraLocal, formatearHoraLocal } from "@/features/citas/lib/fechas-cita";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Guid } from "@/types/api";

/**
 * Citas del paciente dentro de su ficha. Tambien es el punto de entrada
 * para agendar una nueva cita desde la ficha.
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

  return (
    <Card className="py-0">
      <CardContent className="px-4 pt-2 pb-5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <CalendarPlus className="text-primary size-4" aria-hidden />
            Citas
            {citas.length > 0 && (
              <span className="text-muted-foreground font-normal">
                · {citas.length}
              </span>
            )}
          </h2>
          <Button variant="outline" size="sm" onClick={() => setAgendando(true)}>
            <CalendarPlus className="size-4" />
            <span className="hidden sm:inline">Agendar cita</span>
            <span className="sm:hidden">Agendar</span>
          </Button>
        </div>
        <Separator className="my-2" />

        {isPending && (
          <div className="space-y-2 py-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        )}

        {!isPending && isError && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-muted-foreground text-sm">
              No pudimos cargar las citas.
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        {!isPending && !isError && citas.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CalendarX className="text-muted-foreground size-6" aria-hidden />
            <p className="text-muted-foreground text-sm">
              Sin citas agendadas. Programa la primera desde aqui.
            </p>
          </div>
        )}

        {!isPending && !isError && citas.length > 0 && (
          <ul className="divide-border divide-y">
            {[...citas]
              .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio))
              .map((cita) => (
                <li
                  key={cita.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/agenda/${cita.id}`}
                      className="text-foreground rounded-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
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
                </li>
              ))}
          </ul>
        )}
      </CardContent>

      <DialogoCita
        abierto={agendando}
        onOpenChange={setAgendando}
        pacienteId={pacienteId}
        pacienteNombre={pacienteNombre}
      />
    </Card>
  );
}
