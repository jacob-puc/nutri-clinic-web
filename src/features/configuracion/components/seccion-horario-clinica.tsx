import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { EstadoError } from "@/components/states/estado-error";
import { Button } from "@/components/ui/button";
import { AlertaFormulario } from "@/components/ui/grupo-campos";
import { Skeleton } from "@/components/ui/skeleton";
import { EditorHorario } from "@/features/nutricionistas/components/editor-horario";
import { useActualizarHorarioClinica, useHorarios } from "@/features/nutricionistas/hooks/use-nutricionistas";
import { problemaBloques } from "@/features/nutricionistas/lib/horario";
import { mensajeDeError } from "@/lib/api-error";
import type { BloqueHorario, Horarios } from "@/types/api";

/** Horario general: lo usa todo el que no tiene uno propio. */
export function SeccionHorarioClinica() {
  const horarios = useHorarios();

  if (horarios.isPending) {
    return (
      <div className="hoja mx-auto max-w-3xl space-y-4 rounded-[1.25rem] p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (horarios.isError) {
    return (
      <EstadoError
        titulo="No pudimos cargar el horario"
        mensaje={mensajeDeError(horarios.error)}
        onReintentar={horarios.refetch}
      />
    );
  }
  return <Formulario horarios={horarios.data} />;
}

function Formulario({ horarios }: { horarios: Horarios }) {
  const guardar = useActualizarHorarioClinica();
  const [bloques, setBloques] = useState<BloqueHorario[]>(horarios.clinica);
  const [error, setError] = useState<string | null>(null);
  const usanClinica = horarios.personas.filter((p) => !p.horarioPropio).length;

  const enviar = async () => {
    setError(null);
    const problema = problemaBloques(bloques);
    if (problema) return setError(problema);
    try {
      await guardar.mutateAsync(bloques);
      toast.success("Horario de la clínica guardado");
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  return (
    <div className="hoja mx-auto max-w-3xl space-y-5 rounded-[1.25rem] p-5 md:p-6">
      <p className="text-muted-foreground text-sm">
        {usanClinica === 0
          ? "Nadie lo usa ahora: todo el equipo tiene horario propio."
          : `Lo ${usanClinica === 1 ? "usa 1 persona" : `usan ${usanClinica} personas`} sin horario propio.`}
      </p>

      <EditorHorario bloques={bloques} onChange={setBloques} />
      {bloques.length === 0 && (
        <p className="text-muted-foreground text-xs">
          Sin bloques, a quien use el horario de la clínica se le podrá agendar a cualquier hora.
        </p>
      )}

      {error && <AlertaFormulario>{error}</AlertaFormulario>}

      <div className="flex justify-end">
        <Button type="button" onClick={() => void enviar()} disabled={guardar.isPending}>
          {guardar.isPending && <Loader2 className="size-4 animate-spin" />}
          Guardar horario
        </Button>
      </div>
    </div>
  );
}
