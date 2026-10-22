import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, ChevronRight, Pencil, Trash2 } from "lucide-react";

import { AccionesCita } from "@/features/citas/components/acciones-cita";
import { BadgeEstadoCita } from "@/features/citas/components/badge-estado-cita";
import { DialogoCita } from "@/features/citas/components/dialogo-cita";
import { useCita } from "@/features/citas/hooks/use-citas";
import { useEliminarCita } from "@/features/citas/hooks/use-mutaciones-cita";
import {
  formatearFechaLargaLocal,
  formatearFechaHoraLocal,
  formatearHoraLocal,
} from "@/features/citas/lib/fechas-cita";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { mensajeDeError } from "@/lib/api-error";
import { toast } from "sonner";
import type { Cita } from "@/types/api";

export function CitaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { data: cita, isPending, isError, error } = useCita(id);

  if (isError) {
    return <EstadoErrorCita mensaje={mensajeDeError(error)} />;
  }

  if (isPending || !cita) {
    return <DetalleSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <nav aria-label="Navegación de citas" className="mb-4">
        <ol className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-sm">
          <li className="shrink-0">
            <Link
              to="/citas"
              className="rounded-sm px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Citas
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground-subtle shrink-0">
            <ChevronRight className="size-4" />
          </li>
          <li
            className="bg-primary/10 text-primary border-primary/20 min-w-0 truncate rounded-md border px-2.5 py-1 font-semibold"
            aria-current="page"
          >
            Cita
          </li>
        </ol>
      </nav>

      <EncabezadoCita cita={cita} />
      <DetalleCita cita={cita} />
    </div>
  );
}

function EncabezadoCita({ cita }: { cita: Cita }) {
  const [editando, setEditando] = useState(false);

  return (
    <>
      <Card className="py-0 shadow-subtle">
        <CardContent className="flex flex-wrap items-center gap-4 px-4 py-5 md:px-6">
          <div className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-lg">
            <CalendarDays className="size-5" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-foreground text-lg font-semibold capitalize">
              {formatearFechaLargaLocal(cita.fechaInicio)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-sm tabular-nums">
              {formatearFechaHoraLocal(cita.fechaInicio)} —{" "}
              {formatearHoraLocal(cita.fechaFin)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <BadgeEstadoCita estado={cita.estado} />
            <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
              <Pencil className="size-4" />
              Editar
            </Button>
            <AccionesCita cita={cita} />
            <EliminarCita cita={cita} />
          </div>
        </CardContent>
      </Card>

      <DialogoCita abierto={editando} onOpenChange={setEditando} cita={cita} />
    </>
  );
}

function EliminarCita({ cita }: { cita: Cita }) {
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();
  const eliminar = useEliminarCita(cita.id);

  // Solo se elimina en Programada: despues de ocurrida, el backend pide cancelar.
  if (cita.estado !== "Programada") return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={() => setAbierto(true)}
      >
        <Trash2 className="size-4" />
        Eliminar
      </Button>

      <AlertDialog open={abierto} onOpenChange={setAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar la cita</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará la cita de {cita.pacienteNombre}. Esta acción no se puede
              deshacer. Si la atención ya ocurrió, mejor cancélala con un motivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminar.isPending}>
              Volver
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={eliminar.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(evento) => {
                evento.preventDefault();
                eliminar.mutate(undefined, {
                  onSuccess: () => navigate("/citas"),
                  onError: (error: unknown) =>
                    toast.error("No se pudo eliminar la cita", {
                      description: mensajeDeError(error),
                    }),
                });
              }}
            >
              Eliminar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DetalleCita({ cita }: { cita: Cita }) {
  return (
    <div className="mt-4 space-y-4">
      <Card className="py-0">
        <CardContent className="px-4 pt-2 pb-5 md:px-6">
          <h2 className="text-foreground text-sm font-semibold">Detalles</h2>
          <Separator className="my-2" />

          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <DatoCita etiqueta="Paciente">
              <Link
                to={`/pacientes/${cita.pacienteId}`}
                className="text-foreground rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                {cita.pacienteNombre}
              </Link>
            </DatoCita>

            <DatoCita etiqueta="Nutricionista">
              {cita.nutricionistaNombre}
            </DatoCita>

            <DatoCita etiqueta="Inicio">
              {formatearFechaHoraLocal(cita.fechaInicio)}
            </DatoCita>

            <DatoCita etiqueta="Fin">
              {formatearFechaHoraLocal(cita.fechaFin)}
            </DatoCita>

            <DatoCita etiqueta="Motivo" className="sm:col-span-2">
              {cita.motivo ?? "Sin motivo registrado"}
            </DatoCita>

            {cita.consultaId && (
              <DatoCita etiqueta="Consulta" className="sm:col-span-2">
                Vinculada a una consulta clínica
              </DatoCita>
            )}
          </dl>
        </CardContent>
      </Card>

      {cita.estado === "Cancelada" && (
        <Card className="border-destructive/30 py-0">
          <CardContent className="px-4 pt-2 pb-5 md:px-6">
            <h2 className="text-foreground text-sm font-semibold">
              Cancelacion
            </h2>
            <Separator className="my-2" />
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <DatoCita etiqueta="Fecha de cancelacion">
                {formatearFechaHoraLocal(cita.fechaCancelacion)}
              </DatoCita>
              <DatoCita etiqueta="Motivo de cancelacion">
                {cita.motivoCancelacion ?? "Sin motivo registrado"}
              </DatoCita>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DatoCita({
  etiqueta,
  className,
  children,
}: {
  etiqueta: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground text-xs">{etiqueta}</dt>
      <dd className="text-foreground mt-0.5 text-sm break-words">{children}</dd>
    </div>
  );
}

function EstadoErrorCita({ mensaje }: { mensaje: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 md:px-8">
      <Card className="border-destructive/40">
        <CardContent className="px-6 py-14 text-center">
          <h1 className="text-foreground text-xl font-bold">
            No pudimos cargar la cita
          </h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
            {mensaje}
          </p>
          <Button asChild className="mt-6">
            <Link to="/citas">Volver a citas</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DetalleSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <Skeleton className="mb-4 h-5 w-24" />
      <div className="bg-card overflow-hidden rounded-xl border border-border shadow-card">
        <div className="flex items-center gap-4 px-4 py-5 md:px-6">
          <Skeleton className="size-11 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
      <div className="bg-card mt-4 overflow-hidden rounded-xl border border-border shadow-card">
        <div className="space-y-3 px-4 py-5 md:px-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
    </div>
  );
}
