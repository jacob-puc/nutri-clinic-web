import { useState } from "react";
import { CalendarDays, ExternalLink, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

import { AccionesCita } from "@/features/citas/components/acciones-cita";
import { BadgeEstadoCita } from "@/features/citas/components/badge-estado-cita";
import { DialogoCita } from "@/features/citas/components/dialogo-cita";
import {
  formatearFechaHoraLocal,
  formatearFechaLargaLocal,
  formatearHoraLocal,
} from "@/features/citas/lib/fechas-cita";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Cita } from "@/types/api";

interface DetalleCitaSheetProps {
  cita: Cita | undefined;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
}

export function DetalleCitaSheet({
  cita,
  abierto,
  onOpenChange,
}: DetalleCitaSheetProps) {
  const [editando, setEditando] = useState(false);

  if (!cita) return null;

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b border-border pr-12">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-lg">
              <CalendarDays className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate">{cita.pacienteNombre}</SheetTitle>
              <SheetDescription className="mt-1">
                {formatearFechaLargaLocal(cita.fechaInicio)} ·{" "}
                {formatearHoraLocal(cita.fechaInicio)} - {formatearHoraLocal(cita.fechaFin)}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <BadgeEstadoCita estado={cita.estado} />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
              <AccionesCita cita={cita} />
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <DatoCita etiqueta="Paciente">
              <Link
                to={`/pacientes/${cita.pacienteId}`}
                className="hover:underline"
                onClick={() => onOpenChange(false)}
              >
                {cita.pacienteNombre}
              </Link>
            </DatoCita>
            <DatoCita etiqueta="Nutricionista">{cita.nutricionistaNombre}</DatoCita>
            <DatoCita etiqueta="Inicio">{formatearFechaHoraLocal(cita.fechaInicio)}</DatoCita>
            <DatoCita etiqueta="Fin">{formatearFechaHoraLocal(cita.fechaFin)}</DatoCita>
            <DatoCita etiqueta="Motivo" className="sm:col-span-2">
              {cita.motivo ?? "Sin motivo registrado"}
            </DatoCita>
            {cita.consultaId && (
              <DatoCita etiqueta="Consulta" className="sm:col-span-2">
                Vinculada a una consulta clínica
              </DatoCita>
            )}
          </dl>

          {cita.estado === "Cancelada" && (
            <div className="border-destructive/30 rounded-lg border p-3">
              <p className="text-sm font-semibold">Cancelacion</p>
              <Separator className="my-2" />
              <dl className="grid gap-3 sm:grid-cols-2">
                <DatoCita etiqueta="Fecha">{formatearFechaHoraLocal(cita.fechaCancelacion)}</DatoCita>
                <DatoCita etiqueta="Motivo">{cita.motivoCancelacion ?? "Sin motivo registrado"}</DatoCita>
              </dl>
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-border">
          <Button asChild variant="outline" className="w-full">
            <Link to={`/citas/${cita.id}`} onClick={() => onOpenChange(false)}>
              <ExternalLink className="size-4" />
              Abrir ficha completa
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>

      <DialogoCita abierto={editando} onOpenChange={setEditando} cita={cita} />
    </Sheet>
  );
}

function DatoCita({
  etiqueta,
  className,
  children,
}: {
  etiqueta: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground text-xs">{etiqueta}</dt>
      <dd className="text-foreground mt-0.5 text-sm break-words">{children}</dd>
    </div>
  );
}