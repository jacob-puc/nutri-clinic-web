import { useState } from "react";

import { Progress } from "@/components/ui/progress";
import { DialogoObjetivo } from "@/features/pacientes/components/dialogo-objetivo";
import { useActualizarObjetivo } from "@/features/pacientes/hooks/use-mutaciones-paciente";
import { cn } from "@/lib/utils";
import type { MedidaAntropometrica, Paciente } from "@/types/api";

/**
 * Avance = recorrido hecho sobre recorrido total. El denominador sale negativo
 * en objetivos de subida de peso y la division se cancela sola, sin branching.
 */
export function calcularAvance(
  pesoInicial: number,
  pesoActual: number,
  pesoObjetivo: number,
) {
  const recorrido = pesoInicial - pesoObjetivo;
  if (recorrido === 0) return null;

  const crudo = ((pesoInicial - pesoActual) / recorrido) * 100;

  return {
    progreso: Math.min(100, Math.max(0, crudo)),
    alcanzado: crudo >= 100,
  };
}

/**
 * Objetivo del paciente como rail de avance: etiqueta micro, meta legible y
 * el porcentaje a la derecha, del mismo estilo que las constantes de la ficha.
 */
export function LineaObjetivo({
  paciente,
  medidas,
  className,
}: {
  paciente: Paciente;
  medidas: MedidaAntropometrica[];
  className?: string;
}) {
  const [editando, setEditando] = useState(false);
  const guardar = useActualizarObjetivo(paciente.id);

  const { tituloObjetivo, pesoObjetivo } = paciente;
  const definido = Boolean(tituloObjetivo) || pesoObjetivo !== null;

  const ordenadas = [...medidas].sort((a, b) =>
    a.fechaMedicion.localeCompare(b.fechaMedicion),
  );
  const inicial = ordenadas[0];
  const actual = ordenadas.at(-1);

  const avance =
    pesoObjetivo !== null && inicial && actual
      ? calcularAvance(inicial.peso, actual.peso, pesoObjetivo)
      : null;

  return (
    <>
      <div className={cn("min-w-0", className)}>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="group flex w-full items-baseline gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-muted-foreground text-xs font-medium">
            Objetivo
          </span>

          <span className="text-foreground truncate text-sm font-medium underline-offset-4 group-hover:underline">
            {!definido ? (
              <span className="text-muted-foreground-subtle italic">
                sin definir
              </span>
            ) : (
              <>
                {tituloObjetivo ?? "Peso"}
                {pesoObjetivo !== null && ` · ${pesoObjetivo} kg`}
              </>
            )}
          </span>

          {avance && (
            <span className="text-primary ml-auto shrink-0 text-sm font-semibold tabular-nums">
              {Math.round(avance.progreso)}%
            </span>
          )}
        </button>

        {avance && (
          <Progress
            value={avance.progreso}
            aria-label="Avance del objetivo de peso"
            className="mt-2 h-1.5 w-full [&>[data-slot=progress-indicator]]:bg-primary"
          />
        )}
      </div>

      <DialogoObjetivo
        abierto={editando}
        onOpenChange={setEditando}
        paciente={paciente}
        onGuardar={(datos) => guardar.mutateAsync(datos)}
        guardando={guardar.isPending}
      />
    </>
  );
}
