import { useState } from "react";
import { CalendarOff, Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Seccion } from "@/components/ficha/seccion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogoAusencia } from "@/features/nutricionistas/components/dialogo-ausencia";
import { DialogoHorario } from "@/features/nutricionistas/components/dialogos-horario";
import { useAusencias, useEliminarAusencia, useHorarios } from "@/features/nutricionistas/hooks/use-nutricionistas";
import { describirAusencia, resumenSemana } from "@/features/nutricionistas/lib/horario";
import { mensajeDeError } from "@/lib/api-error";
import { hoyEnClinica } from "@/lib/zona-horaria";
import type { Nutricionista } from "@/types/api";

/** Horario efectivo de la persona, con la duracion de sus consultas. */
export function SeccionHorario({ persona, editable }: { persona: Nutricionista; editable: boolean }) {
  const horarios = useHorarios();
  const [editando, setEditando] = useState(false);
  const datos = horarios.data?.personas.find((p) => p.nutricionistaId === persona.id);
  const filas = datos ? resumenSemana(datos.bloques) : [];

  return (
    <Seccion
      titulo="Horario de atención"
      icono={Clock}
      meta={datos ? (datos.horarioPropio ? "Propio" : "El de la clínica") : undefined}
      acciones={
        editable && horarios.data ? (
          <Button variant="ghost" size="sm" onClick={() => setEditando(true)}>
            <Pencil className="size-3.5" />
            Editar
          </Button>
        ) : undefined
      }
    >
      {horarios.isPending ? (
        <Skeleton className="h-16 w-full" />
      ) : horarios.isError ? (
        <p className="text-destructive text-sm">{mensajeDeError(horarios.error)}</p>
      ) : (
        <div className="space-y-3 text-sm">
          {filas.length === 0 ? (
            <p className="text-muted-foreground">
              {datos?.horarioPropio ? "Sin días de atención: no se le pueden agendar citas." : "Sin horario configurado: se le puede agendar a cualquier hora."}
            </p>
          ) : (
            <ul className="space-y-1">
              {filas.map((fila) => (
                <li key={fila} className="text-foreground tabular-nums">
                  {fila}
                </li>
              ))}
            </ul>
          )}
          {datos && (
            <p className="text-muted-foreground text-xs">
              Consultas de {datos.duracionConsultaMinutos} min por defecto.
            </p>
          )}
        </div>
      )}

      {horarios.data && (
        <DialogoHorario abierto={editando} onOpenChange={setEditando} persona={persona} horarios={horarios.data} />
      )}
    </Seccion>
  );
}

/** Vacaciones y dias bloqueados que vienen. */
export function SeccionAusencias({ persona, editable }: { persona: Nutricionista; editable: boolean }) {
  const ausencias = useAusencias();
  const eliminar = useEliminarAusencia();
  const [creando, setCreando] = useState(false);
  const propias = (ausencias.data ?? []).filter((a) => a.nutricionistaId === persona.id);
  const hoy = hoyEnClinica();

  const quitar = (ausenciaId: string) =>
    eliminar.mutate(
      { id: persona.id, ausenciaId },
      {
        onSuccess: () => toast.success("Ausencia eliminada"),
        onError: (error) => toast.error("No se pudo eliminar", { description: mensajeDeError(error) }),
      },
    );

  return (
    <Seccion
      titulo="Ausencias"
      icono={CalendarOff}
      meta={propias.length > 0 ? `${propias.length} próximas` : undefined}
      acciones={
        editable ? (
          <Button variant="ghost" size="sm" onClick={() => setCreando(true)}>
            <Plus className="size-3.5" />
            Registrar
          </Button>
        ) : undefined
      }
    >
      {ausencias.isPending ? (
        <Skeleton className="h-12 w-full" />
      ) : propias.length === 0 ? (
        <p className="text-muted-foreground text-sm">Sin vacaciones ni días bloqueados próximos.</p>
      ) : (
        <ul className="space-y-2">
          {propias.map((a) => {
            const enCurso = a.fechaInicio <= hoy;
            return (
              <li key={a.id} className="bg-surface-subtle flex items-center gap-3 rounded-lg border px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block truncate text-sm font-medium">{describirAusencia(a)}</span>
                  {enCurso && <span className="text-warning-soft-foreground text-xs font-medium">Ausente ahora</span>}
                </span>
                {editable && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Eliminar ausencia: ${describirAusencia(a)}`}
                    onClick={() => quitar(a.id)}
                    disabled={eliminar.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <DialogoAusencia abierto={creando} onOpenChange={setCreando} persona={persona} />
    </Seccion>
  );
}
